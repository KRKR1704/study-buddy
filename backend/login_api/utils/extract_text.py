import fitz  # PyMuPDF
from docx import Document
from pptx import Presentation
import os

def extract_text_from_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[-1].lower()

    if ext == ".pdf":
        return extract_pdf(file_path)
    elif ext == ".docx":
        return extract_docx(file_path)
    elif ext == ".pptx":
        return extract_pptx(file_path)
    else:
        raise ValueError("Unsupported file format")

def extract_pdf(file_path):
    doc = fitz.open(file_path)
    text = "\n".join([page.get_text() for page in doc])
    return text

def extract_docx(file_path):
    doc = Document(file_path)
    return "\n".join([p.text for p in doc.paragraphs])

def extract_pptx(file_path):
    prs = Presentation(file_path)
    return "\n".join([shape.text for slide in prs.slides for shape in slide.shapes if hasattr(shape, "text")])
