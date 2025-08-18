# routes/summarizer.py
from fastapi import APIRouter, UploadFile, File
import os, shutil, traceback

from utils.extract_text import extract_text_from_file
from utils.openai_utils import generate_summary_flashcards_quiz

router = APIRouter()

def _force_string(value) -> str:
    """Coerce any extractor/AI return payload to a text string safely."""
    if value is None:
        return ""
    # bytes -> str
    if isinstance(value, (bytes, bytearray)):
        try:
            return value.decode("utf-8", errors="ignore")
        except Exception:
            return value.decode("latin-1", errors="ignore")
    # list/tuple of chunks -> join
    if isinstance(value, (list, tuple)):
        try:
            return "\n".join(_force_string(v) for v in value)
        except Exception:
            return "\n".join(str(v) for v in value)
    # everything else
    return str(value)

def _normalize_flashcards(items):
    """Ensure flashcards are a list of {front:str, back:str}."""
    out = []
    if not isinstance(items, list):
        return out
    for it in items:
        try:
            front = _force_string(getattr(it, "front", None) if not isinstance(it, dict) else it.get("front"))
            back  = _force_string(getattr(it, "back",  None) if not isinstance(it, dict) else it.get("back"))
            if front.strip() and back.strip():
                out.append({"front": front.strip(), "back": back.strip()})
        except Exception:
            continue
    return out

def _to_option_array(opt):
    """Accept list or dict {A: '...', B: '...'} and return a list[str]."""
    if isinstance(opt, list):
        return [ _force_string(x).strip() for x in opt if _force_string(x).strip() ]
    if isinstance(opt, dict):
        # keep alphabetical order A,B,C,D...
        pairs = sorted(opt.items(), key=lambda kv: str(kv[0]))
        return [ _force_string(v).strip() for _, v in pairs if _force_string(v).strip() ]
    return []

def _letter_to_idx(s, n):
    if not isinstance(s, str):
        return None
    ch = s.strip().upper()[:1]
    if "A" <= ch <= "Z":
        idx = ord(ch) - 65
        return idx if 0 <= idx < n else None
    return None

def _value_to_idx(v, options):
    n = len(options)
    if isinstance(v, int):
        return v if 0 <= v < n else None
    if isinstance(v, str):
        # try letter (A/B/C/D)
        li = _letter_to_idx(v, n)
        if li is not None:
            return li
        # try exact text match
        try:
            i = options.index(v.strip())
            return i
        except ValueError:
            return None
    return None

def _normalize_quiz(items):
    """
    Normalize quiz into:
      [{ question:str, options:list[str], answerIndex:int, explanation?:str, category?:str }]
    Accepts many variants from the LLM.
    """
    out = []
    if not isinstance(items, list):
        return out

    for it in items:
        try:
            as_dict = it if isinstance(it, dict) else {}
            question = _force_string(as_dict.get("question")).strip()
            options  = _to_option_array(as_dict.get("options"))
            if not question or not options:
                continue

            # figure out the correct answer index
            idx = (
                _value_to_idx(as_dict.get("answerIndex"), options)
                or _value_to_idx(as_dict.get("correctIndex"), options)
                or _value_to_idx(as_dict.get("correctOption"), options)
                or _value_to_idx(as_dict.get("answer"), options)
                or _value_to_idx(as_dict.get("correct"), options)
            )
            if idx is None:
                idx = 0  # fallback

            explanation = _force_string(as_dict.get("explanation")).strip()
            if not explanation:
                explanation = f'The correct answer is "{options[idx]}".'
            category = _force_string(as_dict.get("category")).strip() or "General"

            out.append({
                "question": question,
                "options": options,
                "answerIndex": idx,
                "explanation": explanation,
                "category": category,
            })
        except Exception:
            continue

    return out

@router.post("/summarize/")
async def summarize_file(file: UploadFile = File(...)):
    os.makedirs("temp", exist_ok=True)
    file_path = os.path.join("temp", file.filename)

    try:
        # Save upload to disk
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        ext = os.path.splitext(file_path)[-1].lower()
        print(f"[SUMMARIZER] Received file: {file.filename} ext={ext} path={file_path}")

        # Extract text (coerce to safe string)
        raw_text = extract_text_from_file(file_path)
        text = _force_string(raw_text).strip()
        if not text:
            return {"success": False, "error": "The document appears to be empty or unreadable."}

        print(f"[SUMMARIZER] Extracted text length: {len(text)}")

        # Generate summary + study aids
        ai_out = generate_summary_flashcards_quiz(text)
        if not isinstance(ai_out, dict):
            return {"success": False, "error": "OpenAI returned an unexpected format."}

        # Normalize output so frontend always gets what it expects
        summary    = _force_string(ai_out.get("summary")).strip()
        flashcards = _normalize_flashcards(ai_out.get("flashcards"))
        quiz       = _normalize_quiz(ai_out.get("quiz"))

        if not summary:
            return {"success": False, "error": "Summary generation returned empty text."}

        return {
            "success": True,
            "data": {
                "summary": summary,
                "flashcards": flashcards,
                "quiz": quiz,
            },
        }

    except ValueError as ve:
        msg = str(ve)
        print(f"[SUMMARIZER][ValueError] {msg}")
        return {"success": False, "error": msg}

    except Exception as e:
        print("[SUMMARIZER][Exception]", e)
        traceback.print_exc()
        return {"success": False, "error": "Summarization failed on the server. Check backend logs for details."}

    finally:
        # Best-effort cleanup
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
