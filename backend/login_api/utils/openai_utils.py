# utils/openai_utils.py
import os
import json
from typing import Any, Dict, List
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Allow switching to a stronger model without code edits
SUMMARY_MODEL = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4o-mini")
# Total tokens for response; large enough for 800-word summary + quiz/flashcards
MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "2000"))
# Minimum words we consider "deep enough" before triggering the expand pass
MIN_SUMMARY_WORDS = int(os.getenv("OPENAI_MIN_SUMMARY_WORDS", "350"))

SYSTEM_PROMPT = (
    "You are an AI study assistant. Return STRICT JSON with this exact schema:\n"
    "{\n"
    '  "summary": "string",\n'
    '  "keyTakeaways": ["string", "..."],\n'
    '  "flashcards": [{"front": "string", "back": "string"}],\n'
    '  "quiz": [\n'
    '    {\n'
    '      "question": "string",\n'
    '      "options": ["string","string","string","string"],\n'
    '      "answerIndex": 0,\n'
    '      "explanation": "string"\n'
    '    }\n'
    "  ]\n"
    "}\n"
    "\n"
    "Summary rules:\n"
    "- Write a DEEP, EXPLANATORY, paraphrased summary (do NOT copy the document sentences).\n"
    "- If equations appear, explain symbols, steps, and intuition (what/why/how, assumptions, units when useful).\n"
    "- Provide context, motivations, and practical implications.\n"
    "- Prefer short subsection headings for clarity.\n"
    "- Length: roughly 450–800 words, unless the input is very short.\n"
    "\n"
    "KeyTakeaways rules:\n"
    "- 6–10 concise bullets; avoid duplicating full sentences from the summary; keep punchy and testable.\n"
    "\n"
    "Flashcards rules:\n"
    "- 8–12 cards; front is a term/question, back is the answer/definition; include important equations with variable meanings.\n"
    "\n"
    "Quiz rules:\n"
    "- 6–10 MCQs; 4 options; exactly one correct answer via answerIndex; each MUST include a brief explanation.\n"
    "\n"
    "Return ONLY valid JSON. No markdown, no comments, no extra keys."
)

USER_PROMPT_TEMPLATE = (
    "From the following text, produce the JSON as specified. Make the summary deeply explanatory with thorough paraphrasing.\n\n"
    "TEXT (truncated):\n{chunk}"
)

# Second-pass expander if the first summary is too short.
EXPAND_SYSTEM = (
    "You are an AI writing assistant. Return STRICT JSON with this exact schema:\n"
    "{ \"summary\": \"string\" }\n"
    "No markdown, no extra keys."
)

EXPAND_USER_TEMPLATE = (
    "Expand and deepen the following summary to 450–800 words, keeping it fully paraphrased (no copying). "
    "Explain any equations (each symbol’s meaning, steps/intuition, assumptions, units if helpful). "
    "Add context, motivations, and practical implications. Keep it clear and well-structured with short headings.\n\n"
    "ORIGINAL DOCUMENT (truncated):\n{chunk}\n\n"
    "CURRENT SUMMARY (too short):\n{current}"
)

# -------------------- Normalization utilities --------------------

def _to_option_array(options: Any) -> List[str]:
    """
    Accepts either a list of strings/numbers or a dict like {A: '...', B: '...'} and returns a clean list.
    """
    if isinstance(options, list):
        cleaned = [str(o) for o in options if isinstance(o, (str, int, float))]
        return [s.strip() for s in cleaned if s.strip()]
    if isinstance(options, dict):
        items = sorted(options.items(), key=lambda kv: str(kv[0]))  # A,B,C,D order
        cleaned = [str(v).strip() for _, v in items if str(v).strip()]
        return cleaned
    return []

def _value_to_index(v: Any, options: List[str]) -> int | None:
    if isinstance(v, int) and 0 <= v < len(options):
        return v
    if isinstance(v, str):
        s = v.strip()
        # letter like "A"/"b"
        if len(s) == 1 and s.upper() in ["A", "B", "C", "D", "E", "F"]:
            li = ord(s.upper()) - ord("A")
            return li if 0 <= li < len(options) else None
        # exact option text
        for i, opt in enumerate(options):
            if opt.strip() == s:
                return i
    return None

