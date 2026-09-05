from typing import Dict, Any
from ..config.db import db

class StatsService:
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get aggregate statistics for the dashboard."""
        
        # Total counts
        total_patients = await db.db.patients.count_documents({})
        total_doctors = await db.db.doctors.count_documents({})
        total_departments = await db.db.departments.count_documents({})
        total_documents = await db.db.documents.count_documents({})
        
        # Status counts for patients
        # status: 'Stable' | 'Critical' | 'Discharged' | 'In Treatment'
        # Admitted might be 'In Treatment' or 'Critical'
        admitted_now = await db.db.patients.count_documents({"status": {"$in": ["in treatment", "critical"]}})
        critical_care = await db.db.patients.count_documents({"status": "critical"})
        out_patient = await db.db.patients.count_documents({"status": "stable"})
        discharged = await db.db.patients.count_documents({"status": "discharged"})
        
        return {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_departments": total_departments,
            "total_documents": total_documents,
            "admitted_now": admitted_now,
            "critical_care": critical_care,
            "out_patient": out_patient,
            "discharged": discharged,
            "trends": {
                "patients": "+0%", # Placeholder for trend logic if needed
                "doctors": "Stable",
                "services": "Active",
                "records": "+0%"
            }
        }

stats_service = StatsService()
