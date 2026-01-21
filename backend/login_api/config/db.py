# backend/login_api/db.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from gridfs import GridFS
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("MONGO_DB", "study_buddy")

# Motor for async ops
motor_client = AsyncIOMotorClient(MONGO_URI)
db = motor_client[DB_NAME]

# GridFS requires a sync client handle for file-like streaming
_sync_client = MongoClient(MONGO_URI)
_sync_db = _sync_client[DB_NAME]
fs = GridFS(_sync_db)

# Synchronous collections for parts of the code that use pymongo sync API
user_collection = _sync_db["users"]
history_collection = _sync_db["history"]
pending_signup_collection = _sync_db["pending_signups"]
