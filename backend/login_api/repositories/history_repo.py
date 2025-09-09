from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId
from login_api.models.history_model import HistoryItem
from login_api.config.db import history_collection  # add this in config/db.py

def create_history(data: dict) -> HistoryItem:
    data["created_at"] = datetime.utcnow()
    data["updated_at"] = datetime.utcnow()
    res = history_collection.insert_one(data)
    data["_id"] = res.inserted_id
    return HistoryItem(**data)

def get_history(user_id: str, source: Optional[str] = None, limit: int = 20, cursor: Optional[str] = None) -> Dict[str, Any]:
    q: Dict[str, Any] = {"user_id": user_id}
    if source:
        q["source"] = source
    if cursor:
        q["_id"] = {"$lt": ObjectId(cursor)}

    cur = history_collection.find(q).sort("_id", -1).limit(limit)
    items = [HistoryItem(**doc) for doc in cur]
    next_cursor = str(items[-1].id) if items else None
    return {"items": items, "next_cursor": next_cursor}

def get_history_item(item_id: str) -> Optional[HistoryItem]:
    doc = history_collection.find_one({"_id": ObjectId(item_id)})
    return HistoryItem(**doc) if doc else None
