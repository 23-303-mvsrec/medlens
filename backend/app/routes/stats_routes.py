from fastapi import APIRouter, Depends
from ..services.stats_service import stats_service
from ..utils.dependencies import require_doctor

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(require_doctor)):
    """Get dashboard statistics."""
    return await stats_service.get_dashboard_stats()
