#!/bin/bash
# Setup script for 3D Graphing App

echo "Setting up 3D Graphing App..."

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt

# Initialize database
echo "Initializing database..."
PYTHONPATH=. python -m app.database.init_db

cd ..

echo ""
echo "Setup complete!"
echo ""
echo "To start the backend server:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Navigate to backend: cd backend"
echo "  3. Run server: uvicorn app.main:app --reload"
echo ""
echo "To start the frontend:"
echo "  1. Navigate to frontend: cd frontend"
echo "  2. Serve with: python -m http.server 8080"
echo "  3. Open http://localhost:8080 in your browser"


