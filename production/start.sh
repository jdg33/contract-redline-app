#!/bin/bash

echo "🚀 Starting Contract Redline Assistant"
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "Please add your Anthropic API key to backend/.env"
    echo ""
    echo "1. Get your API key from: https://console.anthropic.com/"
    echo "2. Copy backend/.env.example to backend/.env"
    echo "3. Replace 'your_anthropic_api_key_here' with your actual key"
    exit 1
fi

# Check if API key is configured
if grep -q "your_anthropic_api_key_here" backend/.env; then
    echo "⚠️  Warning: Anthropic API key not configured!"
    echo "Please edit backend/.env and add your API key"
    echo ""
    echo "Get your key from: https://console.anthropic.com/"
    exit 1
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ Starting servers..."
echo ""
echo "Backend API: http://localhost:3001"
echo "Frontend UI: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
trap 'kill 0' EXIT
cd backend && npm run dev &
cd frontend && npm run dev &
wait
