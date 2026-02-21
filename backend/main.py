from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.judge import router as judge_router
from api.social import router as social_router

app = FastAPI(title="BeatOff AI Backend", description="AI Judge API for rhythm game.")

# Configure CORS to allow the Next.js frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the endpoints
app.include_router(judge_router, prefix="/api/judge", tags=["Judge"])
app.include_router(social_router, prefix="/api/social", tags=["Social"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "BeatOff AI API is running"}
