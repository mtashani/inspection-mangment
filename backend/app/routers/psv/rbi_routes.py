from datetime import datetime
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ...database import get_session
from ...psv_models import PSV, Calibration, RBIConfiguration, ServiceRiskCategory
from .rbi_utils import (
    calculate_rbi_level_1,
    calculate_rbi_level_2,
    calculate_rbi_level_3,
    calculate_rbi_level_4,
    calculate_pof_score,
    map_risk_to_interval,
    get_risk_category
)

router = APIRouter(prefix="/rbi", tags=["PSV RBI"])

@router.get("/config", response_model=List[RBIConfiguration])
def get_rbi_configs(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_session)
):
    """Get RBI configurations"""
    query = select(RBIConfiguration)
    if active_only:
        query = query.filter(RBIConfiguration.active == True)
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/config", response_model=RBIConfiguration)
def create_rbi_config(
    config: RBIConfiguration,
    db: Session = Depends(get_session)
):
    """Create new RBI configuration"""
    db.add(config)
    try:
        db.commit()
        db.refresh(config)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return config

@router.post("/{tag_number}/calculate")
def calculate_rbi(
    tag_number: str,
    level: int = Query(..., ge=1, le=4),
    db: Session = Depends(get_session)
):
    """Calculate next calibration date using RBI methodology"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
    
    # Get active RBI configuration for the specified level
    config = db.exec(
        select(RBIConfiguration)
        .filter(RBIConfiguration.level == level)
        .filter(RBIConfiguration.active == True)
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail=f"No active RBI configuration found for level {level}"
        )
    
    # Get calibration history sorted by date (newest first)
    calibrations = db.exec(
        select(Calibration)
        .filter(Calibration.tag_number == tag_number)
        .order_by(Calibration.calibration_date.desc())
    ).all()
    
    # Get service risk category if exists
    service_risk = db.exec(
        select(ServiceRiskCategory)
        .filter(ServiceRiskCategory.service_type == psv.service)
    ).first()
    
    try:
        # Calculate based on RBI level
        if level == 1:
            interval, next_date = calculate_rbi_level_1(psv, config)
            return {
                "tag_number": tag_number,
                "rbi_level": level,
                "current_risk_score": 1.0,  # Fixed for level 1
                "recommended_interval": interval,
                "next_calibration_date": next_date.isoformat()
            }
        
        elif level == 2:
            risk_score, interval, next_date, reason = calculate_rbi_level_2(psv, calibrations, config)
            return {
                "tag_number": tag_number,
                "rbi_level": level,
                "current_risk_score": risk_score,
                "recommended_interval": interval,
                "next_calibration_date": next_date.isoformat(),
                "pof_score": risk_score,
                "assessment_reason": reason,
                "test_statistics": calculate_test_statistics(calibrations)
            }
        
        elif level == 3:
            if not calibrations:
                # Fallback to level 2 if no calibration history
                return calculate_rbi(tag_number, 2, db)
            
            risk_score, pof_score, interval, next_date = calculate_rbi_level_3(
                psv, calibrations, config
            )
            
            return {
                "tag_number": tag_number,
                "rbi_level": level,
                "current_risk_score": risk_score,
                "pof_score": pof_score,
                "recommended_interval": interval,
                "next_calibration_date": next_date.isoformat()
            }
        
        elif level == 4:
            if not calibrations or not service_risk:
                # Fallback to level 3 if missing required data
                return calculate_rbi(tag_number, 3, db)
            
            risk_score, pof_score, cof_score, risk_category, interval, next_date = calculate_rbi_level_4(
                psv, calibrations, service_risk, config
            )
            
            return {
                "tag_number": tag_number,
                "rbi_level": level,
                "current_risk_score": risk_score,
                "pof_score": pof_score,
                "cof_score": cof_score,
                "risk_category": risk_category,
                "recommended_interval": interval,
                "next_calibration_date": next_date.isoformat()
            }
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid RBI level: {level}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating RBI level {level}: {str(e)}"
        )

@router.get("/trends/{tag_number}", response_model=Dict)
def analyze_rbi_trends(
    tag_number: str,
    months: int = Query(12, ge=1, le=60),  # Analyze up to 5 years of data
    db: Session = Depends(get_session)
):
    """Analyze RBI trends and performance over time for a specific PSV"""
    try:
        # Get PSV and its calibration history
        psv = db.get(PSV, tag_number)
        if not psv:
            raise HTTPException(status_code=404, detail="PSV not found")

        # Get calibrations within date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=months * 30)
        calibrations = db.exec(
            select(Calibration)
            .filter(
                Calibration.tag_number == tag_number,
                Calibration.calibration_date.between(start_date, end_date)
            )
            .order_by(Calibration.calibration_date.desc())
        ).all()

        # Get active RBI configurations
        active_configs = {
            config.level: config for config in db.exec(
                select(RBIConfiguration)
                .filter(RBIConfiguration.active == True)
            ).all()
        }

        # Calculate metrics for each calibration
        trend_data = []
        cumulative_metrics = {
            "total_repairs": 0,
            "total_repair_time": 0,
            "risk_scores": [],
            "intervals": []
        }

        for cal in calibrations:
            # Calculate risk scores using different RBI levels
            level_scores = {}
            maintenance_data = analyze_maintenance_patterns([cal])
            test_stats = calculate_test_statistics([cal])

            # Level 2 analysis
            if 2 in active_configs:
                risk_score, _, _, reason = calculate_rbi_level_2(
                    psv, [cal], active_configs[2]
                )
                level_scores["level2"] = {
                    "risk_score": risk_score,
                    "reason": reason
                }

            # Add calibration data point
            trend_data.append({
                "date": cal.calibration_date.isoformat(),
                "risk_scores": level_scores,
                "test_results": {
                    "pop_test": cal.post_repair_pop_test,
                    "leak_test": cal.leak_test_result
                },
                "maintenance": {
                    "repairs": cal.repairs_performed,
                    "repair_time": cal.repair_time or 0,
                    "condition_scores": {
                        "body": cal.body_condition_score,
                        "internal": cal.internal_parts_score,
                        "seat": cal.seat_plug_condition_score
                    }
                }
            })

            # Update cumulative metrics
            if cal.repair_time:
                cumulative_metrics["total_repair_time"] += cal.repair_time
            if cal.repairs_performed:
                cumulative_metrics["total_repairs"] += 1
            
            # Store risk scores and intervals for trend analysis
            if level_scores.get("level2"):
                cumulative_metrics["risk_scores"].append(level_scores["level2"]["risk_score"])

        # Calculate overall trends and patterns
        return {
            "tag_number": tag_number,
            "analysis_period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "total_calibrations": len(calibrations)
            },
            "trend_data": trend_data,
            "performance_metrics": {
                "average_repair_time": (
                    cumulative_metrics["total_repair_time"] / cumulative_metrics["total_repairs"]
                    if cumulative_metrics["total_repairs"] > 0 else 0
                ),
                "repair_frequency": cumulative_metrics["total_repairs"] / len(calibrations) if calibrations else 0,
                "risk_score_trend": calculate_trend(cumulative_metrics["risk_scores"]) if cumulative_metrics["risk_scores"] else 0
            },
            "recommendations": generate_recommendations(trend_data) if trend_data else []
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing RBI trends: {str(e)}"
        )

def calculate_trend(values: List[float]) -> float:
    """Calculate trend using simple linear regression"""
    if len(values) < 2:
        return 0
    x = list(range(len(values)))
    x_mean = sum(x) / len(x)
    y_mean = sum(values) / len(values)
    numerator = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, values))
    denominator = sum((xi - x_mean) ** 2 for xi in x)
    return numerator / denominator if denominator != 0 else 0

def generate_recommendations(trend_data: List[Dict]) -> List[str]:
    """Generate recommendations based on trend analysis"""
    recommendations = []
    
    # Analyze risk score trends
    risk_scores = [
        d["risk_scores"].get("level2", {}).get("risk_score", 0)
        for d in trend_data
        if "level2" in d["risk_scores"]
    ]
    
    if risk_scores:
        trend = calculate_trend(risk_scores)
        if trend > 0.1:
            recommendations.append(
                "Risk scores show increasing trend. Consider increasing inspection frequency."
            )
    
    # Analyze test results
    pop_tests = [
        d["test_results"]["pop_test"]
        for d in trend_data
        if d["test_results"]["pop_test"] is not None
    ]
    
    leak_tests = [
        d["test_results"]["leak_test"]
        for d in trend_data
        if d["test_results"]["leak_test"] is not None
    ]
    
    if pop_tests and abs(sum(pop_tests) / len(pop_tests)) > 2:
        recommendations.append(
            "Pop test results show consistent deviation. Consider recalibration or adjustment."
        )
    
    if leak_tests and any(lt > 5 for lt in leak_tests):
        recommendations.append(
            "High leak test results detected. Verify seat tightness and sealing surfaces."
        )
    
    # Analyze maintenance patterns
    repair_times = [
        d["maintenance"]["repair_time"]
        for d in trend_data
        if d["maintenance"]["repair_time"] > 0
    ]
    
    if repair_times and (sum(repair_times) / len(repair_times)) > 4:
        recommendations.append(
            "Average repair time is high. Review maintenance procedures for efficiency."
        )
    
    return recommendations