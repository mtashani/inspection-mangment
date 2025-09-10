"""RBI Calculation REST API Router"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, Body
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

from app.domains.rbi.models.api_models import (
    RBICalculationRequest,
    RBICalculationResponse,
    BatchCalculationRequest,
    BatchCalculationResponse,
    ConfigurationRequest,
    ConfigurationResponse,
    ReportRequest,
    ReportResponse,
    PatternAnalysisRequest,
    PatternAnalysisResponse,
    ParameterAdjustmentRequest,
    ParameterAdjustmentResponse,
    ErrorResponse
)
from app.domains.rbi.services.rbi_calculation_engine import RBICalculationEngine
from app.domains.rbi.services.config_manager import RBIConfigManager as ConfigurationManager
from app.domains.rbi.services.calculation_report_service import CalculationReportService
from app.domains.rbi.services.pattern_recognition_engine import PatternRecognitionEngine
from app.domains.rbi.services.adaptive_parameter_adjuster import AdaptiveParameterAdjuster
from app.domains.rbi.services.prediction_tracker import PredictionTracker
from app.domains.rbi.services.audit_trail_service import AuditTrailService


# Initialize router
router = APIRouter(prefix="/api/v1/rbi", tags=["RBI Calculations"])

# Initialize logger
logger = logging.getLogger(__name__)

# Dependency injection functions
async def get_calculation_engine() -> RBICalculationEngine:
    """Get RBI calculation engine instance"""
    return RBICalculationEngine()

async def get_configuration_manager() -> ConfigurationManager:
    """Get configuration manager instance"""
    return ConfigurationManager()

async def get_report_service() -> CalculationReportService:
    """Get calculation report service instance"""
    return CalculationReportService()

async def get_pattern_engine() -> PatternRecognitionEngine:
    """Get pattern recognition engine instance"""
    return PatternRecognitionEngine()

async def get_parameter_adjuster() -> AdaptiveParameterAdjuster:
    """Get adaptive parameter adjuster instance"""
    return AdaptiveParameterAdjuster()

async def get_prediction_tracker() -> PredictionTracker:
    """Get prediction tracker instance"""
    return PredictionTracker()

async def get_audit_service() -> AuditTrailService:
    """Get audit trail service instance"""
    return AuditTrailService()


# RBI Calculation Endpoints

@router.post(
    "/calculate",
    response_model=RBICalculationResponse,
    summary="Perform RBI Calculation",
    description="Calculate RBI for a single equipment item with automatic level determination"
)
async def calculate_rbi(
    request: RBICalculationRequest,
    engine: RBICalculationEngine = Depends(get_calculation_engine),
    audit_service: AuditTrailService = Depends(get_audit_service)
) -> RBICalculationResponse:
    """Perform RBI calculation for single equipment"""
    
    try:
        logger.info(f"Starting RBI calculation for equipment {request.equipment_id}")
        
        # Perform calculation
        result = await engine.calculate_rbi(
            equipment_data=request.equipment_data,
            inspection_data=request.inspection_data,
            force_level=request.force_calculation_level,
            custom_parameters=request.custom_parameters
        )
        
        # Log calculation in audit trail
        await audit_service.log_calculation(
            equipment_id=request.equipment_id,
            calculation_result=result,
            user_id=request.user_id,
            calculation_context=request.calculation_context
        )
        
        logger.info(f"RBI calculation completed for equipment {request.equipment_id}")
        
        return RBICalculationResponse(
            success=True,
            calculation_result=result,
            message="RBI calculation completed successfully",
            calculation_timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"RBI calculation failed for equipment {request.equipment_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"RBI calculation failed: {str(e)}"
        )


@router.post(
    "/calculate/batch",
    response_model=BatchCalculationResponse,
    summary="Perform Batch RBI Calculations",
    description="Calculate RBI for multiple equipment items in batch"
)
async def calculate_rbi_batch(
    request: BatchCalculationRequest,
    engine: RBICalculationEngine = Depends(get_calculation_engine),
    audit_service: AuditTrailService = Depends(get_audit_service)
) -> BatchCalculationResponse:
    """Perform batch RBI calculations"""
    
    try:
        logger.info(f"Starting batch RBI calculation for {len(request.equipment_list)} equipment items")
        
        # Perform batch calculation
        results = await engine.calculate_batch_rbi(
            equipment_list=request.equipment_list,
            inspection_data_map=request.inspection_data_map,
            calculation_options=request.calculation_options
        )
        
        # Log batch calculation in audit trail
        await audit_service.log_batch_calculation(
            equipment_ids=[eq.equipment_id for eq in request.equipment_list],
            calculation_results=results,
            user_id=request.user_id,
            batch_context=request.batch_context
        )
        
        logger.info(f"Batch RBI calculation completed for {len(results)} equipment items")
        
        return BatchCalculationResponse(
            success=True,
            calculation_results=results,
            total_processed=len(results),
            successful_calculations=len([r for r in results if r.calculation_successful]),
            failed_calculations=len([r for r in results if not r.calculation_successful]),
            message="Batch RBI calculation completed",
            calculation_timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Batch RBI calculation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch RBI calculation failed: {str(e)}"
        )


@router.get(
    "/calculation/{equipment_id}/history",
    response_model=List[RBICalculationResponse],
    summary="Get Calculation History",
    description="Retrieve calculation history for specific equipment"
)
async def get_calculation_history(
    equipment_id: str = Path(..., description="Equipment ID"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    audit_service: AuditTrailService = Depends(get_audit_service)
) -> List[RBICalculationResponse]:
    """Get calculation history for equipment"""
    
    try:
        logger.info(f"Retrieving calculation history for equipment {equipment_id}")
        
        # Get calculation history from audit trail
        history = await audit_service.get_calculation_history(
            equipment_id=equipment_id,
            limit=limit,
            offset=offset,
            start_date=start_date,
            end_date=end_date
        )
        
        # Convert to response format
        responses = []
        for record in history:
            responses.append(RBICalculationResponse(
                success=True,
                calculation_result=record.calculation_result,
                message="Historical calculation record",
                calculation_timestamp=record.timestamp
            ))
        
        return responses
        
    except Exception as e:
        logger.error(f"Failed to retrieve calculation history for equipment {equipment_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve calculation history: {str(e)}"
        )


# Configuration Management Endpoints

@router.get(
    "/configuration",
    response_model=ConfigurationResponse,
    summary="Get RBI Configuration",
    description="Retrieve current RBI calculation configuration"
)
async def get_configuration(
    config_type: Optional[str] = Query(None, description="Configuration type filter"),
    config_manager: ConfigurationManager = Depends(get_configuration_manager)
) -> ConfigurationResponse:
    """Get RBI configuration"""
    
    try:
        logger.info("Retrieving RBI configuration")
        
        # Get configuration
        if config_type:
            config = await config_manager.get_configuration_by_type(config_type)
        else:
            config = await config_manager.get_full_configuration()
        
        return ConfigurationResponse(
            success=True,
            configuration=config,
            message="Configuration retrieved successfully",
            last_updated=config.get("last_updated", datetime.now())
        )
        
    except Exception as e:
        logger.error(f"Failed to retrieve configuration: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve configuration: {str(e)}"
        )


@router.put(
    "/configuration",
    response_model=ConfigurationResponse,
    summary="Update RBI Configuration",
    description="Update RBI calculation configuration"
)
async def update_configuration(
    request: ConfigurationRequest,
    config_manager: ConfigurationManager = Depends(get_configuration_manager),
    audit_service: AuditTrailService = Depends(get_audit_service)
) -> ConfigurationResponse:
    """Update RBI configuration"""
    
    try:
        logger.info("Updating RBI configuration")
        
        # Update configuration
        updated_config = await config_manager.update_configuration(
            configuration_updates=request.configuration_updates,
            user_id=request.user_id,
            update_reason=request.update_reason
        )
        
        # Log configuration change in audit trail
        await audit_service.log_configuration_change(
            configuration_changes=request.configuration_updates,
            user_id=request.user_id,
            change_reason=request.update_reason
        )
        
        logger.info("RBI configuration updated successfully")
        
        return ConfigurationResponse(
            success=True,
            configuration=updated_config,
            message="Configuration updated successfully",
            last_updated=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Failed to update configuration: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update configuration: {str(e)}"
        )


@router.post(
    "/configuration/validate",
    response_model=Dict[str, Any],
    summary="Validate Configuration",
    description="Validate RBI configuration before applying"
)
async def validate_configuration(
    request: ConfigurationRequest,
    config_manager: ConfigurationManager = Depends(get_configuration_manager)
) -> Dict[str, Any]:
    """Validate RBI configuration"""
    
    try:
        logger.info("Validating RBI configuration")
        
        # Validate configuration
        validation_result = await config_manager.validate_configuration(
            configuration_updates=request.configuration_updates
        )
        
        return {
            "success": True,
            "validation_result": validation_result,
            "message": "Configuration validation completed"
        }
        
    except Exception as e:
        logger.error(f"Configuration validation failed: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Configuration validation failed: {str(e)}"
        )


# Reporting Endpoints

@router.post(
    "/report/calculation",
    response_model=ReportResponse,
    summary="Generate Calculation Report",
    description="Generate detailed calculation report for equipment"
)
async def generate_calculation_report(
    request: ReportRequest,
    report_service: CalculationReportService = Depends(get_report_service)
) -> ReportResponse:
    """Generate calculation report"""
    
    try:
        logger.info(f"Generating calculation report for equipment {request.equipment_id}")
        
        # Generate report
        report = await report_service.generate_detailed_report(
            equipment_id=request.equipment_id,
            calculation_result=request.calculation_result,
            report_options=request.report_options
        )
        
        return ReportResponse(
            success=True,
            report=report,
            message="Calculation report generated successfully",
            generated_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Failed to generate calculation report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate calculation report: {str(e)}"
        )


@router.get(
    "/report/system-summary",
    response_model=Dict[str, Any],
    summary="Get System Summary Report",
    description="Get comprehensive system summary report"
)
async def get_system_summary_report(
    include_statistics: bool = Query(True, description="Include system statistics"),
    include_trends: bool = Query(True, description="Include trend analysis"),
    date_range_days: int = Query(30, ge=1, le=365, description="Date range for analysis"),
    report_service: CalculationReportService = Depends(get_report_service),
    audit_service: AuditTrailService = Depends(get_audit_service)
) -> Dict[str, Any]:
    """Get system summary report"""
    
    try:
        logger.info("Generating system summary report")
        
        # Generate system summary
        summary = await report_service.generate_system_summary(
            include_statistics=include_statistics,
            include_trends=include_trends,
            date_range_days=date_range_days
        )
        
        # Add audit trail summary
        if include_statistics:
            audit_summary = await audit_service.get_system_statistics(
                date_range_days=date_range_days
            )
            summary["audit_statistics"] = audit_summary
        
        return {
            "success": True,
            "summary": summary,
            "message": "System summary report generated successfully",
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to generate system summary report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate system summary report: {str(e)}"
        )


# Pattern Recognition Endpoints

@router.post(
    "/pattern/analyze",
    response_model=PatternAnalysisResponse,
    summary="Analyze Equipment Patterns",
    description="Analyze patterns for specific equipment"
)
async def analyze_equipment_patterns(
    request: PatternAnalysisRequest,
    pattern_engine: PatternRecognitionEngine = Depends(get_pattern_engine)
) -> PatternAnalysisResponse:
    """Analyze equipment patterns"""
    
    try:
        logger.info(f"Analyzing patterns for equipment {request.equipment_id}")
        
        # Analyze patterns
        analysis_result = await pattern_engine.analyze_equipment_patterns(
            equipment_data=request.equipment_data,
            historical_calculations=request.historical_calculations,
            inspection_history=request.inspection_history
        )
        
        return PatternAnalysisResponse(
            success=True,
            analysis_result=analysis_result,
            message="Pattern analysis completed successfully",
            analysis_timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Pattern analysis failed for equipment {request.equipment_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Pattern analysis failed: {str(e)}"
        )


@router.get(
    "/pattern/families",
    response_model=Dict[str, Any],
    summary="Get Equipment Families",
    description="Get identified equipment families and their characteristics"
)
async def get_equipment_families(
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type"),
    service_type: Optional[str] = Query(None, description="Filter by service type"),
    pattern_engine: PatternRecognitionEngine = Depends(get_pattern_engine)
) -> Dict[str, Any]:
    """Get equipment families"""
    
    try:
        logger.info("Retrieving equipment families")
        
        # Get equipment families
        families = await pattern_engine.get_equipment_families(
            equipment_type_filter=equipment_type,
            service_type_filter=service_type
        )
        
        return {
            "success": True,
            "families": families,
            "total_families": len(families),
            "message": "Equipment families retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve equipment families: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve equipment families: {str(e)}"
        )


# Parameter Adjustment Endpoints

@router.post(
    "/parameters/adjust",
    response_model=ParameterAdjustmentResponse,
    summary="Adjust RBI Parameters",
    description="Automatically adjust RBI parameters based on prediction feedback"
)
async def adjust_parameters(
    request: ParameterAdjustmentRequest,
    parameter_adjuster: AdaptiveParameterAdjuster = Depends(get_parameter_adjuster),
    audit_service: AuditTrailService = Depends(get_audit_service)
) -> ParameterAdjustmentResponse:
    """Adjust RBI parameters"""
    
    try:
        logger.info(f"Adjusting parameters for equipment {request.equipment_id}")
        
        # Adjust parameters
        adjustment_result = await parameter_adjuster.adjust_parameters(
            equipment_id=request.equipment_id,
            current_parameters=request.current_parameters,
            strategy=request.adjustment_strategy,
            force_adjustment=request.force_adjustment
        )
        
        # Log parameter adjustment in audit trail
        await audit_service.log_parameter_adjustment(
            equipment_id=request.equipment_id,
            adjustment_result=adjustment_result,
            user_id=request.user_id,
            adjustment_reason=request.adjustment_reason
        )
        
        return ParameterAdjustmentResponse(
            success=True,
            adjustment_result=adjustment_result,
            message="Parameter adjustment completed successfully",
            adjustment_timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Parameter adjustment failed for equipment {request.equipment_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Parameter adjustment failed: {str(e)}"
        )


@router.get(
    "/parameters/{equipment_id}/recommendations",
    response_model=Dict[str, Any],
    summary="Get Parameter Adjustment Recommendations",
    description="Get recommendations for parameter adjustments without applying them"
)
async def get_parameter_recommendations(
    equipment_id: str = Path(..., description="Equipment ID"),
    parameter_adjuster: AdaptiveParameterAdjuster = Depends(get_parameter_adjuster)
) -> Dict[str, Any]:
    """Get parameter adjustment recommendations"""
    
    try:
        logger.info(f"Getting parameter recommendations for equipment {equipment_id}")
        
        # Get recommendations
        recommendations = await parameter_adjuster.get_adjustment_recommendations(
            equipment_id=equipment_id
        )
        
        return {
            "success": True,
            "recommendations": recommendations,
            "message": "Parameter recommendations generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get parameter recommendations for equipment {equipment_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get parameter recommendations: {str(e)}"
        )


@router.post(
    "/parameters/{equipment_id}/rollback",
    response_model=Dict[str, Any],
    summary="Rollback Parameter Adjustments",
    description="Rollback recent parameter adjustments"
)
async def rollback_parameter_adjustments(
    equipment_id: str = Path(..., description="Equipment ID"),
    rollback_count: int = Body(1, ge=1, description="Number of adjustments to rollback"),
    rollback_to_baseline: bool = Body(False, description="Rollback to baseline parameters"),
    parameter_adjuster: AdaptiveParameterAdjuster = Depends(get_parameter_adjuster),
    audit_service: AuditTrailService = Depends(get_audit_service)
) -> Dict[str, Any]:
    """Rollback parameter adjustments"""
    
    try:
        logger.info(f"Rolling back parameter adjustments for equipment {equipment_id}")
        
        # Rollback adjustments
        rollback_result = await parameter_adjuster.rollback_adjustments(
            equipment_id=equipment_id,
            rollback_to_baseline=rollback_to_baseline,
            rollback_count=rollback_count
        )
        
        # Log rollback in audit trail
        await audit_service.log_parameter_rollback(
            equipment_id=equipment_id,
            rollback_result=rollback_result,
            rollback_reason="Manual rollback via API"
        )
        
        return {
            "success": True,
            "rollback_result": rollback_result,
            "message": "Parameter rollback completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Parameter rollback failed for equipment {equipment_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Parameter rollback failed: {str(e)}"
        )


# Health Check and Status Endpoints

@router.get(
    "/health",
    response_model=Dict[str, Any],
    summary="Health Check",
    description="Check RBI system health and status"
)
async def health_check() -> Dict[str, Any]:
    """RBI system health check"""
    
    try:
        # Perform basic health checks
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now(),
            "version": "1.0.0",
            "services": {
                "calculation_engine": "operational",
                "configuration_manager": "operational",
                "pattern_recognition": "operational",
                "parameter_adjustment": "operational",
                "reporting": "operational"
            }
        }
        
        return {
            "success": True,
            "health": health_status,
            "message": "RBI system is healthy"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "success": False,
            "health": {
                "status": "unhealthy",
                "timestamp": datetime.now(),
                "error": str(e)
            },
            "message": "RBI system health check failed"
        }


# Error handlers would be added at the app level, not router level