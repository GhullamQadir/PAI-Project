# 🤖 Feature: AI Speech & Analysis

## Overview
This module handles AI-powered video analysis using Google Gemini and speech-to-text transcription using OpenAI Whisper. It provides transcript generation from video audio and intelligent analysis of transcript content.

## Architecture

```
feature-ai speech/
├── README.md                 # This file
├── api_ai.py                 # AI analysis endpoint (Gemini)
├── api_transcripts.py        # Transcript retrieval endpoints
├── model_transcript.py       # Transcript SQLAlchemy ORM model
├── schema_ai.py              # AI request/response Pydantic schemas
├── schema_transcript.py      # Transcript Pydantic schemas
├── service_gemini.py         # Google Gemini API integration
└── service_whisper.py        # OpenAI Whisper speech-to-text
```

## API Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `POST` | `/api/v1/ai/analyze` | Run AI analysis on video transcript | ✅ |
| `GET`  | `/api/v1/transcripts/video/{video_id}` | Get transcripts for a video | ✅ |
| `GET`  | `/api/v1/transcripts/{transcript_id}` | Get a specific transcript | ✅ |

## AI Pipeline Flow
```
Video Upload → Audio Extraction (FFmpeg) → Transcription (Whisper) → AI Analysis (Gemini)
```

1. **Whisper** transcribes audio → produces full text + timestamped segments
2. **Gemini** analyzes transcript → generates:
   - Summary (2-3 sentences)
   - Chapters with titles and reasoning
   - Keywords/topics
   - SEO-optimized title & description

## Tech Stack
- **Speech-to-Text**: OpenAI Whisper (`base` model, CPU by default)
- **AI Analysis**: Google Gemini (`gemini-2.5-flash`)
- **Output Format**: Structured JSON responses

## Environment Variables
```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
WHISPER_MODEL=base        # Options: tiny, base, small, medium, large
WHISPER_DEVICE=cpu         # Options: cpu, cuda
```

## Key Notes
- Whisper model is lazy-loaded to save memory until first transcription request
- Both Whisper and Gemini operations run in thread pools (`asyncio.to_thread`) to avoid blocking the async event loop
- Gemini responses use `response_mime_type: application/json` for reliable JSON output

## Source Location
All source files originate from `backend/app/` — see each file for the exact source path.
