#!/bin/bash

# Find and kill all processes using port 8000
sudo lsof -t -i :8000 | xargs sudo kill -9

echo "✅ All processes on port 8000 have been terminated."

