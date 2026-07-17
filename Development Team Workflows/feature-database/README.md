# 🗄️ Feature: Database & Configuration

## Overview
This module contains the database configuration, all SQLAlchemy ORM models, and the application settings. It forms the data layer foundation for the entire AI Video Editor platform.

## Architecture

```
feature-database/
├── README.md                 # This file
├── database.py               # SQLAlchemy async engine, sessions, Base class
├── config.py                 # Pydantic Settings (loads from .env)
├── model_user.py             # User model (auth, profile)
├── model_project.py          # Project model (video collections)
├── model_video.py            # Video model (file info, metadata, AI analysis)
├── model_transcript.py       # Transcript model (speech-to-text results)
├── schema_project.py         # Project Pydantic schemas
├── api_projects.py           # Project CRUD endpoints
└── .env.example              # Environment variable template
```

## Database Schema (ERD)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  users   │────<│ projects │────<│  videos  │
│          │     │          │     │          │
│ id (PK)  │     │ id (PK)  │     │ id (PK)  │
│ email    │     │ user_id  │     │ user_id  │
│ password │     │ name     │     │ project_id│
│ full_name│     │ status   │     │ status   │
│ is_active│     │ settings │     │ ai_*     │
└──────────┘     └──────────┘     └────┬─────┘
                                       │
                                  ┌────┴─────┐
                                  │transcripts│
                                  │           │
                                  │ id (PK)   │
                                  │ video_id  │
                                  │ full_text │
                                  │ segments  │
                                  └───────────┘
```

### Relationships
- **User** → has many **Projects** (cascade delete)
- **User** → has many **Videos** (cascade delete)
- **Project** → has many **Videos** (SET NULL on delete)
- **Video** → has many **Transcripts** (cascade delete)

## API Endpoints (Projects)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `POST` | `/api/v1/projects/` | Create a project | ✅ |
| `GET`  | `/api/v1/projects/` | List user projects (paginated) | ✅ |
| `GET`  | `/api/v1/projects/{id}` | Get project details | ✅ |
| `PUT`  | `/api/v1/projects/{id}` | Update project | ✅ |
| `DELETE`| `/api/v1/projects/{id}` | Delete project | ✅ |

## Tech Stack
- **ORM**: SQLAlchemy 2.0 (async with `aiosqlite`)
- **Database**: SQLite (development), easily swappable to PostgreSQL
- **Config**: Pydantic Settings (auto-loads `.env` file)
- **Session**: Async session with auto-commit/rollback pattern

## Environment Variables
```env
DATABASE_URL=sqlite+aiosqlite:///./app.db
DEBUG=true
APP_NAME="AI Video Editor API"
APP_VERSION="1.0.0"
```

## Key Notes
- All models use UUID string primary keys for portability
- JSON fields (settings, ai_analysis, segments) stored as Text and parsed at the schema level
- Database tables auto-created on startup via `init_db()` in lifespan
- `NullPool` used for SQLite compatibility (no connection pooling)

## Source Location
All source files originate from `backend/app/` — see each file for the exact source path.
