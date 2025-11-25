#!/bin/bash
# Open application script - Starts backend, frontend, and opens browser
# Usage: ./open.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8000
FRONTEND_PORT=8080
BACKEND_URL="http://localhost:${BACKEND_PORT}"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on a port
kill_port() {
    local port=$1
    if check_port $port; then
        print_warn "Port $port is already in use. Attempting to free it..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to cleanup on exit
cleanup() {
    print_info "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # Kill any remaining processes on our ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    print_info "Cleanup complete."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_info "Starting 3D Graphing App..."
print_info "Backend will run on: $BACKEND_URL"
print_info "Frontend will run on: $FRONTEND_URL"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warn "Virtual environment not found. Creating one..."
    python3 -m venv venv
    print_info "Virtual environment created."
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Check if backend dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    print_warn "Backend dependencies not installed. Installing..."
    cd backend
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    cd ..
    print_info "Backend dependencies installed."
fi

# Check if database exists, initialize if not
if [ ! -f "backend/graphing_app.db" ]; then
    print_warn "Database not found. Initializing..."
    cd backend
    PYTHONPATH=. python -m app.database.init_db
    cd ..
    print_info "Database initialized."
fi

# Free up ports if needed
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Start backend server
print_info "Starting backend server..."
cd backend
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
print_info "Waiting for backend to start..."
BACKEND_READY=false
for i in {1..30}; do
    if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
        BACKEND_READY=true
        break
    fi
    sleep 1
done

if [ "$BACKEND_READY" = true ]; then
    print_info "Backend is ready!"
else
    print_error "Backend failed to start. Check backend.log for details."
    exit 1
fi

# Start frontend server
print_info "Starting frontend server..."
cd frontend
python3 -m http.server $FRONTEND_PORT > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
print_info "Waiting for frontend to start..."
FRONTEND_READY=false
for i in {1..10}; do
    if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
        FRONTEND_READY=true
        break
    fi
    sleep 1
done

if [ "$FRONTEND_READY" = true ]; then
    print_info "Frontend is ready!"
else
    print_error "Frontend failed to start. Check frontend.log for details."
    exit 1
fi

# Open browser
print_info "Opening browser..."
sleep 1  # Give servers a moment to fully start

# Detect OS and open browser accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$FRONTEND_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        xdg-open "$FRONTEND_URL"
    elif command -v gnome-open > /dev/null; then
        gnome-open "$FRONTEND_URL"
    else
        print_warn "Could not automatically open browser. Please open: $FRONTEND_URL"
    fi
else
    print_warn "Unknown OS. Please open: $FRONTEND_URL"
fi

print_info ""
print_info "========================================="
print_info "Application is running!"
print_info "Backend API: $BACKEND_URL"
print_info "Backend Docs: $BACKEND_URL/docs"
print_info "Frontend: $FRONTEND_URL"
print_info ""
print_info "Press Ctrl+C to stop all servers"
print_info "========================================="
print_info ""

# Keep script running and show logs
tail -f backend.log frontend.log 2>/dev/null || {
    # If tail fails, just wait
    print_info "Servers are running. Press Ctrl+C to stop."
    wait
}

