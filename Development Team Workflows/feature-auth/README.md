# 🔐 Feature: Authentication & User Management

## Overview
This module handles all authentication (register, login, token refresh) and user profile management for the AI Video Editor platform.

## Architecture

```
feature-auth/
├── README.md                 # This file
├── api_auth.py               # Auth endpoints (register, login, refresh)
├── api_users.py              # User profile & stats endpoints
├── api_deps.py               # OAuth2 token dependency (get_current_user)
├── model_user.py             # User SQLAlchemy ORM model
├── schema_auth.py            # Auth Pydantic schemas (Token, UserCreate, etc.)
├── schema_user.py            # User profile Pydantic schemas
├── service_auth.py           # JWT token creation, password hashing (bcrypt)
├── util_security.py          # Security utility functions
└── core_exceptions.py        # Custom HTTP exception classes
```

## API Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register new user | ❌ |
| `POST` | `/api/v1/auth/login` | Login (returns JWT) | ❌ |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | ❌ (uses refresh token) |
| `GET`  | `/api/v1/users/me` | Get current user profile | ✅ |
| `PUT`  | `/api/v1/users/me` | Update profile | ✅ |
| `GET`  | `/api/v1/users/me/stats` | Get user statistics | ✅ |

## Tech Stack
- **Password Hashing**: bcrypt via `passlib`
- **JWT Tokens**: `python-jose` (HS256)
- **Token Flow**: Access token (30 min) + Refresh token (7 days)

## Environment Variables
```env
SECRET_KEY=your-min-32-char-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## How It Works
1. User registers → password hashed with bcrypt → stored in DB
2. User logs in → credentials verified → JWT access + refresh tokens returned
3. Protected endpoints use `get_current_user` dependency to validate Bearer token
4. When access token expires → client sends refresh token → new pair issued

## Source Location
All source files originate from `backend/app/` — see each file for the exact source path.
