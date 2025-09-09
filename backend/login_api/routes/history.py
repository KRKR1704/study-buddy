# backend/routes/history.py  (sync / PyMongo version)

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from fastapi.responses import StreamingResponse, JSONResponse
from bson import ObjectId
from gridfs import GridFS

# Import your db handle and repo functions
from login_api.config.db import db  # <-- this is your PyMongo db from config/db.py
from login_api.repositories.history_repo import (
    create_history,
    get_history,
    get_history_item,
)
from login_api.models.history_model import HistoryItem  # response model
# If you also created a separate "HistoryItemCreate" pydantic model, import it here
# from login_api.models.history_model import HistoryItemCreate

router = APIRouter(prefix="/api/history", tags=["history"])

@router.post("", response_model=HistoryItem)
def add_history(item: dict):  # or: (item: HistoryItemCreate) if you defined it
    """
    Create a history record. Keep it sync to match PyMongo.
    """
    # If you have auth, derive user_id from token and ignore any user_id in body.
    return create_history(item)

@router.get("", response_model=dict)
def list_history(
    user_id: str,
    source: Optional[str] = Query(default=None),
    limit: int = 20,
    cursor: Optional[str] = None,
):
    """
    List history for a user with simple keyset pagination.
    """
    res = get_history(user_id=user_id, source=source, limit=limit, cursor=cursor)
    return {
        "items": [i.model_dump(by_alias=True) for i in res["items"]],
        "next_cursor": res["next_cursor"],
    }

@router.get("/{item_id}", response_model=HistoryItem)
def get_item(item_id: str):
    """
    Fetch a single history item.
    """
    item = get_history_item(item_id)
    if not item:
        raise HTTPException(404, "Not found")
    return item

@router.get("/{item_id}/download")
def download_original_file(item_id: str):
    """
    Streams the original uploaded file if file_id exists from GridFS.

    If you're using S3/GCS instead of GridFS, replace this section to
    generate a pre-signed URL and RedirectResponse.
    """
    item = get_history_item(item_id)
    if not item or not item.file_id:
        raise HTTPException(404, "File not found for this history item")

    # GridFS (sync) example
    try:
        fs = GridFS(db)  # uses the same db from config/db.py
        grid_out = fs.get(ObjectId(item.file_id))
    except Exception:
        return JSONResponse({"error": "File not available in storage."}, status_code=404)

    filename = item.file_name or "file"

    def iter_chunks(chunk_size: int = 1024 * 1024):
        while True:
            chunk = grid_out.read(chunk_size)
            if not chunk:
                break
            yield chunk

    return StreamingResponse(
        iter_chunks(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
