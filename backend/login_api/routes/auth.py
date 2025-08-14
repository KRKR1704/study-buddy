# routes/auth.py

from fastapi import APIRouter, HTTPException
from models.user_model import UserSignup, UserLogin
from utils.auth_utils import hash_password, verify_password, create_access_token
from config.db import user_collection

auth_router = APIRouter()

# Ensure username is unique
user_collection.create_index("username", unique=True)

@auth_router.post("/signup")
def signup(user: UserSignup):
    # Check if username already exists
    if user_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")

    # Hash password before saving
    hashed_pw = hash_password(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_pw

    # Save user to database
    user_collection.insert_one(user_dict)

    return {"message": "User signed up successfully"}

@auth_router.post("/login")
def login(credentials: UserLogin):
    # Look up user by username
    user = user_collection.find_one({"username": credentials.username})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # Generate JWT token
    access_token = create_access_token({"sub": credentials.username})

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }
