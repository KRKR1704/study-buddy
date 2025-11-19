# routes/auth.py

from fastapi import APIRouter, HTTPException
from models.user_model import UserSignup, UserLogin
from utils.auth_utils import hash_password, verify_password, create_access_token
from config.db import user_collection

auth_router = APIRouter()

# Ensure username is unique
user_collection.create_index("username", unique=True)
# Ensure email is unique
user_collection.create_index("email", unique=True)

@auth_router.post("/signup")
def signup(user: UserSignup):
    # Check if username already exists
    if user_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    if user_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already in use")

    # Hash password before saving
    hashed_pw = hash_password(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_pw

    # Save user to database
    res = user_collection.insert_one(user_dict)

    return {"message": "User signed up successfully", "user_id": str(res.inserted_id)}


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

    # Generate JWT token including user_id
    access_token = create_access_token({"sub": credentials.username, "user_id": str(user.get("_id") or user.get("id"))})

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.get("_id") or user.get("id"))
    }
