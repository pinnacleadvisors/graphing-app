# 3D Graphing Web App

An interactive 3D graph visualization tool where users can create, edit, and manipulate graphs, with AI-assisted graph generation capabilities.

## Features

- 🎨 Interactive 3D graph visualization using Three.js
- 🔗 Create and edit nodes and edges in real-time
- 🤖 AI-powered graph generation and modification
- 💾 Project management with sidebar (like ChatGPT's chat history)
- 🔄 Real-time updates via WebSocket
- 📊 Graph persistence and loading

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, WebSockets
- **Frontend**: Three.js, Vanilla JavaScript
- **Database**: SQLite (local) / PostgreSQL (production)
- **AI**: OpenAI API / Ollama / Hugging Face

## Quick Start

### Automated Setup (Recommended)

**Mac/Linux:**
```bash
chmod +x open.sh
./open.sh
```

**Windows (PowerShell):**
```powershell
.\open.ps1
```

This will automatically:
- Set up virtual environment (if needed)
- Install dependencies (if needed)
- Initialize database (if needed)
- Start backend server on `http://localhost:8000`
- Start frontend server on `http://localhost:8080`
- Open your browser automatically

Press `Ctrl+C` to stop all servers.

## Local Development Setup

### Prerequisites

- Python 3.9+
- Node.js (optional, for Three.js via npm)

### Backend Setup

1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Initialize database:
   ```bash
   python app/database/init_db.py
   ```

4. Run backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. Open `frontend/index.html` in a browser, or

2. Serve with a simple HTTP server:
   ```bash
   cd frontend
   python -m http.server 8080
   # Or use any static file server
   ```

3. Open `http://localhost:8080` in your browser

## Project Structure

See `context.md` for detailed file structure and architecture.

## Development Roadmap

See `roadmap.md` for the complete development plan.

## License

MIT