def _normalize_quiz(quiz: Any) -> List[Dict[str, Any]]:
    """
    Ensure each quiz item has: question (str), options (list[str] >= 2),
    answerIndex (int in range), and explanation (str).
    """
    out: List[Dict[str, Any]] = []
    if not isinstance(quiz, list):
        return out

    for i, raw in enumerate(quiz):
        if not isinstance(raw, dict):
            continue

        question = str(raw.get("question", f"Question {i+1}")).strip()
        options = _to_option_array(raw.get("options"))
        if len(options) < 2:
            continue

        # truncate to 4 to match UI
        if len(options) > 4:
            options = options[:4]

        # answer index
        answer_index = raw.get("answerIndex", None)
        if not isinstance(answer_index, int) or not (0 <= answer_index < len(options)):
            candidate = raw.get("correct", raw.get("answer", raw.get("correctIndex", raw.get("correctOption"))))
            ai = _value_to_index(candidate, options)
            answer_index = ai if ai is not None else 0

        explanation = str(raw.get("explanation", "")).strip()
        if not explanation:
            explanation = f'The correct answer is "{options[answer_index]}".'

        out.append(
            {
                "question": question,
                "options": options,
                "answerIndex": answer_index,
                "explanation": explanation,
            }
        )
    return out

def _string_list(x: Any, lo: int = 0, hi: int | None = None) -> List[str]:
    if not isinstance(x, list):
        return []
    items = [str(i).strip() for i in x if isinstance(i, (str, int, float)) and str(i).strip()]
    if hi is not None:
        items = items[:hi]
    return items

# -------------------- Main generator --------------------

def generate_summary_flashcards_quiz(text: str) -> Dict[str, Any]:
    # keep within safe context
    chunk = text[:20000]  # give the model a bit more to work with

    resp = client.chat.completions.create(
        model=SUMMARY_MODEL,
        temperature=0.2,
        max_tokens=MAX_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(chunk=chunk)},
        ],
    )

    raw = resp.choices[0].message.content
    try:
        data = json.loads(raw)
    except Exception:
        data = {}

    # Harden structure
    summary = data.get("summary", "")
    if not isinstance(summary, str):
        summary = str(summary or "")
    key_takeaways = _string_list(data.get("keyTakeaways", []), hi=10)

    # If the summary is too short, run a second pass to expand it.
    if len(summary.split()) < MIN_SUMMARY_WORDS:
        try:
            expand = client.chat.completions.create(
                model=SUMMARY_MODEL,
                temperature=0.3,
                max_tokens=MAX_TOKENS,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": EXPAND_SYSTEM},
                    {"role": "user", "content": EXPAND_USER_TEMPLATE.format(chunk=chunk, current=summary)},
                ],
            )
            expanded_raw = expand.choices[0].message.content
            expanded_json = json.loads(expanded_raw)
            expanded_summary = expanded_json.get("summary", "")
            if isinstance(expanded_summary, str) and len(expanded_summary.split()) > len(summary.split()):
                summary = expanded_summary
        except Exception:
            # If expand pass fails, keep the original summary
            pass

    # Flashcards
    flashcards_raw = data.get("flashcards", [])
    flashcards: List[Dict[str, str]] = []
    if isinstance(flashcards_raw, list):
        for c in flashcards_raw:
            if isinstance(c, dict):
                f = str(c.get("front", "")).strip()
                b = str(c.get("back", "")).strip()
                if f and b:
                    flashcards.append({"front": f, "back": b})
    flashcards = flashcards[:20]

    # Quiz
    quiz = _normalize_quiz(data.get("quiz", []))

    return {
        "summary": summary,
        "keyTakeaways": key_takeaways,
        "flashcards": flashcards,
        "quiz": quiz,
    }
