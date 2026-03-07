# Expertise Service Configuration Guide

## Overview
This service follows microservices architecture best practices for configuration management.

## Configuration Sources (Priority Order)
1. **Environment Variables** (Highest Priority) - For Docker/Kubernetes/Azure
2. **.env file** - For local development
3. **Default values** - Fallback values in code

## Required Environment Variables

### MongoDB Configuration
```bash
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017
# For Azure Cosmos DB: mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb
# For MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Database Name
MONGODB_DB_NAME=agilesense_ai

# Collection Name (optional, defaults to developer_profiles)
MONGODB_COLLECTION_NAME=developer_profiles
```

### API Configuration
```bash
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=false  # Set to true for development
```

### Other Configuration
```bash
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
CORS_ORIGINS=*  # Comma-separated list of allowed origins
SERVICE_VERSION=1.0.0
```

## Local Development Setup

1. Create a `.env` file in `services/expertise_service/`:
```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=agilesense_ai
API_PORT=8000
API_RELOAD=true
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://localhost:5173
```

2. Install python-dotenv:
```bash
pip install python-dotenv
```

3. Load environment variables in your application (see config.py)

## Docker Deployment

Set environment variables in `docker-compose.yml` or use `.env` file:

```yaml
services:
  expertise-service:
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - MONGODB_DB_NAME=agilesense_ai
      - API_PORT=8000
```

## Azure Deployment

### Using Azure App Service
Set environment variables in Azure Portal:
- Configuration → Application Settings
- Add each variable as shown above

### Using Azure Container Instances / AKS
Set via:
- Environment variables in deployment YAML
- Azure Key Vault (for sensitive values)
- ConfigMaps (Kubernetes)

### Using Azure Key Vault (Recommended for Production)
1. Store sensitive values in Azure Key Vault:
   - `mongodb-uri`
   - `mongodb-connection-string`

2. Reference in App Service:
   - Configuration → Key Vault references
   - Or use Managed Identity in code

## Kubernetes Deployment

Create a ConfigMap:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: expertise-service-config
data:
  MONGODB_DB_NAME: "agilesense_ai"
  API_PORT: "8000"
  LOG_LEVEL: "INFO"
```

Create a Secret for sensitive data:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: expertise-service-secrets
type: Opaque
stringData:
  MONGODB_URI: "mongodb://..."
```

Reference in deployment:
```yaml
envFrom:
  - configMapRef:
      name: expertise-service-config
  - secretRef:
      name: expertise-service-secrets
```

## Configuration File Location

The configuration is managed in:
- `services/expertise_service/core/config.py` - Configuration class
- `services/expertise_service/.env` - Local development (gitignored)
- Environment variables - Production

## Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use Azure Key Vault** for production secrets
3. **Use environment-specific configs** (.env.local, .env.production)
4. **Validate configuration** on service startup
5. **Use service-specific prefixes** for environment variables (e.g., `EXPERIENCE_SERVICE_MONGODB_URI`)




