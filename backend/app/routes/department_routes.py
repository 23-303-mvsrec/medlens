from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional

from ..schemas.department_schema import (
    DepartmentCreate,
    DepartmentUpdate,
    AssignHODSchema,
    DepartmentResponse,
)
from ..services import department_service
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/departments", tags=["Departments"])

async def admin_required(current_user: dict = Depends(get_current_user)):
    """Dependency to check if the current user has the 'admin' role."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action. Admin required.",
        )
    return current_user

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    data: DepartmentCreate,
    _: dict = Depends(admin_required)
):
    """Create a new department (Admin only)."""
    return await department_service.create_department(data)

@router.get("", response_model=List[DepartmentResponse])
async def get_departments(search: Optional[str] = None):
    """Get all departments. Supports optional search by name or code."""
    return await department_service.get_departments(search or "")

@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: str):
    """Get a single department by ID."""
    return await department_service.get_department_by_id(department_id)

@router.patch("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: str,
    data: DepartmentUpdate,
    _: dict = Depends(admin_required)
):
    """Update a department (Admin only)."""
    return await department_service.update_department(department_id, data)

@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: str,
    _: dict = Depends(admin_required)
):
    """Delete a department (Admin only)."""
    await department_service.delete_department(department_id)
    return None

@router.patch("/{department_id}/assign-hod", response_model=DepartmentResponse)
async def assign_hod(
    department_id: str,
    data: AssignHODSchema,
    _: dict = Depends(admin_required)
):
    """Assign a Head of Department (Admin only)."""
    return await department_service.assign_hod(department_id, data)
