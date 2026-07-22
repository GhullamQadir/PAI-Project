from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import init_db, close_db
from app.api.v1 import auth, users, projects, videos, transcripts, ai, processing, chat, chat_history
from app.api.v1.settings import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan
)

# CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
app.include_router(projects.router, prefix=f"{settings.API_V1_PREFIX}/projects", tags=["projects"])
app.include_router(videos.router, prefix=f"{settings.API_V1_PREFIX}/videos", tags=["videos"])
app.include_router(transcripts.router, prefix=f"{settings.API_V1_PREFIX}/transcripts", tags=["transcripts"])
app.include_router(ai.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["ai"])
app.include_router(settings_router, prefix=f"{settings.API_V1_PREFIX}/settings", tags=["settings"])
app.include_router(processing.router, prefix=f"{settings.API_V1_PREFIX}/processing", tags=["processing"])
app.include_router(chat.router, prefix=f"{settings.API_V1_PREFIX}/chats", tags=["chats"])
app.include_router(chat_history.router, prefix=f"{settings.API_V1_PREFIX}/chat_history", tags=["chat_history"])

# Static Files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/outputs", StaticFiles(directory=settings.OUTPUT_DIR), name="outputs")

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}
