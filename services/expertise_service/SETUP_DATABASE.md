# Database Setup Guide for Expertise Service

## Overview
This guide explains how to set up MongoDB database for the Expertise Recommendation Service in a microservices architecture.

## Step 1: Choose Your MongoDB Setup

### Option A: Local MongoDB (Development)
### Option B: Docker Compose (Recommended for Development)
### Option C: MongoDB Atlas (Cloud - Production)
### Option D: Azure Cosmos DB (Azure - Production)

---

## Option A: Local MongoDB Setup

### 1. Install MongoDB Locally

**Windows:**
1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB will be installed at `C:\Program Files\MongoDB\Server\<version>\bin`
4. Add to PATH or use full path

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 2. Create .env File

Create `services/expertise_service/.env`:
```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=agilesense_ai
MONGODB_COLLECTION_NAME=developer_profiles
API_PORT=8000
API_RELOAD=true
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://localhost:5173
```

### 3. Start MongoDB
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongodb
# or
mongod --dbpath /data/db
```

### 4. Create Database (Automatic)
The database `agilesense_ai` will be created automatically when you first insert data.

### 5. Verify Database
```bash
mongosh
use agilesense_ai
show collections
```

---

## Option B: Docker Compose (Recommended)

### 1. Use the Provided docker-compose.yml

The `deployment/docker-compose.yml` already includes MongoDB setup.

### 2. Start Services
```bash
cd AgileSense-AI/deployment
docker-compose up -d
```

This will:
- Start MongoDB container
- Create database `agilesense_ai`
- Start expertise-service connected to MongoDB

### 3. Verify MongoDB is Running
```bash
docker-compose ps
docker-compose logs mongodb
```

### 4. Access MongoDB Shell
```bash
docker-compose exec mongodb mongosh
use agilesense_ai
show collections
```

### 5. .env File Location
For Docker Compose, environment variables are set in `docker-compose.yml`. 
You can also create `services/expertise_service/.env` for local development.

---

## Option C: MongoDB Atlas (Cloud)

### 1. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (Free tier available)

### 2. Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

### 3. Create .env File
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=agilesense_ai
MONGODB_COLLECTION_NAME=developer_profiles
```

### 4. Whitelist IP Address
In Atlas dashboard:
- Network Access → Add IP Address
- Add `0.0.0.0/0` for development (not recommended for production)

### 5. Database Creation
Database and collections are created automatically on first insert.

---

## Option D: Azure Cosmos DB (Azure)

### 1. Create Cosmos DB Account
1. Azure Portal → Create Resource
2. Search "Azure Cosmos DB"
3. Select "MongoDB API"
4. Create account

### 2. Get Connection String
1. Go to your Cosmos DB account
2. Connection String → Copy Primary Connection String

### 3. Create .env File
```bash
MONGODB_URI=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb
MONGODB_DB_NAME=agilesense_ai
MONGODB_COLLECTION_NAME=developer_profiles
```

### 4. Database Creation
Database and collections are created automatically.

---

## Step 2: Initialize Database with Sample Data

### Option 1: Using Python Script (Recommended)

```bash
cd AgileSense-AI
python services/expertise_service/scripts/populate_sample_profiles.py
```

This will:
- Create developer profiles
- Initialize the database
- Add sample data

### Option 2: Using MongoDB Shell

```bash
mongosh
use agilesense_ai

# Insert a sample developer
db.developer_profiles.insertOne({
  email: "alice@example.com",
  name: "Alice Perera",
  expertise: {
    API: 0.82,
    Authentication: 0.31,
    Database: 0.65,
    DevOps: 0.22,
    Documentation: 0.99,
    Performance: 0.79,
    Security: 0.32,
    Testing: 0.65,
    UI: 0.87
  },
  jiraIssuesSolved: {
    API: 23,
    Authentication: 87,
    Database: 98,
    DevOps: 23,
    Documentation: 77,
    Performance: 88,
    Security: 76,
    Testing: 55,
    UI: 87
  },
  githubCommits: {
    API: 82,
    Authentication: 31,
    Database: 65,
    DevOps: 22,
    Documentation: 99,
    Performance: 79,
    Security: 32,
    Testing: 65,
    UI: 87
  },
  pendingIssues: {},
  resolvedIssues: {}
})
```

---

## Step 3: Verify Database Setup

### Check Database Exists
```bash
mongosh
show dbs
use agilesense_ai
show collections
```

### Check Data
```bash
db.developer_profiles.find().pretty()
db.developer_profiles.countDocuments()
```

---

## Step 4: Update Configuration

### For Local Development
1. Copy `.env.example` to `.env`:
   ```bash
   cd services/expertise_service
   cp .env.example .env
   ```

2. Edit `.env` with your MongoDB URI:
   ```bash
   MONGODB_URI=mongodb://localhost:27017
   ```

### For Docker
Environment variables are in `deployment/docker-compose.yml`:
```yaml
environment:
  - MONGODB_URI=mongodb://mongodb:27017
  - MONGODB_DB_NAME=agilesense_ai
```

### For Production (Azure/Kubernetes)
Set environment variables in:
- Azure App Service: Configuration → Application Settings
- Kubernetes: ConfigMaps and Secrets
- Azure Key Vault: For sensitive values

---

## Step 5: Load Environment Variables in Python

The `config.py` automatically reads from environment variables. 
For `.env` file support, install python-dotenv:

```bash
pip install python-dotenv
```

Then update `services/expertise_service/api/main.py` to load .env:
```python
from dotenv import load_dotenv
import os

# Load .env file if it exists
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)
```

---

## Quick Start Commands

### Local Development
```bash
# 1. Start MongoDB locally
mongod

# 2. Create .env file
cd services/expertise_service
cp .env.example .env
# Edit .env with your MongoDB URI

# 3. Initialize database
cd ../..
python services/expertise_service/scripts/populate_sample_profiles.py

# 4. Start service
uvicorn services.expertise_service.api.main:app --reload
```

### Docker Compose
```bash
# 1. Start all services (MongoDB + Expertise Service)
cd deployment
docker-compose up -d

# 2. Initialize database
docker-compose exec expertise-service python -m services.expertise_service.scripts.populate_sample_profiles

# 3. Check logs
docker-compose logs -f expertise-service
```

---

## Troubleshooting

### MongoDB Connection Failed
- Check MongoDB is running: `mongosh` or `docker-compose ps`
- Verify URI in .env matches your setup
- Check firewall/network access
- For Atlas: Verify IP whitelist

### Database Not Found
- MongoDB creates databases automatically on first insert
- Run populate script to create initial data

### Collection Not Found
- Collections are created automatically
- Check collection name matches `MONGODB_COLLECTION_NAME`

---

## File Structure

```
AgileSense-AI/
├── services/
│   └── expertise_service/
│       ├── .env                    # Local development config (gitignored)
│       ├── .env.example            # Template (committed)
│       ├── core/
│       │   └── config.py           # Configuration class
│       └── scripts/
│           └── populate_sample_profiles.py
├── deployment/
│   └── docker-compose.yml          # Docker environment config
└── models/
    └── expertise_recommendation/   # ML models
```

---

## Security Best Practices

1. **Never commit .env files** - Add to `.gitignore`
2. **Use environment variables** in production
3. **Use Azure Key Vault** for sensitive values
4. **Restrict MongoDB access** - Use authentication
5. **Use connection strings** with credentials in production

