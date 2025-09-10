from fastapi import APIRouter
from app.domains.equipment.api.equipment import router as equipment_router

# Create aggregated router for the equipment domain
router = APIRouter()

# Include the equipment router
router.include_router(equipment_router, tags=["Equipment"])
