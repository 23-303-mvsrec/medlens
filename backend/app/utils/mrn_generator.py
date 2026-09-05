from ..config.db import get_database

async def generate_mrn() -> str:
    """
    Generates a unique Medical Record Number (MRN) using atomic increments.
    Format: MRN000001, MRN000002, etc.
    """
    db = get_database()
    
    # Atomic increment of the counter
    counter = await db.counters.find_one_and_update(
        {"_id": "patient_mrn"},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )
    
    sequence_value = counter["sequence_value"]
    
    # Format the MRN with leading zeros (e.g., MRN000001)
    return f"MRN{sequence_value:06d}"
