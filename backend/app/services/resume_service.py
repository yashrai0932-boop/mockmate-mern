"""
Resume Service - handles resume parsing, text extraction, and ChromaDB storage.
"""

import os
import uuid
import logging
from typing import Optional

import fitz  # PyMuPDF
from docx import Document

from app.ai.nim_service import nim_service

logger = logging.getLogger(__name__)

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise ValueError(f"PDF Extraction Error: {str(e)}")


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {e}")
        raise ValueError(f"DOCX Extraction Error: {str(e)}")


def extract_text(file_path: str, file_type: str) -> str:
    """Extract text from a resume file based on type."""
    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type == "docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


async def parse_resume_with_ai(raw_text: str) -> Optional[dict]:
    """Use NIM to extract structured data from resume text."""
    if not raw_text or len(raw_text) < 50:
        logger.warning("Resume text too short for AI parsing")
        return {
            "skills": [],
            "projects": [],
            "education": [],
            "experience": [],
            "certifications": [],
            "technologies": [],
        }
    return await nim_service.parse_resume(raw_text)


async def generate_summary(parsed_data: dict) -> Optional[str]:
    """Generate compressed candidate summary for AI optimization."""
    return await nim_service.generate_candidate_summary(parsed_data)


def save_upload(file_content: bytes, original_filename: str) -> tuple:
    """Save uploaded file and return (file_path, file_type)."""
    ext = original_filename.rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx"):
        raise ValueError("Only PDF and DOCX files are supported")

    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(file_content)

    return file_path, ext
