from fastapi import APIRouter, UploadFile, File
import os, shutil
from utils.extract_text import extract_text_from_file
from utils.openai_utils import generate_summary_flashcards_quiz

router = APIRouter()

@router.post("/summarize/")
async def summarize_file(file: UploadFile = File(...)):
    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{file.filename}"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        text = extract_text_from_file(file_path)
        result = generate_summary_flashcards_quiz(text)
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}
