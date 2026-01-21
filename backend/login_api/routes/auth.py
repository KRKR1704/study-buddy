# routes/auth.py

from fastapi import APIRouter, HTTPException
from models.user_model import UserSignup, UserLogin, UserVerifyOTP
from utils.auth_utils import hash_password, verify_password, create_access_token
from config.db import user_collection
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from utils.otp import generate_otp
from services.email_service import send_otp_email, send_welcome_email

load_dotenv()
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15"))

auth_router = APIRouter()

# Ensure username is unique
user_collection.create_index("username", unique=True)
# Ensure email is unique
user_collection.create_index("email", unique=True)

@auth_router.post("/signup")
def signup(user: UserSignup):
    # Check if username or email already exists
    if user_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    if user_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already in use")

    # Hash password before saving
    hashed_pw = hash_password(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_pw

    # Add verification fields (OTP)
    otp = generate_otp()
    user_dict["is_verified"] = False
    user_dict["email_otp"] = otp
    user_dict["otp_expires_at"] = datetime.utcnow() + timedelta(minutes=10)
    user_dict["created_at"] = datetime.utcnow()

    # Save user to database
    res = user_collection.insert_one(user_dict)

    # Send OTP email (best-effort)
    try:
        send_otp_email(user.email, otp)
    except Exception:
        pass

    return {"message": "OTP sent to your email", "user_id": str(res.inserted_id)}


@auth_router.get("/check")
def check_availability(username: str = None, email: str = None):
    """Check availability of username or email. Returns {'available': bool, 'field': 'username'|'email'}"""
    if username:
        exists = user_collection.find_one({"username": username}) is not None
        return {"available": not exists, "field": "username"}
    if email:
        exists = user_collection.find_one({"email": email}) is not None
        return {"available": not exists, "field": "email"}
    raise HTTPException(status_code=400, detail="Provide username or email to check")

@auth_router.post("/login")
def login(credentials: UserLogin):
    # Look up user by username
    user = user_collection.find_one({"username": credentials.username})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # Block login until email verified
    if not user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    # Generate JWT token including user_id
    access_token = create_access_token({"sub": credentials.username, "user_id": str(user.get("_id") or user.get("id"))})

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.get("_id") or user.get("id"))
    }



@auth_router.post("/verify-otp")
def verify_otp(payload: UserVerifyOTP):
    user = user_collection.find_one({"email": payload.email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("is_verified"):
        return {"message": "Already verified"}

    if user.get("email_otp") != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    expires = user.get("otp_expires_at")
    if not expires or datetime.utcnow() > expires:
        raise HTTPException(status_code=400, detail="OTP expired")

    user_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True}, "$unset": {"email_otp": "", "otp_expires_at": ""}}
    )

    try:
        send_welcome_email(user["email"])
    except Exception:
        pass

    return {"message": "Email verified successfully"}


@auth_router.post("/forgot-password")
def forgot_password(email: str):
    """Generate a password reset token and (dev) return it. In production this should email the user."""
    user = user_collection.find_one({"email": email})
    if not user:
        # Do not reveal whether the email exists
        return {"message": "If an account exists for that email, a reset link has been sent."}

    # create a short-lived token tied to the user id
    token = create_access_token({"user_id": str(user.get("_id")), "pw_reset": True})
    expires = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    # store token metadata on user record for verification
    user_collection.update_one({"_id": user.get("_id")}, {"$set": {"reset_token": token, "reset_expires": expires}})

    # In dev return the token so it can be used; in prod you would email this link instead
    return {"message": "Password reset token generated", "reset_token": token}


@auth_router.post("/reset-password")
def reset_password(token: str, new_password: str):
    # Find user by token
    user = user_collection.find_one({"reset_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    expires = user.get("reset_expires")
    if not expires or expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # update password and clear reset fields
    hashed = hash_password(new_password)
    user_collection.update_one({"_id": user.get("_id")}, {"$set": {"password": hashed}, "$unset": {"reset_token": "", "reset_expires": ""}})
    return {"message": "Password has been reset"}
