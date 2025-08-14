from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import auth_router
from routes.summarizer import router as summarizer_router  # Import summarizer route

app = FastAPI()

# ✅ Enable CORS for React or Next.js frontend (on localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include the login/signup routes
app.include_router(auth_router, prefix="/auth")

# ✅ Include the summarizer route
app.include_router(summarizer_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Study Buddy backend is running"}
