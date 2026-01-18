from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr
from config.db import user_collection, history_collection
from utils.auth_utils import get_user_id_from_token, hash_password, verify_password
from bson import ObjectId
from datetime import datetime

account_router = APIRouter()


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None


@account_router.get("/profile")
def get_profile(request: Request):
    auth = request.headers.get("Authorization") or request.query_params.get("token")
    if not auth:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.split(" ")[-1]
    uid = get_user_id_from_token(token)
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = user_collection.find_one({"_id": ObjectId(uid)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # don't return password or sensitive fields
    user.pop("password", None)
    user.pop("reset_token", None)
    user.pop("reset_expires", None)
    user["user_id"] = str(user.get("_id"))
    user.pop("_id", None)
    return {"success": True, "data": user}


@account_router.put("/profile")
def update_profile(request: Request, payload: ProfileUpdate):
    auth = request.headers.get("Authorization") or request.query_params.get("token")
    if not auth:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.split(" ")[-1]
    uid = get_user_id_from_token(token)
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    updates = {}
    if payload.first_name is not None:
        updates["first_name"] = payload.first_name
    if payload.last_name is not None:
        updates["last_name"] = payload.last_name
    if payload.email is not None:
        # ensure uniqueness
        exists = user_collection.find_one({"email": payload.email, "_id": {"$ne": ObjectId(uid)}})
        if exists:
            raise HTTPException(status_code=400, detail="Email already in use")
        updates["email"] = payload.email

    if not updates:
        return {"success": True, "message": "No changes"}

    user_collection.update_one({"_id": ObjectId(uid)}, {"$set": updates})
    return {"success": True, "message": "Profile updated"}


@account_router.delete("/delete-account")
def delete_account(request: Request):
    auth = request.headers.get("Authorization") or request.query_params.get("token")
    if not auth:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.split(" ")[-1]
    uid = get_user_id_from_token(token)
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # delete user
    res = user_collection.delete_one({"_id": ObjectId(uid)})
    # delete user's history entries
    history_collection.delete_many({"user_id": uid})

    return {"success": True, "deleted": res.deleted_count}


class ChangePasswordPayload(BaseModel):
    old_password: str
    new_password: str


@account_router.post("/change-password")
def change_password(request: Request, payload: ChangePasswordPayload):
    auth = request.headers.get("Authorization") or request.query_params.get("token")
    if not auth:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.split(" ")[-1]
    uid = get_user_id_from_token(token)
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = user_collection.find_one({"_id": ObjectId(uid)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.old_password, user.get("password", "")):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    hashed = hash_password(payload.new_password)
    user_collection.update_one({"_id": ObjectId(uid)}, {"$set": {"password": hashed}})
    return {"success": True, "message": "Password changed"}
