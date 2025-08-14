import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_summary_flashcards_quiz(text: str):
    system_prompt = "You're an AI tutor helping students study better from documents."
    user_prompt = f"""Generate the following from this document:

1. **Summary** of the content.
2. **Flashcards** (as Q&A pairs).
3. **5 MCQ Quiz Questions** with options and correct answer.

Text:
{text[:4000]}"""  # 4K char limit to avoid token overflow

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )

    return response.choices[0].message['content']
