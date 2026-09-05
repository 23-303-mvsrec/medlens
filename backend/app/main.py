from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .config.db import connect_to_mongo, close_mongo_connection
from .config.settings import settings
from .routes import auth_routes, patient_routes, document_routes, medlens_routes

app = FastAPI(title="MedLens Clinical Information Intelligence API", version="2.0.0")

# Ensure uploads directory exists
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
uploads_dir = os.path.join(BASE_DIR, "uploads")

if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)

# Mount Static Files
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# CORS Setup
# Strip spaces and any quotes that might come from env variables
origins = [o.strip().replace('"', '').replace("'", "") for o in settings.ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

from fastapi.responses import FileResponse
from fastapi import HTTPException

# Include Routes
app.include_router(auth_routes.router, prefix="/api")
app.include_router(medlens_routes.router, prefix="/api")
app.include_router(patient_routes.router, prefix="/api")
app.include_router(document_routes.router, prefix="/api")

# Serve Frontend if dist exists (Production / Cloud Run unified container)
frontend_dist = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")
if not os.path.exists(frontend_dist):
    frontend_dist = "/app/frontend/dist"

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index not found")
else:
    @app.get("/")
    async def root():
        return {
            "name": "MedLens Clinical Information Intelligence API",
            "version": "1.0.0",
            "status": "online",
            "docs": "/docs",
            "endpoints": "/api/medlens/dashboard/stats"
        }


