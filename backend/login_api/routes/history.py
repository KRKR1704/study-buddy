from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Response, Request
from typing import List, Optional
from datetime import datetime
import asyncio
from bson import ObjectId

from config.db import db, fs
from models.history_model import HistoryCreate, HistoryOut
from utils.auth_utils import get_user_id_from_token

router = APIRouter(prefix="/history", tags=["History"])

def _to_str_id(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.post("", response_model=HistoryOut)
async def create_history(payload: HistoryCreate, request: Request):
    # ensure the caller is the owner; prefer Authorization header but accept token query param
    token = None
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1]
    elif "token" in request.query_params:
        token = request.query_params.get("token")
    user_id = get_user_id_from_token(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    doc = payload.model_dump(by_alias=True, exclude_none=True)
    # override any provided user_id with the token-derived one
    doc["user_id"] = user_id
    # Sanitize stored fields based on the declared kind to avoid accidental
    # mixing of summary/flashcards/quiz when clients send extra data.
    kind = doc.get("kind")
    if kind == "quiz":
        doc.pop("summary", None)
        doc.pop("key_takeaways", None)
        doc.pop("flashcards", None)
    elif kind == "upload":
        # uploads are file-only records; don't store summary/quiz unless explicit
        doc.pop("summary", None)
        doc.pop("key_takeaways", None)
        doc.pop("flashcards", None)
        doc.pop("quiz", None)

    doc["created_at"] = datetime.utcnow()
    res = await db.history.insert_one(doc)
    saved = await db.history.find_one({"_id": res.inserted_id})
    return _to_str_id(saved)

@router.post("/upload", response_model=HistoryOut)
async def upload_history_file(request: Request, kind: str = Query("upload"), title: str = Query("Uploaded file"), file: UploadFile = File(...)):
    # determine caller from Authorization header or token query param
    token = None
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1]
    elif "token" in request.query_params:
        token = request.query_params.get("token")
    user_id = get_user_id_from_token(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    data = await file.read()
    # GridFS is blocking (sync). Run in a thread to avoid blocking the event loop.
    grid_id = await asyncio.to_thread(lambda: fs.put(data, filename=file.filename, content_type=file.content_type))
    doc = {
        "user_id": user_id,
        "kind": kind,
        "title": title,
        "source_filename": file.filename,
        "source_file_id": str(grid_id),
        "created_at": datetime.utcnow(),
    }
    res = await db.history.insert_one(doc)
    saved = await db.history.find_one({"_id": res.inserted_id})
    return _to_str_id(saved)

@router.get("", response_model=List[HistoryOut])
async def list_history(request: Request, kind: Optional[str] = None, skip: int = 0, limit: int = 50):
    token = None
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1]
    elif "token" in request.query_params:
        token = request.query_params.get("token")
    user_id = get_user_id_from_token(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    q = {"user_id": user_id}
    if kind:
        q["kind"] = kind
    cursor = db.history.find(q).sort("created_at", -1).skip(skip).limit(min(limit, 100))
    return [_to_str_id(doc) async for doc in cursor]

@router.get("/{history_id}", response_model=HistoryOut)
async def get_history(history_id: str, request: Request):
    try:
        oid = ObjectId(history_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid history id")
    token = None
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1]
    elif "token" in request.query_params:
        token = request.query_params.get("token")
    user_id = get_user_id_from_token(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    query = {"_id": oid, "user_id": user_id}
    doc = await db.history.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return _to_str_id(doc)

@router.get("/{history_id}/download/{file_id}")
async def download_file(history_id: str, file_id: str, request: Request):
    # authorize
    try:
        oid = ObjectId(history_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid history id")
    token = None
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1]
    elif "token" in request.query_params:
        token = request.query_params.get("token")
    user_id = get_user_id_from_token(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    query = {"_id": oid, "user_id": user_id}
    doc = await db.history.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    # fetch from GridFS
    try:
        # fetch the GridFS object in a thread
        def _fetch():
            g = fs.get(ObjectId(file_id))
            return (g.read(), getattr(g, "content_type", None), getattr(g, "filename", None))

        content, content_type, filename = await asyncio.to_thread(_fetch)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

    return Response(
        content=content,
        media_type=content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename or "download"}"'}
    )

@router.post("/{history_id}/attach")
async def attach_file(history_id: str, request: Request, file: UploadFile = File(...)):
    try:
        oid = ObjectId(history_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid history id")

    token = None
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1]
    elif "token" in request.query_params:
        token = request.query_params.get("token")
    user_id = get_user_id_from_token(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    doc = await db.history.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    data = await file.read()
    grid_id = await asyncio.to_thread(lambda: fs.put(data, filename=file.filename, content_type=file.content_type))

    await db.history.update_one(
        {"_id": oid},
        {"$push": {"derived_file_ids": str(grid_id)}}
    )
    return {"ok": True, "file_id": str(grid_id)}
