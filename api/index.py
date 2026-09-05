import sys
import os

# Ensure backend directory is discoverable by Python runtime on Vercel
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

# Export the FastAPI instance as 'app' for Vercel Serverless Functions
