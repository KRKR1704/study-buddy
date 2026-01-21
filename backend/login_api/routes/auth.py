# routes/auth.py

from fastapi import APIRouter, HTTPException
from models.user_model import UserSignup, UserLogin, UserVerifyOTP
from utils.auth_utils import hash_password, verify_password, create_access_token
from config.db import user_collection, pending_signup_collection
from pymongo.errors import DuplicateKeyError
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
    # Block if an existing user already has the username/email
    if user_collection.find_one({"username": user.username}) or user_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # Prepare pending signup (do not create real user yet)
    otp = generate_otp()
    now = datetime.utcnow()
    pending_doc = {
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "email_otp": otp,
        "otp_expires_at": now + timedelta(minutes=10),
        "created_at": now,
    }

    try:
        pending_signup_collection.update_one({"email": user.email}, {"$set": pending_doc}, upsert=True)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Send OTP — fail hard so the user knows if email didn't send
    try:
        send_otp_email(user.email, otp)
    except Exception as e:
        print("❌ OTP email failed:", str(e))
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Try again.")

    return {"message": "OTP sent to your email"}


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
    pending = pending_signup_collection.find_one({"email": payload.email})

    if not pending:
        raise HTTPException(status_code=404, detail="No pending signup found. Please sign up again.")

    if pending.get("email_otp") != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    expires = pending.get("otp_expires_at")
    if not expires or datetime.utcnow() > expires:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new OTP.")

    # Safety: ensure not already created
    if user_collection.find_one({"email": payload.email}) or user_collection.find_one({"username": pending["username"]}):
        pending_signup_collection.delete_one({"_id": pending["_id"]})
        raise HTTPException(status_code=400, detail="Account already exists. Please login.")

    user_doc = {
        "username": pending["username"],
        "email": pending["email"],
        "password": pending["password"],
        "is_verified": True,
        "created_at": pending.get("created_at", datetime.utcnow()),
    }

    user_collection.insert_one(user_doc)
    pending_signup_collection.delete_one({"_id": pending["_id"]})

    try:
        send_welcome_email(user_doc["email"])
    except Exception as e:
        print("❌ Welcome email failed:", str(e))

    return {"message": "Email verified successfully"}


@auth_router.post("/resend-otp")
def resend_otp(email: str):
    pending = pending_signup_collection.find_one({"email": email})
    if not pending:
        raise HTTPException(status_code=404, detail="No pending signup found. Please sign up again.")

    otp = generate_otp()
    expires = datetime.utcnow() + timedelta(minutes=10)
    pending_signup_collection.update_one({"_id": pending["_id"]}, {"$set": {"email_otp": otp, "otp_expires_at": expires}})

    try:
        send_otp_email(email, otp)
    except Exception as e:
        print("❌ Resend OTP failed:", str(e))
        raise HTTPException(status_code=500, detail="Failed to resend OTP. Try again.")

    return {"message": "OTP resent"}


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
