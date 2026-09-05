import os
import uuid
from fastapi import UploadFile, HTTPException, status
from typing import List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Saves an uploaded file locally and returns the file path.
    Generates a unique filename using UUID + original name.
    """
    # Check file extension
    file_ext = upload_file.filename.split(".")[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size (optional, since UploadFile doesn't directly expose size until read)
    # But we can read a chunk and check
    
    unique_filename = f"{uuid.uuid4()}_{upload_file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            content = await upload_file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File size exceeds limit of {MAX_FILE_SIZE // (1024 * 1024)}MB"
                )
            f.write(content)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )
    finally:
        await upload_file.close()
    
    # Return a clean relative URL — always /uploads/{filename}, not the absolute disk path
    return f"/uploads/{unique_filename}"

def delete_local_file(file_url: str):
    """
    Deletes a file from local storage.
    file_url is expected to be a relative URL like /uploads/filename.jpg.
    Reconstructs the absolute disk path using UPLOAD_DIR.
    """
    # Extract just the filename from the URL (e.g. /uploads/uuid_name.jpg -> uuid_name.jpg)
    filename = os.path.basename(file_url)
    file_path = os.path.join(UPLOAD_DIR, filename)

    if os.path.exists(file_path):
        os.remove(file_path)
