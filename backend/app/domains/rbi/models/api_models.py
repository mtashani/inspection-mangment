"""API Models for RBI REST API"""

from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum

from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    RBICalculationResult,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType
)
from app.domains.rbi.services.adaptive_parameter_adjuster import AdjustmentStrategy


class CalculationLevelEnum(str, Enum):
    """Calculation level options for API"""
    AUTO = "auto"
    LEVEL_1 = "level_1"
    LEVEL_2 = "level_2"
    LEVEL_3 = "level_3"


class ReportFormatEnum(str, Enum):
    """Report format options"""
    JSON = "json"
    PDF = "pdf"
    HTML = "html"
    EXCEL = "excel"


# Request Models

class RBICalculationRequest(BaseModel):
    """Request model for RBI calculation"""
    equipment_id: str = Field(..., description="Unique equipment identifier")
    equipment_data: EquipmentData = Field(..., description="Equipment master data")
    inspection_data: Optional[List[ExtractedRBIData]] = Field(None, description="Historical inspection data")
    force_calculation_level: Optional[CalculationLevelEnum] = Field(None, description="Force specific calculation level")
    custom_parameters: Optional[Dict[str, Any]] = Field(None, description="Custom calculation parameters")
    user_id: Optional[str] = Field(None, description="User performing the calculation")
    calculation_context: Optional[Dict[str, Any]] = Field(None, description="Additional calculation context")
    
    class Config:
        schema_extra = {
            "example": {
                "equipment_id": "101-E-401A",
                "equipment_data": {
                    "equipment_id": "101-E-401A",
                    "equipment_type": "pressure_vessel",
                    "service_type": "sour_gas",
                    "installation_date": "2005-01-15T00:00:00",
                    "design_pressure": 25.0,
                    "design_temperature": 150.0,
                    "material": "Carbon Steel",
                    "criticality_level": "High"
                },
                "force_calculation_level": "auto",
                "user_id": "user123"
            }
        }


class BatchCalculationRequest(BaseModel):
    """Request model for batch RBI calculations"""
    equipment_list: List[EquipmentData] = Field(..., description="List of equipment to calculate")
    inspection_data_map: Optional[Dict[str, List[ExtractedRBIData]]] = Field(None, description="Inspection data mapped by equipment ID")
    calculation_options: Optional[Dict[str, Any]] = Field(None, description="Batch calculation options")
    user_id: Optional[str] = Field(None, description="User performing the calculations")
    batch_context: Optional[Dict[str, Any]] = Field(None, description="Batch calculation context")
    
    @field_validator('equipment_list')
    @classmethod
    def validate_equipment_list(cls, v):
        if len(v) == 0:
            raise ValueError("Equipment list cannot be empty")
        if len(v) > 100:
            raise ValueError("Maximum 100 equipment items per batch")
        return v


class ConfigurationRequest(BaseModel):
    """Request model for configuration updates"""
    configuration_updates: Dict[str, Any] = Field(..., description="Configuration updates to apply")
    user_id: str = Field(..., description="User making the configuration change")
    update_reason: Optional[str] = Field(None, description="Reason for configuration update")
    validate_only: bool = Field(False, description="Only validate without applying changes")
    
    class Config:
        schema_extra = {
            "example": {
                "configuration_updates": {
                    "scoring_tables": {
                        "pof_corrosion_rate": {
                            "low": {"min": 0, "max": 0.1, "score": 1},
                            "medium": {"min": 0.1, "max": 0.5, "score": 3},
                            "high": {"min": 0.5, "max": 1.0, "score": 5}
                        }
                    }
                },
                "user_id": "admin123",
                "update_reason": "Updated corrosion rate scoring based on new industry standards"
            }
        }


class ReportRequest(BaseModel):
    """Request model for report generation"""
    equipment_id: str = Field(..., description="Equipment ID for report")
    calculation_result: Optional[RBICalculationResult] = Field(None, description="Calculation result to include in report")
    report_format: ReportFormatEnum = Field(ReportFormatEnum.JSON, description="Report output format")
    report_options: Optional[Dict[str, Any]] = Field(None, description="Report generation options")
    include_charts: bool = Field(True, description="Include charts and visualizations")
    include_recommendations: bool = Field(True, description="Include recommendations")
    
    class Config:
        schema_extra = {
            "example": {
                "equipment_id": "101-E-401A",
                "report_format": "json",
                "include_charts": True,
                "include_recommendations": True
            }
        }


class PatternAnalysisRequest(BaseModel):
    """Request model for pattern analysis"""
    equipment_id: str = Field(..., description="Equipment ID for pattern analysis")
    equipment_data: EquipmentData = Field(..., description="Equipment data")
    historical_calculations: List[RBICalculationResult] = Field(..., description="Historical calculation results")
    inspection_history: Optional[List[ExtractedRBIData]] = Field(None, description="Historical inspection data")
    analysis_options: Optional[Dict[str, Any]] = Field(None, description="Pattern analysis options")


