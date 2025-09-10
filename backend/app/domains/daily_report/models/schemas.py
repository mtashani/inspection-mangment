from typing import Optional, List
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field

class DailyReportCreateRequest(BaseModel):
    """Request schema for creating a daily report"""
    inspection_id: int = Field(..., description="ID of the inspection this report belongs to")
    report_date: date = Field(..., description="Date of the report")
    description: str = Field(..., min_length=1, description="Description of the work performed")
    inspector_ids: List[int] = Field(..., min_items=1, description="List of inspector IDs")
    inspector_names: Optional[str] = Field(None, description="Names of inspectors (for display)")
    
    # Professional report sections
    findings: Optional[str] = Field(None, description="Detailed findings from the inspection")
    recommendations: Optional[str] = Field(None, description="Recommendations based on findings")
    safety_notes: Optional[str] = Field(None, description="Safety observations and notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "inspection_id": 1,
                "report_date": "2024-01-15",
                "description": "Completed visual inspection of pressure vessel PV-101",
                "inspector_ids": [1, 2],
                "inspector_names": "John Smith, Sarah Johnson",
                "findings": "Minor surface corrosion observed on the lower section of the vessel",
                "recommendations": "Schedule cleaning and protective coating application within 30 days",
                "safety_notes": "Work area properly barricaded, all safety protocols followed"
            }
        }

class DailyReportUpdateRequest(BaseModel):
    """Request schema for updating a daily report"""
    report_date: Optional[date] = Field(None, description="Date of the report")
    description: Optional[str] = Field(None, min_length=1, description="Description of the work performed")
    inspector_ids: Optional[List[int]] = Field(None, description="List of inspector IDs")
    inspector_names: Optional[str] = Field(None, description="Names of inspectors (for display)")
    
    # Professional report sections
    findings: Optional[str] = Field(None, description="Detailed findings from the inspection")
    recommendations: Optional[str] = Field(None, description="Recommendations based on findings")
    safety_notes: Optional[str] = Field(None, description="Safety observations and notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Updated: Completed visual inspection of pressure vessel PV-101",
                "findings": "Updated findings: Minor surface corrosion observed on the lower section",
                "recommendations": "Updated recommendation: Schedule cleaning within 15 days",
                "safety_notes": "Updated: All safety protocols followed, additional PPE used"
            }
        }

class DailyReportResponse(BaseModel):
    """Response schema for daily report"""
    id: int
    inspection_id: int
    report_date: date
    description: str
    inspector_ids: List[int]
    inspector_names: Optional[str] = None
    
    # Professional report sections
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    safety_notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True