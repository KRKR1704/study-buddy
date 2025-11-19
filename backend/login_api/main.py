# backend/login_api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ local imports (relative to main.py's folder)
from routes.history import router as history_router
from routes.auth import auth_router
from routes.summarizer import router as summarizer_router

app = FastAPI()

# ✅ Enable CORS for frontend (React/Next.js on localhost:3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include the routers
app.include_router(auth_router, prefix="/auth")
app.include_router(summarizer_router, prefix="/api")
# Serve history endpoints under /api/history to match frontend expectations
app.include_router(history_router, prefix="/api")   # now at /api/history
