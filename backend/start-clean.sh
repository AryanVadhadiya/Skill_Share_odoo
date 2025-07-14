#!/bin/bash
# Kill any process using port 8088, then start the backend server
PORT=8088

# Find and kill process using the port
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null

# Start the backend server
npm start
