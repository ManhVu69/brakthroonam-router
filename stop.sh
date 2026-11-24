#!/usr/bin/env bash
# Brakthroonam Router Stop Script for Linux

echo "==================================================="
echo "   Stopping Brakthroonam Router (Port 20129)..."
echo "==================================================="

PID=$(lsof -ti:20129 2>/dev/null || fuser 20129/tcp 2>/dev/null)

if [ -n "$PID" ]; then
    echo "Terminating Process PID: $PID"
    kill -9 $PID 2>/dev/null
    echo "Brakthroonam Router has been successfully stopped."
else
    # Fallback search by process command
    PIDS=$(pgrep -f "brakthroonam-router|ai-router.*bin/cli.js")
    if [ -n "$PIDS" ]; then
        echo "Terminating Process PID(s): $PIDS"
        kill -9 $PIDS 2>/dev/null
        echo "Brakthroonam Router has been successfully stopped."
    else
        echo "No running Brakthroonam Router instance found on port 20129."
    fi
fi
echo "==================================================="
