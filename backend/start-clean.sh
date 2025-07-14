#!/bin/bash

# Load environment variables from .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

PORT=${PORT:-5000}

# Start the server on the specified port
npx nodemon server.js --port $PORT
