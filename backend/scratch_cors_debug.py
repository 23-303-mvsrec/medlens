import sys
import os

# Add the backend app to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.config.settings import settings

print(f"RAW ALLOWED_ORIGINS: {settings.ALLOWED_ORIGINS}")
origins = [o.strip().replace('"', '').replace("'", "") for o in settings.ALLOWED_ORIGINS.split(",")]
print(f"PARSED ORIGINS: {origins}")
