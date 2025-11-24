# Setup Instructions

## Quick Start

### Automated Setup (Mac/Linux)

Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

#### 1. Create Virtual Environment

```bash
python3 -m venv venv
```

#### 2. Activate Virtual Environment

**Mac/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

#### 3. Install Backend Dependencies

```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

#### 4. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:
```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development).

#### 5. Initialize Database

```bash
python app/database/init_db.py
```

#### 6. Start Backend Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

#### 7. Start Frontend

In a new terminal:

```bash
cd frontend
python -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## Verification

1. Check backend is running: Visit http://localhost:8000/health
2. Check API docs: Visit http://localhost:8000/docs
3. Check frontend: Open http://localhost:8080

## Troubleshooting

- **Port already in use**: Change ports in `main.py` (backend) or use different port for frontend server
- **Database errors**: Make sure you ran `init_db.py` and have write permissions
- **Import errors**: Make sure virtual environment is activated and dependencies are installed


