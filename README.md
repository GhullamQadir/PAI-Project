# NovaCut — AI Video Editing SaaS Platform (Backend API)

**A production-grade REST API backend for an AI-powered video editing platform, built with FastAPI, Google Gemini, Whisper, and FFmpeg.**

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [AI Services](#ai-services)
- [Video Processing Pipeline](#video-processing-pipeline)
- [Environment Configuration](#environment-configuration)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Testing and Verification](#testing-and-verification)
- [Academic Context](#academic-context)
- [Development Team](#development-team)

---

## Project Overview

NovaCut is a full-stack AI Video Editing SaaS application. This repository contains the **backend API layer**, developed as a 4th-semester capstone project for the Principles of Artificial Intelligence (PAI) course.

The backend exposes a versioned REST API (`/api/v1`) that handles user authentication, project and video asset management, AI-powered content analysis, speech-to-text transcription, and programmatic video processing. The AI assistant, branded as **NovaCut AI**, accepts natural-language editing commands from the frontend and translates them into concrete FFmpeg operations.

The frontend (React + Vite) is developed in a parallel workflow within `Development Team Workflows/frontend/` and communicates with this backend at `http://localhost:8000/api/v1`.

---

## Architecture

The system follows a layered, modular architecture. Each concern is strictly separated into its own layer.

```
Client (React / Vite — Port 5173)
         |
         |  HTTP / REST (CORS-protected)
         v
FastAPI Application (Uvicorn — Port 8000)
         |
    +----+----+----+----+----+----+----+----+----+
    |    |    |    |    |    |    |    |    |    |
  auth users proj  vid  ai  chat proc transcript settings
    |                                         (API Routers — /api/v1/*)
    |
    v
Service Layer (Business Logic)
  - auth_service.py        (JWT creation, password hashing)
  - gemini_service.py      (Google Gemini 2.5 Flash)
  - groq_service.py        (Groq LLaMA 3 — fallback AI provider)
  - ffmpeg_service.py      (Video trimming, merging, subtitle burning)
  - whisper_service.py     (Speech-to-text transcription)
  - video_service.py       (Upload handling, metadata extraction)
  - file_service.py        (File I/O and MIME validation)
  - ai_provider.py         (AI provider abstraction layer)
  - runtime_config.py      (Per-user runtime API key management)
    |
    v
Data Layer
  - SQLAlchemy ORM + aiosqlite (async SQLite)
  - Models: User, Project, Video, Transcript, ChatSession
  - Alembic for schema migrations
    |
    v
File System Storage
  - /uploads/   (user-uploaded raw video and audio files)
  - /outputs/   (processed video files)
  - /temp/      (intermediate files during processing)
```

---

## API Reference

All endpoints are prefixed with `/api/v1`. The full interactive documentation is available at `/api/v1/openapi.json` or via the Swagger UI at `/docs`.

### Authentication — `/api/v1/auth`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | No | Register a new user account |
| POST | `/auth/login` | No | Authenticate and receive JWT tokens |
| POST | `/auth/refresh` | No | Refresh an expired access token |
| POST | `/auth/google` | No | OAuth2 login via Google ID token |

### Users — `/api/v1/users`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/users/me` | Yes | Retrieve the authenticated user's profile |
| PATCH | `/users/me` | Yes | Update profile fields |

### Projects — `/api/v1/projects`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/projects` | Yes | List all projects for the current user |
| POST | `/projects` | Yes | Create a new project |
| GET | `/projects/{id}` | Yes | Retrieve a specific project |
| DELETE | `/projects/{id}` | Yes | Delete a project and its assets |

### Videos — `/api/v1/videos`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/videos/upload` | Yes | Upload a video or audio file |
| GET | `/videos` | Yes | List all videos for the current user |
| GET | `/videos/{id}` | Yes | Retrieve video metadata |
| DELETE | `/videos/{id}` | Yes | Delete a video |

### AI Analysis — `/api/v1/ai`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/ai/analyze` | Yes | Analyze a transcript using Gemini or Groq |
| POST | `/ai/generate-title` | Yes | Generate an SEO-optimized title and description |
| POST | `/ai/analyze-image` | Yes | Analyze an image using Gemini Vision |

### Chat (NovaCut AI) — `/api/v1/chats`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/chats/message` | Yes | Send a natural-language editing command to NovaCut AI |

### Chat History — `/api/v1/chat_history`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/chat_history/{session_id}` | Yes | Retrieve conversation history for a session |

### Transcripts — `/api/v1/transcripts`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/transcripts/generate` | Yes | Generate a transcript for a video using Whisper |
| GET | `/transcripts/{video_id}` | Yes | Retrieve the transcript for a given video |

### Video Processing — `/api/v1/processing`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/processing/trim` | Yes | Trim a video to a specified time range |
| POST | `/processing/auto-trim` | Yes | Detect and remove leading/trailing silence |
| POST | `/processing/merge` | Yes | Concatenate multiple videos sequentially |
| POST | `/processing/burn-subtitles` | Yes | Burn an SRT subtitle track into a video |

### Settings — `/api/v1/settings`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/settings` | Yes | Retrieve the current user's runtime API key configuration |
| PATCH | `/settings` | Yes | Update per-user Gemini or Groq API keys at runtime |

---

## Tech Stack

### Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Python | 3.9+ (3.11 recommended) |
| Web Framework | FastAPI | Latest |
| ASGI Server | Uvicorn | Latest |
| Data Validation | Pydantic v2 / Pydantic Settings | Latest |
| ORM | SQLAlchemy | Latest |
| Database | SQLite (via aiosqlite) | Built-in |
| Migrations | Alembic | Latest |
| Authentication | python-jose (JWT) + passlib (bcrypt) | Latest |
| AI Provider 1 | Google Gemini 2.5 Flash | google-generativeai |
| AI Provider 2 | Groq (LLaMA 3 70B) | via httpx |
| Speech-to-Text | OpenAI Whisper | openai-whisper |
| Video Processing | FFmpeg (via ffmpeg-python) | Latest |
| File Type Detection | python-magic-bin | Latest (Windows) |
| HTTP Client | httpx | Latest |
| Retry Logic | tenacity | Latest |
| Async File I/O | aiofiles | Latest |
| Testing | pytest + pytest-asyncio | Latest |

### Frontend (Parallel Repository — `Development Team Workflows/frontend/`)

| Component | Technology |
|-----------|------------|
| Framework | React 19.2 |
| Build Tool | Vite |
| HTTP Client | Axios |
| OAuth | @react-oauth/google |
| Linter | oxlint |

---

## Project Structure

```
PAI-Project/
|
|-- app/                          # Core application package
|   |
|   |-- main.py                   # FastAPI app initialization, router registration, lifespan
|   |-- config.py                 # Pydantic Settings — all environment variable bindings
|   |-- database.py               # SQLAlchemy async engine and session factory
|   |
|   |-- api/
|   |   |-- deps.py               # Shared dependencies (get_current_user, get_db)
|   |   `-- v1/
|   |       |-- __init__.py       # Router aggregation
|   |       |-- auth.py           # /auth endpoints (register, login, refresh, google)
|   |       |-- users.py          # /users endpoints
|   |       |-- projects.py       # /projects endpoints
|   |       |-- videos.py         # /videos endpoints (upload + CRUD)
|   |       |-- ai.py             # /ai endpoints (analyze, generate-title, analyze-image)
|   |       |-- chat.py           # /chats endpoints (NovaCut AI chat)
|   |       |-- chat_history.py   # /chat_history endpoints
|   |       |-- transcripts.py    # /transcripts endpoints
|   |       |-- processing.py     # /processing endpoints (trim, merge, burn-subtitles)
|   |       `-- settings.py       # /settings endpoints (runtime API key management)
|   |
|   |-- models/
|   |   |-- user.py               # User ORM model
|   |   |-- project.py            # Project ORM model
|   |   |-- video.py              # Video ORM model
|   |   |-- transcript.py         # Transcript ORM model
|   |   `-- chat.py               # ChatSession ORM model
|   |
|   |-- schemas/
|   |   |-- auth.py               # Request/response schemas for auth
|   |   |-- processing.py         # Request schemas for video processing operations
|   |   `-- ...                   # Additional Pydantic schemas
|   |
|   |-- services/
|   |   |-- auth_service.py       # Password hashing, JWT creation and decoding
|   |   |-- gemini_service.py     # Google Gemini 2.5 Flash integration
|   |   |-- groq_service.py       # Groq LLaMA 3 integration (fallback provider)
|   |   |-- ai_provider.py        # AI provider abstraction layer
|   |   |-- ffmpeg_service.py     # FFmpeg operations (trim, silence detection, merge, subtitle burn)
|   |   |-- whisper_service.py    # Whisper speech-to-text transcription
|   |   |-- video_service.py      # Video upload handling and metadata extraction
|   |   |-- file_service.py       # File I/O, MIME detection, and validation
|   |   `-- runtime_config.py     # Per-user runtime API key store
|   |
|   `-- core/                     # Core utilities (security helpers, etc.)
|
|-- Development Team Workflows/   # Feature-branch working directories
|   |-- backend/                  # Backend developer workspace
|   |-- frontend/                 # React + Vite frontend application
|   |-- feature-auth/             # Authentication feature module
|   |-- feature-database/         # Database schema and migration work
|   |-- feature-video processing/ # FFmpeg integration feature
|   |-- feature-ai speech/        # Whisper and Gemini integration feature
|   `-- run.bat                   # Windows batch launcher for development
|
|-- app.db                        # SQLite database file (auto-generated at runtime)
|-- requirements.txt              # Python package dependencies
|-- Dockerfile                    # Docker image definition (Python 3.11-slim + FFmpeg)
|-- docker-compose.yml            # Docker Compose service definition
|-- start_all.bat                 # Windows batch: start backend and frontend together
|-- start_backend.bat             # Windows batch: start backend only
|-- download_ffmpeg.py            # Utility: download and place FFmpeg binaries locally
|-- .env.example                  # Template for required environment variables
|-- .gitignore
|-- STARTUPGUIDE.md               # Quick-start command reference
|-- TECH_STACK_REQUIREMENTS.md    # Full dependency documentation
`-- Verification_Log.md           # QA team endpoint testing evidence log
```

---

## Database Schema

The application uses an async SQLite database managed by SQLAlchemy. All primary keys are UUID strings. The schema consists of five core tables.

```
users
  id              UUID (PK)
  email           VARCHAR(255) UNIQUE NOT NULL
  hashed_password VARCHAR(255) NOT NULL
  full_name       VARCHAR(255)
  avatar_url      VARCHAR(500)
  is_active       BOOLEAN DEFAULT TRUE
  is_verified     BOOLEAN DEFAULT FALSE
  created_at      DATETIME (server default: now, UTC)
  updated_at      DATETIME (auto-update on write)
  last_login_at   DATETIME

projects
  id              UUID (PK)
  owner_id        FK -> users.id (cascade delete)
  name            VARCHAR NOT NULL
  description     TEXT
  created_at      DATETIME

videos
  id              UUID (PK)
  user_id         FK -> users.id (cascade delete)
  original_filename VARCHAR NOT NULL
  stored_filename   VARCHAR NOT NULL
  file_path       VARCHAR NOT NULL
  file_size       INTEGER
  mime_type       VARCHAR
  status          VARCHAR (e.g., "pending", "completed")
  duration        FLOAT
  width, height   INTEGER

transcripts
  id              UUID (PK)
  video_id        FK -> videos.id (cascade delete)
  text            TEXT
  language        VARCHAR
  srt_content     TEXT
  segments        JSON
  created_at      DATETIME

chat_sessions
  id              UUID (PK)
  user_id         FK -> users.id (cascade delete)
  video_id        FK -> videos.id (nullable)
  messages        JSON (list of role/content pairs)
  created_at      DATETIME
  updated_at      DATETIME
```

---

## Authentication Flow

The system uses a dual-token JWT authentication strategy.

1. **Registration** — `POST /api/v1/auth/register`. The user submits email and password. The password is hashed with bcrypt (passlib). A new User record is created and persisted.

2. **Login** — `POST /api/v1/auth/login`. Accepts OAuth2 form data. On success, returns a short-lived access token (30 minutes) and a long-lived refresh token (7 days), both signed with HS256 using `SECRET_KEY`.

3. **Protected Routes** — All protected endpoints use the `get_current_user` dependency injected via `app/api/deps.py`, which decodes and validates the Bearer token from the `Authorization` header.

4. **Token Refresh** — `POST /api/v1/auth/refresh`. Accepts a valid refresh token and returns a new access/refresh token pair.

5. **Google OAuth** — `POST /api/v1/auth/google`. Accepts a Google ID token, verifies it against the configured `GOOGLE_CLIENT_ID`, and performs an automatic upsert of the user record before issuing application JWTs.

---

## AI Services

### NovaCut AI Chat (Gemini + Groq)

The chat endpoint (`POST /api/v1/chats/message`) routes natural-language editing commands through the AI Provider abstraction layer (`ai_provider.py`). By default, Google Gemini 2.5 Flash is the primary provider. Groq (LLaMA 3 70B) serves as the secondary provider and can be selected per-user via the settings endpoint.

The AI is instructed to return structured JSON responses containing two fields:

- `reply` — A human-readable explanation of the intended action.
- `actions` — A list of action objects to be executed by the frontend (e.g., `trim`, `add_captions`, `remove_silence`, `analyze`, `generate_title`).

If the user's message is a conversational query rather than an edit command, the AI returns an empty `actions` list.

### Transcript Analysis (Gemini + Groq)

`POST /api/v1/ai/analyze` sends a video transcript to the selected AI provider with instructions to return a 2-3 sentence summary, a list of logical chapters with titles and reasoning, and a list of keywords. All responses are requested as structured JSON via `response_mime_type: application/json`.

### AI Image Analysis (Gemini Vision)

`POST /api/v1/ai/analyze-image` uploads an image file to Google's Gemini Files API, runs multimodal inference, and returns an SEO-optimized title and description. The uploaded file is cleaned up from Google's servers after inference completes.

### Per-User API Key Management

Users can supply their own Gemini or Groq API keys via `PATCH /api/v1/settings`. These are stored in memory per-user session via `runtime_config.py` and take precedence over the server-level `.env` keys for that user's requests.

---

## Video Processing Pipeline

All video operations are executed asynchronously using `asyncio.to_thread` to avoid blocking the event loop, as FFmpeg is a blocking subprocess.

### Trim — `POST /api/v1/processing/trim`

Takes a `video_id`, `start_time` (seconds), and `end_time` (seconds). Calls FFmpeg with stream-copy (`-c copy`) for lossless, near-instant trimming. The resulting video is saved to `/uploads/` and a new Video record is created in the database.

### Auto-Trim — `POST /api/v1/processing/auto-trim`

First runs FFmpeg's `silencedetect` filter to identify silent segments. If silence is detected at the start or end of the file, the video is trimmed to remove it automatically.

### Merge — `POST /api/v1/processing/merge`

Takes a list of `video_ids` in order. Generates an FFmpeg concat demuxer file and merges the videos sequentially. Assumes matching resolution and codec. Output is saved to `/outputs/`.

### Burn Subtitles — `POST /api/v1/processing/burn-subtitles`

Accepts a `video_id` and raw SRT-formatted `subtitle_text`. Writes the SRT content to a temporary file, applies FFmpeg's `subtitles` filter to burn the text permanently into the video stream, and saves the result to `/outputs/`. The temporary SRT file is deleted on completion or failure.

### Speech-to-Text — `POST /api/v1/transcripts/generate`

Audio is extracted from the uploaded video using FFmpeg (MP3 at quality 4). The audio is then passed to the Whisper model for transcription. The resulting text, language, SRT-formatted content, and timestamped segments are stored in the `transcripts` table.

Note: Due to a Windows file path length limitation (MAX_PATH) encountered during development, the Whisper model is currently mocked in `whisper_service.py` with a placeholder response. The full transcription pipeline remains architecturally complete and will be enabled upon resolving the path limitation or deploying to a Linux environment.

---

## Environment Configuration

Copy `.env.example` to `.env` and populate the following variables before running the application.

```env
# Application
APP_NAME="AI Video Editor API"
APP_VERSION="1.0.0"
DEBUG=true
API_V1_PREFIX="/api/v1"

# Server
HOST="0.0.0.0"
PORT=8000

# Database
DATABASE_URL="sqlite+aiosqlite:///./app.db"

# Security — REQUIRED: must be at least 32 characters
SECRET_KEY="your-super-secret-key-change-in-production-min-32-chars"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# File Storage
UPLOAD_DIR="./uploads"
OUTPUT_DIR="./outputs"
TEMP_DIR="./temp"
MAX_FILE_SIZE=524288000    # 500 MB

# Google Gemini
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"

# Groq (optional — alternative AI provider)
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="llama3-70b-8192"

# Whisper (speech-to-text)
WHISPER_MODEL="base"       # Options: tiny, base, small, medium, large
WHISPER_DEVICE="cpu"       # Options: cpu, cuda

# FFmpeg — update paths if using bundled binaries
FFMPEG_PATH="ffmpeg"
FFPROBE_PATH="ffprobe"

# CORS — frontend origin(s)
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

`SECRET_KEY` is enforced at startup by Pydantic with `min_length=32`. The application will refuse to start if this variable is absent or too short.

On Windows, if FFmpeg is not on the system PATH, run `python download_ffmpeg.py` to download the binaries into `ffmpeg_bin/` and update `FFMPEG_PATH` and `FFPROBE_PATH` accordingly.

---

## Installation and Setup

### Prerequisites

- Python 3.9 or higher (3.11 recommended)
- Node.js 18.x or higher (for frontend development)
- FFmpeg installed and accessible via system PATH, or downloaded locally

### Backend Setup

**1. Clone the repository**

```bash
git clone <repository-url>
cd PAI-Project
```

**2. Create and activate a virtual environment**

Windows:
```bash
python -m venv .venv
.venv\Scripts\activate
```

macOS / Linux:
```bash
python -m venv .venv
source .venv/bin/activate
```

**3. Install Python dependencies**

```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

```bash
copy .env.example .env
```

Edit `.env` and set `SECRET_KEY` to a random string of at least 32 characters and provide your `GEMINI_API_KEY`.

**5. (Windows only) Download FFmpeg binaries if not on system PATH**

```bash
python download_ffmpeg.py
```

Then update `FFMPEG_PATH` and `FFPROBE_PATH` in `.env` to point to `./ffmpeg_bin/ffmpeg.exe` and `./ffmpeg_bin/ffprobe.exe`.

### Frontend Setup

```bash
cd "Development Team Workflows/frontend"
npm install
```

---

## Running the Application

### Start the Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive Swagger documentation will be available at `http://localhost:8000/docs`.

### Start the Frontend

```bash
cd "Development Team Workflows/frontend"
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Start Both Services (Windows)

Use the provided batch scripts from the project root:

```bat
start_all.bat
```

Or from within the `Development Team Workflows/` directory:

```bat
run.bat
```

---

## Docker Deployment

A `Dockerfile` and `docker-compose.yml` are provided for containerized deployment.

**Dockerfile summary:**
- Base image: `python:3.11-slim`
- System packages: FFmpeg, libsm6, libxext6 (installed via apt)
- Application: Dependencies installed from `requirements.txt`, code copied to `/app`
- Exposed port: `8000`
- Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

**Build and run:**

```bash
docker compose up --build
```

Ensure that the `.env` file is present in the project root before running Docker Compose, as it is loaded at container startup.

---

## API Documentation

Once the backend is running, the following documentation interfaces are automatically available:

| Interface | URL |
|-----------|-----|
| Swagger UI (interactive) | http://localhost:8000/docs |
| ReDoc (read-only) | http://localhost:8000/redoc |
| OpenAPI JSON schema | http://localhost:8000/api/v1/openapi.json |

---

## Testing and Verification

A QA verification log is maintained in `Verification_Log.md`. The following endpoints have been tested via Swagger UI and verified as passing:

| Test Case | Endpoint | Expected Status | Result |
|-----------|----------|-----------------|--------|
| Register with valid data | POST /auth/register | 201 Created | PASS |
| Register with duplicate email | POST /auth/register | 400 Bad Request | PASS |
| Register with malformed JSON | POST /auth/register | 422 Unprocessable Content | PASS |
| Login with valid credentials | POST /auth/login | 200 OK + JWT tokens | PASS |
| Login with invalid password | POST /auth/login | 401 Unauthorized | PASS |
| Access protected route without token | GET /users/me | 401 Unauthorized | PASS |
| Access protected route with valid token | GET /users/me | 200 OK | PASS |
| Refresh with valid token | POST /auth/refresh | 200 OK + new tokens | PASS |
| Refresh with invalid token | POST /auth/refresh | 401 Unauthorized | PASS |
| Timestamps follow ISO-8601 format | POST /auth/register | ISO-8601 datetime | PARTIAL |
| Router / service layer separation | Code review | Architecture verified | PASS |

To run the automated test suite:

```bash
pytest
```

---

## Academic Context

| Field | Details |
|-------|---------|
| Degree Program | Bachelor of Science in Computer Science (BSCS) |
| Semester | 4th Semester |
| Course | Principles of Artificial Intelligence (PAI) |
| Project Type | Capstone Group Project |
| Academic Year | 2025-2026 |

This project demonstrates applied knowledge of:

- RESTful API design and implementation with FastAPI
- Asynchronous Python programming (asyncio, async/await)
- JWT-based stateless authentication with dual-token (access + refresh) strategy
- OAuth2 social login integration (Google)
- ORM-based data modeling and async database interaction with SQLAlchemy
- AI API integration (Google Gemini multimodal, Groq LLaMA 3)
- Natural language command parsing and structured JSON response contracts
- Programmatic video processing with FFmpeg (trim, merge, silence detection, subtitle burning)
- Speech-to-text transcription pipeline architecture
- Layered software architecture (router, service, model, schema separation)
- Containerization with Docker and Docker Compose

---

## Development Team

Developed as a collaborative academic capstone project for the 4th Semester Principles of Artificial Intelligence course.

| Role | Responsibility |
|------|---------------|
| Backend Development | FastAPI application, service layer, AI integration |
| Frontend Development | React + Vite SPA, API consumption |
| QA / Verification | Endpoint testing, verification logging |

---

*This project is developed for academic and educational purposes.*
