# Tech Stack and Requirements

This document outlines the complete technology stack, necessary system installations, and required packages for both the frontend and backend of the project.

## 1. System Requirements & Global Installations

Before starting any development, ensure the following core software and extensions are installed on your system:

### 1.1 Python (Backend)
- **Required Version:** Python 3.9+ (Recommended 3.10 or 3.11)
- **Download:** [Python.org](https://www.python.org/downloads/)
- **Note:** Ensure Python is added to your system's PATH during installation. A virtual environment (`venv`) is highly recommended to manage backend dependencies.

### 1.2 Node.js & npm (Frontend)
- **Required Version:** Node.js 18.x or higher (LTS recommended)
- **Download:** [Nodejs.org](https://nodejs.org/)
- **Note:** `npm` is included with Node.js. It is required to install frontend dependencies and run the Vite development server.

### 1.3 System Utilities & Extensions
- **FFmpeg:** Required for video and audio processing functionalities (used via `ffmpeg-python` in the backend).
  - **Download:** [FFmpeg.org](https://ffmpeg.org/download.html)
  - **Note:** The `ffmpeg` executable **must** be added to your system's PATH environment variable for the backend to locate it.
- **SQLite:** The backend uses `aiosqlite` for asynchronous database interactions, which relies on the built-in SQLite engine in Python. No separate database server installation is required unless scaling up.
- **Git:** Essential for version control.

---

## 2. Backend Tech Stack & Dependencies

The backend is a RESTful API built with Python.

### 2.1 Core Framework
- **FastAPI:** The core web framework.
- **Uvicorn:** The ASGI web server used to run FastAPI.
- **Pydantic & Pydantic Settings:** For data validation and environment variable management.
- **python-dotenv:** To load environment variables from a `.env` file.

### 2.2 Database & ORM
- **SQLAlchemy:** The SQL toolkit and Object-Relational Mapper (ORM).
- **Alembic:** Database migration tool for SQLAlchemy.
- **aiosqlite:** Asynchronous SQLite driver.

### 2.3 Authentication & Security
- **python-jose[cryptography]:** For generating and verifying JWT tokens.
- **passlib[bcrypt]:** For secure password hashing.
- **python-multipart:** For parsing form data and file uploads.

### 2.4 AI & Media Processing
- **google-generativeai:** SDK for integrating Google's Generative AI features.
- **ffmpeg-python:** Python bindings for FFmpeg to process video and audio files.

### 2.5 File Handling & Utilities
- **aiofiles:** For asynchronous file read/write operations.
- **python-magic-bin:** To identify file types (MIME types). *Note: The `-bin` version is specifically needed for Windows compatibility.*
- **email-validator:** To validate email addresses.
- **httpx & tenacity:** For asynchronous HTTP requests and retry logic.

### 2.6 Testing
- **pytest & pytest-asyncio:** For writing and running asynchronous tests.

---

## 3. Frontend Tech Stack & Dependencies

The frontend is a Single Page Application (SPA) built with React.

### 3.1 Core Framework & Tooling
- **React (v19.2):** The core UI library.
- **React DOM:** For rendering React components in the browser.
- **Vite:** The lightning-fast build tool and development server.

### 3.2 Networking & API Communication
- **Axios:** Promise-based HTTP client for making API requests to the backend.

### 3.3 Authentication
- **@react-oauth/google:** For integrating Google OAuth login.

### 3.4 Development Dependencies
- **oxlint:** A fast JavaScript/TypeScript linter.
- **@vitejs/plugin-react:** Vite plugin for React support.
- **TypeScript Definitions:** `@types/react` and `@types/react-dom` for better IDE support.

---

## 4. Setup Instructions Summary

For detailed startup instructions, refer to the [STARTUPGUIDE.md](./STARTUPGUIDE.md).

- **Backend:** Create a virtual environment, activate it, and run `pip install -r requirements.txt`. Start with `uvicorn app.main:app --reload`.
- **Frontend:** Run `npm install`, then start the server with `npm run dev`.
