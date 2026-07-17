# STARTUP GUIDE

This guide explains how to start both the frontend and backend servers and ensures they are connected properly.

## Backend Setup & Run Commands

The backend is built with FastAPI and runs on port `8000`.

1. **Navigate to the backend directory:**
   ```bash
   cd "Development Team Workflows/backend"
   ```

2. **Create and activate a virtual environment (Recommended):**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *The backend will now be running at `http://localhost:8000`.*

---

## Frontend Setup & Run Commands

The frontend is built with React/Vite and runs on port `5173`.

1. **Navigate to the frontend directory:**
   ```bash
   cd "Development Team Workflows/frontend"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend server:**
   ```bash
   npm run dev
   ```
   *The frontend will now be running at `http://localhost:5173`.*

### Connection Details
- The frontend is already configured to point to `http://localhost:8000/api/v1` for all API calls.
- The backend's `.env` and `config.py` files have been updated to allow Cross-Origin Resource Sharing (CORS) from `http://localhost:5173`, ensuring seamless communication between the two.
