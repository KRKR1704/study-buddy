# models/user_model.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserSignup(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    dob: str
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str
