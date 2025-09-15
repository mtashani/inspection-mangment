from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database import create_db_and_tables

# Import all models to ensure they are registered with SQLAlchemy
from app.domains.inspector.models.inspector import Inspector, InspectorCertificationRecord
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.inspection_team import InspectionTeam
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.equipment.models.equipment import Equipment

# Remove auth router temporarily to avoid db session issues
# from app.domains.auth.api.auth import router as auth_router

# Create FastAPI app
app = FastAPI(
    title="Inspection Management API",
    description="API for inspection management system",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Allow both frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers - DDD Structure Organization
print("🚀 Loading API routers...")

# PSV Domain Routers
try:
    from app.domains.psv.api.psv import router as psv_router
    from app.domains.psv.api.rbi import router as psv_rbi_router
    app.include_router(psv_router, prefix=f"{settings.API_V1_STR}/psv", tags=["PSV"])
    app.include_router(psv_rbi_router, prefix=f"{settings.API_V1_STR}/psv", tags=["PSV RBI"])
    print("✅ PSV domain routers loaded successfully")
except Exception as e:
    print(f"❌ Failed to load PSV routers: {e}")

# Inspector Domain Routers (Inspector-Centric Structure)
try:
    # Core Inspector Management
    from app.domains.inspector.api.inspector import router as inspector_router

    app.include_router(inspector_router, prefix=f"{settings.API_V1_STR}/inspectors", tags=["Inspectors"])

    
    # Inspector Attendance Hub (with integrated analytics and reports)
    from app.domains.inspector.api.attendance.attendance import router as inspector_attendance_router
    from app.domains.inspector.api.attendance.analytics import router as inspector_attendance_analytics_router
    from app.domains.inspector.api.attendance.reports import router as inspector_attendance_reports_router
    app.include_router(inspector_attendance_router, prefix=f"{settings.API_V1_STR}/inspectors/attendance", tags=["Inspector Attendance"])
    app.include_router(inspector_attendance_analytics_router, prefix=f"{settings.API_V1_STR}/inspectors/attendance/analytics", tags=["Inspector Attendance Analytics"])
    app.include_router(inspector_attendance_reports_router, prefix=f"{settings.API_V1_STR}/inspectors/attendance/reports", tags=["Inspector Attendance Reports"])
    
    # Inspector Payroll Management
    from app.domains.inspector.api.payroll.payroll import router as inspector_payroll_router
    app.include_router(inspector_payroll_router, prefix=f"{settings.API_V1_STR}/inspectors/payroll", tags=["Inspector Payroll"])
    
    # Inspector Work Cycles Management
    from app.domains.inspector.api.work_cycle.work_cycle import router as inspector_work_cycle_router
    app.include_router(inspector_work_cycle_router, prefix=f"{settings.API_V1_STR}/inspectors/work-cycles", tags=["Inspector Work Cycles"])
    
    print("✅ Inspector domain routers loaded successfully (Inspector-Centric Structure)")
    print(f"🔗 Inspector Management: {settings.API_V1_STR}/inspectors")
    print(f"🔗 Inspector Attendance: {settings.API_V1_STR}/inspectors/attendance")
    print(f"🔗 Inspector Attendance Analytics: {settings.API_V1_STR}/inspectors/attendance/analytics")
    print(f"🔗 Inspector Attendance Reports: {settings.API_V1_STR}/inspectors/attendance/reports")
    print(f"🔗 Inspector Payroll: {settings.API_V1_STR}/inspectors/payroll")
    print(f"🔗 Inspector Work Cycles: {settings.API_V1_STR}/inspectors/work-cycles")
except Exception as e:
    print(f"❌ Failed to load Inspector routers: {e}")
    import traceback
    traceback.print_exc()

# Admin Domain Routers
try:
    from app.domains.admin.api.admin_router import router as admin_router
    
    app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin")
    
    print("✅ Admin domain router loaded successfully")
    print(f"🔗 Admin Dashboard: {settings.API_V1_STR}/admin/dashboard")
    print(f"🔗 Admin Management: {settings.API_V1_STR}/admin/roles, /permissions, etc.")
except Exception as e:
    print(f"❌ Failed to load Admin router: {e}")
    import traceback
    traceback.print_exc()

# Equipment Domain Routers
try:
    from app.domains.equipment.api.equipment import router as equipment_router
    app.include_router(equipment_router, prefix=f"{settings.API_V1_STR}/equipment", tags=["Equipment"])
    print("✅ Equipment domain router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load Equipment router: {e}")

# Crane Domain Routers
try:
    from app.domains.crane.api.crane import router as crane_router
    app.include_router(crane_router, prefix=f"{settings.API_V1_STR}/cranes", tags=["Cranes"])
    print("✅ Crane domain router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load Crane router: {e}")

# Corrosion Domain Routers
try:
    from app.domains.corrosion.api.analysis import router as corrosion_analysis_router
    from app.domains.corrosion.api.coupon import router as corrosion_coupon_router
    from app.domains.corrosion.api.location import router as corrosion_location_router
    from app.domains.corrosion.api.settings import router as corrosion_settings_router
    app.include_router(corrosion_analysis_router, prefix=f"{settings.API_V1_STR}/corrosion", tags=["Corrosion Analysis"])
    app.include_router(corrosion_coupon_router, prefix=f"{settings.API_V1_STR}/corrosion", tags=["Corrosion Coupons"])
    app.include_router(corrosion_location_router, prefix=f"{settings.API_V1_STR}/corrosion", tags=["Corrosion Locations"])
    app.include_router(corrosion_settings_router, prefix=f"{settings.API_V1_STR}/corrosion", tags=["Corrosion Settings"])
    print("✅ Corrosion domain routers loaded successfully")
except Exception as e:
    print(f"❌ Failed to load Corrosion routers: {e}")

# Daily Reports Domain (DDD Structure)
try:
    from app.domains.daily_report.api.report import router as daily_report_domain_router
    app.include_router(daily_report_domain_router, prefix=f"{settings.API_V1_STR}/daily-reports", tags=["Daily Reports"])
    print("✅ Daily Reports domain router loaded successfully")
    print(f"🔗 Daily Reports routes available at: {settings.API_V1_STR}/daily-reports")
except Exception as e:
    print(f"❌ Failed to load Daily Reports domain router: {e}")

# Inspection Domain Router (New DDD Structure)
try:
    from app.domains.inspection.api.inspection_routes import router as inspection_router
    from app.domains.inspection.api.workflow_routes import router as workflow_router
    app.include_router(inspection_router, prefix=f"{settings.API_V1_STR}/inspections", tags=["Inspections"])
    app.include_router(workflow_router, prefix=f"{settings.API_V1_STR}/inspections", tags=["Inspection Workflow"])
    print("✅ Inspection domain router loaded successfully")
    print(f"🔗 Inspection routes available at: {settings.API_V1_STR}/inspections")
    print(f"🔗 Inspection workflow routes available at: {settings.API_V1_STR}/inspections")
except Exception as e:
    print(f"❌ Failed to load Inspection domain router: {e}")
    import traceback
    traceback.print_exc()

# Maintenance Domain Router (New DDD Structure)
try:
    from app.domains.maintenance.api.maintenance_routes import router as maintenance_router
    from app.domains.maintenance.api.analytics_routes import router as analytics_router
    from app.domains.maintenance.api.filtering_routes import router as filtering_router
    from app.domains.maintenance.api.reporting_routes import router as reporting_router
    from app.domains.maintenance.api.status_management_routes import router as status_management_router
    from app.domains.maintenance.api.validation_routes import router as validation_router
    
    app.include_router(maintenance_router, prefix=f"{settings.API_V1_STR}/maintenance", tags=["Maintenance"])
    app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/maintenance", tags=["Maintenance Analytics"])
    app.include_router(filtering_router, prefix=f"{settings.API_V1_STR}/maintenance", tags=["Maintenance Filtering"])
    app.include_router(reporting_router, prefix=f"{settings.API_V1_STR}/maintenance", tags=["Maintenance Reporting"])
    app.include_router(status_management_router, prefix=f"{settings.API_V1_STR}/maintenance", tags=["Status Management"])
    app.include_router(validation_router, prefix=f"{settings.API_V1_STR}/maintenance", tags=["Maintenance Validation"])
    
    print("✅ Maintenance domain routers loaded successfully")
    print(f"🔗 Maintenance routes available at: {settings.API_V1_STR}/maintenance")
except Exception as e:
    print(f"❌ Failed to load Maintenance domain router: {e}")
    import traceback
    traceback.print_exc()

# Authentication Router
try:
    from app.domains.auth.api.auth import router as auth_router
    app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
    print("✅ Authentication router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load Authentication router: {e}")

# Professional Report System Router
try:
    from app.domains.report.api.router import router as report_router
    app.include_router(report_router, tags=["Professional Reports"])
    print("✅ Professional Report System router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load Professional Report System router: {e}")

# RBI Calculation System Router
try:
    from app.domains.rbi.routers.rbi_router import router as rbi_router
    app.include_router(rbi_router, tags=["RBI Calculations"])
    print("✅ RBI Calculation System router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load RBI Calculation System router: {e}")

# Notification System Router (Real-time Notifications)
try:
    from app.domains.notifications.api import notification_router, websocket_router
    app.include_router(notification_router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])
    app.include_router(websocket_router, prefix=f"{settings.API_V1_STR}/notifications", tags=["WebSocket Notifications"])
    print("✅ Notification System router loaded successfully")
    print(f"🔗 Notification routes available at: {settings.API_V1_STR}/notifications")
    print(f"🔗 WebSocket endpoint available at: {settings.API_V1_STR}/notifications/ws/notifications")
except Exception as e:
    print(f"❌ Failed to load Notification System router: {e}")
    import traceback
    traceback.print_exc()

print("🎉 All available routers loaded!")

# Initialize database tables
@app.on_event("startup")
async def startup_event():
    create_db_and_tables()

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return JSONResponse(content={"status": "ok"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)