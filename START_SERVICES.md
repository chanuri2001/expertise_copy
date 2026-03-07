# How to Start the Services

## Quick Start Guide

### Step 1: Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
cd AgileSense-AI/deployment
docker-compose up -d mongodb
```

**Option B: Local MongoDB**
```bash
mongod
```

### Step 2: Start Backend API

```bash
cd AgileSense-AI
uvicorn services.expertise_service.api.main:app --reload --port 8000
```

The backend will be available at: `http://localhost:8000`

You can test it by visiting: `http://localhost:8000/health`

### Step 3: Start Frontend

```bash
cd AgileSense-AI/frontend
npm install  # Only needed first time
npm run dev
```

The frontend will be available at: `http://localhost:5173` (or the port Vite assigns)

### Step 4: Initialize Database (First Time Only)

In a new terminal:
```bash
cd AgileSense-AI
python services/expertise_service/scripts/populate_sample_profiles.py
```

## Verify Everything is Running

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend:**
   - Open browser to `http://localhost:5173`
   - Should see the AgileSense-AI interface

3. **MongoDB:**
   ```bash
   mongosh
   use agilesense_ai
   db.developer_profiles.countDocuments()
   ```
   Should show a number > 0 if profiles are loaded

## Troubleshooting Network Errors

If you see "Network Error" or "Cannot connect to backend":

1. **Check Backend is Running:**
   - Look for terminal output showing: `Uvicorn running on http://0.0.0.0:8000`
   - Visit `http://localhost:8000/health` in browser

2. **Check API URL:**
   - Frontend expects backend at `http://localhost:8000`
   - Create `frontend/.env` with: `VITE_API_BASE_URL=http://localhost:8000`
   - Restart frontend after creating .env file

3. **Check CORS:**
   - Backend should allow CORS (already configured)
   - Check browser console for CORS errors

4. **Check Port Conflicts:**
   - Make sure port 8000 is not used by another service
   - Change port if needed: `--port 8001`

## All-in-One Start Script (Windows)

Create `start-all.bat`:
```batch
@echo off
echo Starting MongoDB...
start "MongoDB" cmd /k "mongod"

timeout /t 3

echo Starting Backend...
cd AgileSense-AI
start "Backend API" cmd /k "uvicorn services.expertise_service.api.main:app --reload"

timeout /t 3

echo Starting Frontend...
cd frontend
start "Frontend" cmd /k "npm run dev"

echo All services starting...
pause
```

## All-in-One Start Script (Linux/Mac)

Create `start-all.sh`:
```bash
#!/bin/bash

echo "Starting MongoDB..."
mongod &

sleep 3

echo "Starting Backend..."
cd AgileSense-AI
uvicorn services.expertise_service.api.main:app --reload &

sleep 3

echo "Starting Frontend..."
cd frontend
npm run dev &

echo "All services started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
```

