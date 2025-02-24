from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_db_and_tables
from .routers import (
    equipment_router,
    inspections_router,
    daily_reports_router,
    inspectors_router
)
import uvicorn
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Industrial Equipment Inspection API",
    description="API for managing industrial equipment inspections and risk assessments based on API 581",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://localhost:8000",  # Development
]

if os.getenv("ADDITIONAL_CORS_ORIGINS"):
    origins.extend(os.getenv("ADDITIONAL_CORS_ORIGINS").split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(equipment_router, prefix="/api/equipment", tags=["equipment"])
app.include_router(inspections_router, prefix="/api/inspections", tags=["inspections"])
app.include_router(daily_reports_router, prefix="/api/daily-reports", tags=["daily-reports"])
app.include_router(inspectors_router, prefix="/api/inspectors", tags=["inspectors"])

@app.on_event("startup")
async def on_startup():
    create_db_and_tables()

@app.get("/", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": os.getenv("ENV", "development")
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV") == "development"
    )