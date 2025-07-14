#!/bin/bash

echo "🚀 Starting Skill Swap Platform in Development Mode..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend will be available at: http://localhost:3001"
echo ""

# Check if nodemon is installed in backend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "🔄 Starting both servers with auto-restart..."
echo "   - Backend: nodemon (auto-restart on file changes)"
echo "   - Frontend: React Scripts (hot reload enabled)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
npm run dev