class ParameterAdjustmentRequest(BaseModel):
    """Request model for parameter adjustment"""
    equipment_id: str = Field(..., description="Equipment ID for parameter adjustment")
    current_parameters: Dict[str, float] = Field(..., description="Current parameter values")
    adjustment_strategy: AdjustmentStrategy = Field(AdjustmentStrategy.BALANCED, description="Adjustment strategy to use")
    force_adjustment: bool = Field(False, description="Force adjustment even with insufficient data")
    user_id: Optional[str] = Field(None, description="User requesting the adjustment")
    adjustment_reason: Optional[str] = Field(None, description="Reason for parameter adjustment")
    
    class Config:
        schema_extra = {
            "example": {
                "equipment_id": "101-E-401A",
                "current_parameters": {
                    "corrosion_rate_factor": 1.2,
                    "age_factor": 1.15,
                    "inspection_effectiveness": 0.75,
                    "material_factor": 1.1,
                    "environmental_factor": 1.3
                },
                "adjustment_strategy": "balanced",
                "user_id": "user123"
            }
        }


# Response Models

class RBICalculationResponse(BaseModel):
    """Response model for RBI calculation"""
    success: bool = Field(..., description="Calculation success status")
    calculation_result: Optional[RBICalculationResult] = Field(None, description="Calculation result")
    message: str = Field(..., description="Response message")
    calculation_timestamp: datetime = Field(..., description="When calculation was performed")
    warnings: Optional[List[str]] = Field(None, description="Calculation warnings")
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "calculation_result": {
                    "equipment_id": "101-E-401A",
                    "risk_level": "medium",
                    "inspection_interval_months": 18,
                    "confidence_score": 0.85,
                    "calculation_level": "level_2"
                },
                "message": "RBI calculation completed successfully",
                "calculation_timestamp": "2024-01-15T10:30:00"
            }
        }


class BatchCalculationResponse(BaseModel):
    """Response model for batch RBI calculations"""
    success: bool = Field(..., description="Batch calculation success status")
    calculation_results: List[RBICalculationResult] = Field(..., description="List of calculation results")
    total_processed: int = Field(..., description="Total number of equipment processed")
    successful_calculations: int = Field(..., description="Number of successful calculations")
    failed_calculations: int = Field(..., description="Number of failed calculations")
    message: str = Field(..., description="Response message")
    calculation_timestamp: datetime = Field(..., description="When batch calculation was performed")
    processing_time_seconds: Optional[float] = Field(None, description="Total processing time")
    
    @field_validator('calculation_results')
    @classmethod
    def validate_results_count(cls, v, info):
        if hasattr(info, 'data') and 'total_processed' in info.data and len(v) != info.data['total_processed']:
            raise ValueError("Results count must match total processed")
        return v


class ConfigurationResponse(BaseModel):
    """Response model for configuration operations"""
    success: bool = Field(..., description="Configuration operation success status")
    configuration: Dict[str, Any] = Field(..., description="Current or updated configuration")
    message: str = Field(..., description="Response message")
    last_updated: datetime = Field(..., description="When configuration was last updated")
    validation_errors: Optional[List[str]] = Field(None, description="Configuration validation errors")


class ReportResponse(BaseModel):
    """Response model for report generation"""
    success: bool = Field(..., description="Report generation success status")
    report: Dict[str, Any] = Field(..., description="Generated report data")
    message: str = Field(..., description="Response message")
    generated_at: datetime = Field(..., description="When report was generated")
    report_format: ReportFormatEnum = Field(..., description="Report format")
    download_url: Optional[str] = Field(None, description="Download URL for file-based reports")


class PatternAnalysisResponse(BaseModel):
    """Response model for pattern analysis"""
    success: bool = Field(..., description="Pattern analysis success status")
    analysis_result: Dict[str, Any] = Field(..., description="Pattern analysis results")
    message: str = Field(..., description="Response message")
    analysis_timestamp: datetime = Field(..., description="When analysis was performed")
    confidence_score: Optional[float] = Field(None, description="Overall analysis confidence")


class ParameterAdjustmentResponse(BaseModel):
    """Response model for parameter adjustment"""
    success: bool = Field(..., description="Parameter adjustment success status")
    adjustment_result: Dict[str, Any] = Field(..., description="Parameter adjustment results")
    message: str = Field(..., description="Response message")
    adjustment_timestamp: datetime = Field(..., description="When adjustment was performed")
    rollback_available: bool = Field(True, description="Whether rollback is available")


