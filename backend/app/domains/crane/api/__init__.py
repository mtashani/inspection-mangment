from fastapi import APIRouter
from app.domains.crane.api.crane import router as crane_router

# Create aggregated router for the crane domain
router = APIRouter()

# Include the crane router
router.include_router(crane_router, tags=["Cranes"])
