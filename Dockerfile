# ==============================================================================
# MedLens — AI-Powered Clinical Information Intelligence
# Unified Production Container (Google Cloud Run Ready)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the React / Vite Frontend
# ------------------------------------------------------------------------------
FROM node:20-slim AS frontend-builder
WORKDIR /build

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Backend + Static Asset Serving
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./backend/

# Copy compiled frontend from Stage 1 into the location expected by FastAPI
COPY --from=frontend-builder /build/dist ./frontend/dist

# Create uploads and local data directories
RUN mkdir -p /app/backend/uploads /app/backend/data

WORKDIR /app/backend

# Expose Cloud Run default port
EXPOSE 8080

# Run uvicorn server binding to 0.0.0.0 with dynamic $PORT support
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
