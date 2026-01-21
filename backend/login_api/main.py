# backend/login_api/main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import traceback

# local imports (relative to main.py's folder)
from routes.history import router as history_router
from routes.auth import auth_router
from routes.summarizer import router as summarizer_router
from routes.account import account_router

# DB collection for startup index creation
from config.db import user_collection, pending_signup_collection

app = FastAPI()

# -----------------------------
# CORS
# -----------------------------
default_origins = [
    "https://study-buddy-eosin-mu.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Optional: configure extra origins via env var (comma-separated)
# Example on Render: CORS_ORIGINS=https://study-buddy-eosin-mu.vercel.app,https://your-preview.vercel.app
extra_origins = os.getenv("CORS_ORIGINS", "").strip()
if extra_origins:
    default_origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Global exception handler (logs the real traceback to Render logs)
# -----------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print("UNHANDLED ERROR:", repr(exc))
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# -----------------------------
# Startup: ensure Mongo indexes
# -----------------------------
@app.on_event("startup")
def ensure_indexes():
    try:
        user_collection.create_index("username", unique=True)
        user_collection.create_index("email", unique=True)
        # pending signups: ensure unique indexes and TTL on otp_expires_at
        try:
            pending_signup_collection.create_index("username", unique=True)
            pending_signup_collection.create_index("email", unique=True)
            # TTL index on otp_expires_at (must be a Date field)
            pending_signup_collection.create_index("otp_expires_at", expireAfterSeconds=0)
            print("✅ Pending signup indexes ensured")
        except Exception as e:
            print("⚠️ Failed to create pending signup indexes:", repr(e))
        print("✅ Mongo indexes ensured: username, email")
    except Exception as e:
        # Don't crash the server; log so you can see it in Render logs
        print("⚠️ Failed to create indexes:", repr(e))

# -----------------------------
# Routers
# -----------------------------
app.include_router(auth_router, prefix="/auth")
app.include_router(account_router, prefix="/auth")   # account-related endpoints (profile, delete)
app.include_router(summarizer_router, prefix="/api")  # summarizer routes under /api
app.include_router(history_router, prefix="/api")     # history routes under /api/history
