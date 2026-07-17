# 🎬 Feature: Video Processing

## Overview
This module handles video file upload, storage, metadata extraction, processing (trim, merge), and the full video processing pipeline orchestration. It uses FFmpeg for media operations and integrates with the AI Speech module for transcription.

## Architecture

```
feature-video processing/
├── README.md                 # This file
├── api_videos.py             # Video upload, get, delete endpoints
├── api_processing.py         # Video trim endpoint
├── model_video.py            # Video SQLAlchemy ORM model
├── schema_video.py           # Video Pydantic schemas
├── schema_processing.py      # Processing request schemas (trim, merge)
├── service_video.py          # Video processing pipeline orchestrator
├── service_ffmpeg.py         # FFmpeg operations (metadata, trim, merge, extract audio)
├── service_file.py           # File upload/delete/metadata utilities
├── util_validators.py        # Video file validation (MIME type, size, extension)
└── util_helpers.py           # Helper functions (format duration, file size, etc.)
```

## API Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `POST` | `/api/v1/videos/upload` | Upload a video file | ✅ |
| `GET`  | `/api/v1/videos/{video_id}` | Get video details | ✅ |
| `DELETE`| `/api/v1/videos/{video_id}` | Delete video + file | ✅ |
| `POST` | `/api/v1/processing/trim` | Trim a video | ✅ |

## Video Processing Pipeline
```
Upload → Save File → Create DB Record → Background Pipeline:
  1. Extract Metadata (FFprobe)
  2. Extract Audio (FFmpeg → MP3)
  3. Transcribe Audio (Whisper)
  4. AI Analysis (Gemini)
  5. Update DB with results
```

The entire pipeline runs as a **BackgroundTask** after upload, so the user gets an immediate response.

## Video Status Flow
```
uploaded → processing → completed
                     → failed (with error message)
```

## Tech Stack
- **Video Processing**: FFmpeg via `ffmpeg-python`
- **File Storage**: Local filesystem (`./uploads/`, `./outputs/`, `./temp/`)
- **File Validation**: Extension check + MIME type check (`python-magic`)
- **Upload**: Chunked upload via `aiofiles` (1MB chunks)

## Environment Variables
```env
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
TEMP_DIR=./temp
MAX_FILE_SIZE=524288000          # 500MB
ALLOWED_VIDEO_TYPES=["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"]
ALLOWED_EXTENSIONS=[".mp4", ".mov", ".avi", ".mkv", ".webm"]
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

## Supported Formats
| Format | Extension | MIME Type |
|--------|-----------|-----------|
| MP4 | `.mp4` | `video/mp4` |
| QuickTime | `.mov` | `video/quicktime` |
| AVI | `.avi` | `video/x-msvideo` |
| Matroska | `.mkv` | `video/x-matroska` |
| WebM | `.webm` | (upload allowed by extension) |

## Key Notes
- Files are stored with UUID filenames to prevent collisions
- FFmpeg operations use `run_async` + `asyncio.to_thread` for non-blocking execution
- Temp audio files are cleaned up after transcription
- Video deletion also removes associated files from disk

## Source Location
All source files originate from `backend/app/` — see each file for the exact source path.
