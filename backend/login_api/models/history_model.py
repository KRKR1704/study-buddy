# backend/login_api/models/history_model.py
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

HistoryKind = Literal["summary", "flashcards", "quiz", "upload"]

class HistoryCreate(BaseModel):
    user_id: str
    kind: HistoryKind
    title: str
    source_filename: Optional[str] = None          # original file name (if any)
    source_file_id: Optional[str] = None           # GridFS ObjectId (str) if file attached
    derived_file_ids: Optional[List[str]] = None   # any exported files saved to GridFS (pdf/csv/etc.)
    summary: Optional[str] = None                  # plain text summary
    key_takeaways: Optional[List[str]] = None
    flashcards: Optional[List[Dict[str, Any]]] = None  # [{"q": "...", "a": "..."}]
    quiz: Optional[Dict[str, Any]] = None               # {"questions":[...], "score":...}
    meta: Optional[Dict[str, Any]] = None

class HistoryOut(HistoryCreate):
    id: str = Field(alias="_id")
    created_at: datetime
