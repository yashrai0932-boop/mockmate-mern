"""
Resume API routes - upload, parse, and manage resumes.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeUploadResponse, ResumeListResponse
from app.services.resume_service import (
    save_upload,
    extract_text,
    parse_resume_with_ai,
    generate_summary,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload and parse a resume (PDF or DOCX)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    # Read and save file
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    file_path, file_type = save_upload(content, file.filename)

    # Extract text
    try:
        raw_text = extract_text(file_path, file_type)
        if not raw_text:
            raise HTTPException(status_code=400, detail="Document appears to be empty or is an image-based scan. Please upload a text-based PDF or DOCX.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Parse with AI
    parsed_data = await parse_resume_with_ai(raw_text)

    # Generate candidate summary
    candidate_summary = None
    if parsed_data:
        candidate_summary = await generate_summary(parsed_data)

    # Save to DB
    resume = Resume(
        user_id=current_user.id,
        file_path=file_path,
        file_name=file.filename,
        file_type=file_type,
        raw_text=raw_text,
        parsed_data=parsed_data,
        candidate_summary=candidate_summary,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeUploadResponse.model_validate(resume)


@router.get("/list", response_model=ResumeListResponse)
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all resumes for the current user."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return ResumeListResponse(
        resumes=[ResumeUploadResponse.model_validate(r) for r in resumes]
    )


@router.get("/{resume_id}", response_model=ResumeUploadResponse)
def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific resume."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeUploadResponse.model_validate(resume)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific resume."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Optional: Delete file from disk if file_path is set and exists
    if resume.file_path:
        import os
        if os.path.exists(resume.file_path):
            try:
                os.remove(resume.file_path)
            except Exception:
                pass
                
    db.delete(resume)
    db.commit()
    return None