class ErrorResponse(BaseModel):
    """Response model for errors"""
    success: bool = Field(False, description="Always false for error responses")
    error_code: int = Field(..., description="HTTP error code")
    error_message: str = Field(..., description="Error message")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(..., description="When error occurred")
    request_id: Optional[str] = Field(None, description="Request ID for tracking")
    
    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "error_code": 400,
                "error_message": "Invalid equipment data provided",
                "timestamp": "2024-01-15T10:30:00"
            }
        }


# Utility Models

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        return self.page_size


class FilterParams(BaseModel):
    """Common filter parameters"""
    equipment_type: Optional[EquipmentType] = Field(None, description="Filter by equipment type")
    service_type: Optional[ServiceType] = Field(None, description="Filter by service type")
    risk_level: Optional[RiskLevel] = Field(None, description="Filter by risk level")
    calculation_level: Optional[RBILevel] = Field(None, description="Filter by calculation level")
    start_date: Optional[datetime] = Field(None, description="Start date filter")
    end_date: Optional[datetime] = Field(None, description="End date filter")
    
    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v, info):
        if hasattr(info, 'data') and v and 'start_date' in info.data and info.data['start_date'] and v < info.data['start_date']:
            raise ValueError("End date must be after start date")
        return v


class SortParams(BaseModel):
    """Sorting parameters"""
    sort_by: str = Field("timestamp", description="Field to sort by")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")


class HealthStatus(BaseModel):
    """Health status model"""
    status: str = Field(..., description="Overall system status")
    timestamp: datetime = Field(..., description="Health check timestamp")
    version: str = Field(..., description="System version")
    services: Dict[str, str] = Field(..., description="Individual service statuses")
    uptime_seconds: Optional[float] = Field(None, description="System uptime in seconds")
    memory_usage_mb: Optional[float] = Field(None, description="Memory usage in MB")
    cpu_usage_percent: Optional[float] = Field(None, description="CPU usage percentage")


# Bulk Operation Models

class BulkOperationRequest(BaseModel):
    """Request model for bulk operations"""
    operation_type: str = Field(..., description="Type of bulk operation")
    equipment_ids: List[str] = Field(..., description="List of equipment IDs")
    operation_parameters: Optional[Dict[str, Any]] = Field(None, description="Operation-specific parameters")
    user_id: str = Field(..., description="User performing the operation")
    
    @field_validator('equipment_ids')
    @classmethod
    def validate_equipment_ids(cls, v):
        if len(v) == 0:
            raise ValueError("Equipment IDs list cannot be empty")
        if len(v) > 1000:
            raise ValueError("Maximum 1000 equipment IDs per bulk operation")
        return v


class BulkOperationResponse(BaseModel):
    """Response model for bulk operations"""
    success: bool = Field(..., description="Bulk operation success status")
    operation_id: str = Field(..., description="Unique operation identifier")
    total_items: int = Field(..., description="Total number of items processed")
    successful_items: int = Field(..., description="Number of successfully processed items")
    failed_items: int = Field(..., description="Number of failed items")
    results: List[Dict[str, Any]] = Field(..., description="Individual operation results")
    message: str = Field(..., description="Response message")
    processing_time_seconds: float = Field(..., description="Total processing time")
    started_at: datetime = Field(..., description="When operation started")
    completed_at: datetime = Field(..., description="When operation completed")


# WebSocket Models (for real-time updates)

class WebSocketMessage(BaseModel):
    """WebSocket message model"""
    message_type: str = Field(..., description="Type of WebSocket message")
    equipment_id: Optional[str] = Field(None, description="Related equipment ID")
    data: Dict[str, Any] = Field(..., description="Message data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Message timestamp")


class CalculationProgressUpdate(BaseModel):
    """Calculation progress update for WebSocket"""
    equipment_id: str = Field(..., description="Equipment being calculated")
    progress_percentage: float = Field(..., ge=0, le=100, description="Calculation progress")
    current_step: str = Field(..., description="Current calculation step")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")


# Export/Import Models

class ExportRequest(BaseModel):
    """Request model for data export"""
    export_type: str = Field(..., description="Type of data to export")
    format: str = Field("json", description="Export format")
    filters: Optional[FilterParams] = Field(None, description="Export filters")
    include_metadata: bool = Field(True, description="Include metadata in export")


class ImportRequest(BaseModel):
    """Request model for data import"""
    import_type: str = Field(..., description="Type of data to import")
    data: Union[Dict[str, Any], List[Dict[str, Any]]] = Field(..., description="Data to import")
    import_options: Optional[Dict[str, Any]] = Field(None, description="Import options")
    validate_only: bool = Field(False, description="Only validate without importing")
    user_id: str = Field(..., description="User performing the import")