# Quick Start Guide - Expertise Service

## 🚀 Fastest Way to Get Started

### Step 1: Setup MongoDB

**Option A: Docker (Easiest)**
```bash
cd AgileSense-AI/deployment
docker-compose up -d mongodb
```

**Option B: Local MongoDB**
```bash
# Install MongoDB, then start it
mongod
```

### Step 2: Create .env File

```bash
cd AgileSense-AI/services/expertise_service
cp .env.example .env
```

Edit `.env`:
```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=agilesense_ai
API_PORT=8000
API_RELOAD=true
```

### Step 3: Install Dependencies

```bash
cd AgileSense-AI
pip install -r requirements.txt
```

### Step 4: Initialize Database

```bash
python services/expertise_service/scripts/populate_sample_profiles.py
```

### Step 5: Start Service

```bash
uvicorn services.expertise_service.api.main:app --reload
```

### Step 6: Verify

Open browser: http://localhost:8000/health

You should see: `{"status":"ok"}`

---

## 📁 Where Files Go

```
services/expertise_service/
├── .env              ← YOUR CONFIG (create this, don't commit)
├── .env.example      ← Template (already exists)
├── core/
│   └── config.py     ← Reads from .env
└── api/
    └── main.py        ← Loads .env automatically
```

---

## 🗄️ Database Creation

MongoDB creates databases automatically! Just:
1. Set `MONGODB_URI` in `.env`
2. Run populate script
3. Database `agilesense_ai` will be created with collection `developer_profiles`

---

## ✅ Checklist

- [ ] MongoDB running (check with `mongosh`)
- [ ] `.env` file created in `services/expertise_service/`
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Database populated (`python populate_sample_profiles.py`)
- [ ] Service started (`uvicorn ...`)
- [ ] Health check works (http://localhost:8000/health)

---

## 🐳 Docker Alternative

Everything in one command:
```bash
cd deployment
docker-compose up -d
```

Then initialize:
```bash
docker-compose exec expertise-service python -m services.expertise_service.scripts.populate_sample_profiles
```

