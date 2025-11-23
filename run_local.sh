#!/bin/bash

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r hospital_app/src/backend/requirements.txt

# Start the backend from the correct directory
echo "Starting backend server..."
cd hospital_app/src

# Kill old backend if port 8000 is in use
# Kill old backend if port 8000 is in use
if lsof -i:8000 > /dev/null 2>&1; then
    echo "Port 8000 already in use. Killing old process..."
    kill -9 $(lsof -t -i:8000)
fi

# Kill old frontend if port 3000 is in use
if lsof -i:3000 > /dev/null 2>&1; then
    echo "Port 3000 already in use. Killing old process..."
    kill -9 $(lsof -t -i:3000)
fi

uvicorn backend.main:app --reload &
BACKEND_PID=$!
cd ../.. # Go back to project root

# Start the frontend
echo "Starting frontend server..."
cd hospital_app/src/frontend

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm could not be found. Please install Node.js and npm to run the frontend."
    FRONTEND_PID=""
else
    echo "Installing frontend dependencies..."
    npm install
    echo "Starting frontend on port 3000..."
    PORT=3000 npm start &
    FRONTEND_PID=$!
fi

# Wait for both processes to complete
wait $BACKEND_PID
wait $FRONTEND_PID
```
