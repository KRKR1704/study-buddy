# backend/login_api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ Use package-absolute imports (match your folder: backend/login_api/routes/*.py)
from login_api.routes.auth import auth_router
from login_api.routes.summarizer import router as summarizer_router
from login_api.routes.history import router as history_router

app = FastAPI()

# ✅ Single CORS middleware (include both localhost & 127.0.0.1 for Next.js dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Mount routers
app.include_router(auth_router, prefix="/auth")
app.include_router(summarizer_router, prefix="/api")
app.include_router(history_router)  # already has prefix="/api/history" inside the router
