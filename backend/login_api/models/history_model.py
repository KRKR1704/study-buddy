# login_api/models/history_model.py
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from bson import ObjectId
from datetime import datetime

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        return ObjectId(v)

HistorySource = Literal["summarizer", "quiz"]

class Flashcard(BaseModel):
    front: str
    back: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str] = []
    answer: Optional[str] = None
    explanation: Optional[str] = None

class QuizPayload(BaseModel):
    title: Optional[str] = None
    questions: List[QuizQuestion] = []
    score: Optional[float] = None
    meta: Dict[str, Any] = {}

class HistoryItem(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    source: HistorySource
    file_name: Optional[str] = None
    file_id: Optional[str] = None
    content_text: Optional[str] = None
    summary: Optional[str] = None
    key_takeaways: List[str] = []
    flashcards: List[Flashcard] = []
    quiz: Optional[QuizPayload] = None
    tags: List[str] = []
    meta: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, PyObjectId: str, datetime: lambda d: d.isoformat()}
