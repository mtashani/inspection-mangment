from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select
from sqlalchemy.sql import func
from sqlalchemy import and_, desc
from statistics import mean, stdev
from ...database import get_session
from ...psv_models import PSV, Calibration, RBIConfiguration, ServiceRiskCategory
from .rbi_utils import calculate_rbi_level_4, get_risk_category

router = APIRouter(prefix="/analytics", tags=["PSV Analytics"])

def calculate_test_statistics(calibrations: List[Calibration]) -> Dict:
    """Calculate detailed test statistics from calibration history"""
    if not calibrations:
        return {
            "pop_test": {"avg": 0, "std": 0, "trend": 0},
            "leak_test": {"avg": 0, "std": 0, "trend": 0}
        }
    
    pop_tests = [c.post_repair_pop_test for c in calibrations if c.post_repair_pop_test is not None]
    leak_tests = [c.leak_test_result for c in calibrations if c.leak_test_result is not None]
    
    # Calculate trends using linear regression
    def calculate_trend(values: List[float]) -> float:
        if len(values) < 2:
            return 0
        x = list(range(len(values)))
        x_mean = mean(x)
        y_mean = mean(values)
        numerator = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, values))
        denominator = sum((xi - x_mean) ** 2 for xi in x)
        return numerator / denominator if denominator != 0 else 0

    return {
        "pop_test": {
            "avg": round(mean(pop_tests), 2) if pop_tests else 0,
            "std": round(stdev(pop_tests), 2) if len(pop_tests) > 1 else 0,
            "trend": round(calculate_trend(pop_tests), 4)
        },
        "leak_test": {
            "avg": round(mean(leak_tests), 2) if leak_tests else 0,
            "std": round(stdev(leak_tests), 2) if len(leak_tests) > 1 else 0,
            "trend": round(calculate_trend(leak_tests), 4)
        }
    }

def analyze_maintenance_patterns(calibrations: List[Calibration]) -> Dict:
    """Analyze maintenance patterns and identify common issues"""
    if not calibrations:
        return {"common_issues": [], "repair_frequency": {}, "avg_repair_time": 0}
    
    issues = {}
    repair_count = 0
    total_repair_time = 0
    
    for cal in calibrations:
        if cal.repairs_performed:
            repairs = cal.repairs_performed.split(",")
            for repair in repairs:
                repair = repair.strip()
                issues[repair] = issues.get(repair, 0) + 1
            repair_count += 1
        
        if cal.repair_time:
            total_repair_time += cal.repair_time
    
    return {
        "common_issues": sorted(
            [{"issue": k, "count": v} for k, v in issues.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:5],
        "repair_frequency": round(repair_count / len(calibrations), 2),
        "avg_repair_time": round(total_repair_time / repair_count if repair_count > 0 else 0, 1)
    }

def calculate_rbi_distribution(
    psv: PSV,
    calibrations: List[Calibration],
    service_risk: Optional[ServiceRiskCategory],
    active_configs: Dict[int, RBIConfiguration]
) -> Dict[str, int]:
    """Calculate RBI distribution for a PSV based on active configurations"""
    # Default to level 1 if no risk factors present
    if not calibrations:
        return {"level1": 1, "level2": 0, "level3": 0, "level4": 0}
    
    latest_cal = calibrations[0]
    has_condition_scores = (
        latest_cal.body_condition_score is not None
        and latest_cal.internal_parts_score is not None
        and latest_cal.seat_plug_condition_score is not None
    )
    
    # If service risk category exists and has condition scores, use level 4
    if service_risk and has_condition_scores and 4 in active_configs:
        try:
            _, _, _, risk_category, _, _ = calculate_rbi_level_4(
                psv, calibrations, service_risk, active_configs[4]
            )
            return {"level1": 0, "level2": 0, "level3": 0, "level4": 1}
        except:
            pass  # Fallback to level 3 if calculation fails
    
    # If has condition scores, use level 3
    if has_condition_scores and 3 in active_configs:
        return {"level1": 0, "level2": 0, "level3": 1, "level4": 0}
    
    # If has calibration data but no condition scores, use level 2
    if latest_cal.post_repair_pop_test is not None and 2 in active_configs:
        return {"level1": 0, "level2": 1, "level3": 0, "level4": 0}
    
    # Default to level 1
    return {"level1": 1, "level2": 0, "level3": 0, "level4": 0}

@router.get("/", response_model=List[Dict])
def get_psv_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_session)
):
    """Get comprehensive PSV analytics including performance metrics, risk trends, and maintenance insights"""
    # Set default date range if not provided
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=365)  # Default to last year
    if not end_date:
        end_date = datetime.utcnow()

    try:
        # Get active RBI configurations
        active_configs = {
            config.level: config for config in db.exec(
                select(RBIConfiguration)
                .filter(RBIConfiguration.active == True)
            ).all()
        }

        # Get all PSVs and their calibrations
        all_psvs = db.exec(select(PSV)).all()
        psv_calibrations = {}
        psv_service_risks = {}

        # Get all service risk categories
        service_risks = {
            sr.service_type: sr for sr in db.exec(select(ServiceRiskCategory)).all()
        }

        # Pre-fetch calibrations for each PSV
        for psv in all_psvs:
            psv_calibrations[psv.tag_number] = db.exec(
                select(Calibration)
                .filter(Calibration.tag_number == psv.tag_number)
                .order_by(Calibration.calibration_date.desc())
            ).all()
            psv_service_risks[psv.tag_number] = service_risks.get(psv.service)

        # Get calibrations within date range
        calibrations = db.exec(
            select(Calibration)
            .filter(Calibration.calibration_date.between(start_date, end_date))
            .order_by(Calibration.calibration_date)
        ).all()

        # Get PSVs that expire in the date range
        psvs_due = db.exec(
            select(PSV)
            .filter(PSV.expire_date.between(start_date, end_date))
        ).all()

        # Initialize monthly data
        monthly_data = {}
        current = start_date.replace(day=1)  # Start from beginning of month
        while current <= end_date:
            month_key = current.strftime("%Y-%m")
            month_end = (current.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)

            # Filter calibrations and due PSVs for this month
            month_cals = [c for c in calibrations if c.calibration_date.strftime("%Y-%m") == month_key]
            month_due = [p for p in psvs_due if p.expire_date.strftime("%Y-%m") == month_key]

            # Get never calibrated count for this month
            never_cal_count = db.exec(
                select(func.count())
                .select_from(PSV)
                .filter(PSV.last_calibration_date.is_(None))
            ).first()

            # Calculate RBI distribution for this month
            rbi_dist = {"level1": 0, "level2": 0, "level3": 0, "level4": 0}
            total_risk_score = 0
            risk_score_count = 0

            for psv in all_psvs:
                # Get PSV's RBI distribution
                psv_dist = calculate_rbi_distribution(
                    psv,
                    psv_calibrations[psv.tag_number],
                    psv_service_risks[psv.tag_number],
                    active_configs
                )
                
                # Add to monthly distribution
                for level, count in psv_dist.items():
                    rbi_dist[level] += count

                # Calculate risk score if has level 4 config and service risk
                if 4 in active_configs and psv_service_risks[psv.tag_number]:
                    try:
                        risk_score, *_ = calculate_rbi_level_4(
                            psv,
                            psv_calibrations[psv.tag_number],
                            psv_service_risks[psv.tag_number],
                            active_configs[4]
                        )
                        total_risk_score += risk_score
                        risk_score_count += 1
                    except:
                        pass

            avg_risk_score = round(total_risk_score / risk_score_count, 2) if risk_score_count > 0 else 0

            # Calculate test statistics for this month's calibrations
            test_stats = calculate_test_statistics(month_cals)
            maintenance_stats = analyze_maintenance_patterns(month_cals)
            
            # Calculate failure prediction scores
            failure_risk_psvs = []
            for psv in all_psvs:
                psv_cals = psv_calibrations[psv.tag_number]
                if psv_cals:
                    stats = calculate_test_statistics(psv_cals)
                    # High risk if negative trend or high deviation
                    if (stats["pop_test"]["trend"] < -0.1 or
                        stats["pop_test"]["std"] > 2.0 or
                        stats["leak_test"]["trend"] < -0.1 or
                        stats["leak_test"]["std"] > 2.0):
                        failure_risk_psvs.append(psv.tag_number)

            monthly_data[month_key] = {
                "month": month_key,
                "totalDue": len(month_due),
                "calibrated": len(month_cals),
                "remaining": len(month_due) - len(month_cals),
                "neverCalibrated": never_cal_count or 0,
                "rbiDistribution": rbi_dist,
                "avgRiskScore": avg_risk_score,
                "testStatistics": test_stats,
                "maintenancePatterns": maintenance_stats,
                "predictiveMetrics": {
                    "failureRiskCount": len(failure_risk_psvs),
                    "failureRiskPSVs": failure_risk_psvs[:5],  # Top 5 at-risk PSVs
                    "complianceRate": round((len(month_cals) / len(month_due) * 100), 1) if len(month_due) > 0 else 100,
                    "averageRepairTime": maintenance_stats["avg_repair_time"],
                    "maintenanceEfficiency": round((1 - maintenance_stats["repair_frequency"]) * 100, 1)
                }
            }

            current = month_end + timedelta(days=1)

        return list(monthly_data.values())

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating PSV analytics: {str(e)}"
        )

@router.get("/performance/{tag_number}", response_model=Dict)
def get_psv_performance(
    tag_number: str,
    db: Session = Depends(get_session)
):
    """Get detailed performance analytics for a specific PSV"""
    try:
        # Get PSV and its calibrations
        psv = db.get(PSV, tag_number)
        if not psv:
            raise HTTPException(status_code=404, detail="PSV not found")
        
        calibrations = db.exec(
            select(Calibration)
            .filter(Calibration.tag_number == tag_number)
            .order_by(Calibration.calibration_date.desc())
        ).all()
        
        # Get service risk category
        service_risk = db.exec(
            select(ServiceRiskCategory)
            .filter(ServiceRiskCategory.service_type == psv.service)
        ).first()
        
        # Calculate statistics
        test_stats = calculate_test_statistics(calibrations)
        maintenance_stats = analyze_maintenance_patterns(calibrations)
        
        # Calculate time-based metrics
        days_since_last_cal = 0
        if psv.last_calibration_date:
            days_since_last_cal = (datetime.utcnow() - psv.last_calibration_date).days
        
        # Calculate calibration performance score (0-100)
        performance_score = 100
        if test_stats["pop_test"]["std"] > 0:
            performance_score -= min(30, test_stats["pop_test"]["std"] * 10)
        if test_stats["pop_test"]["trend"] < 0:
            performance_score -= min(20, abs(test_stats["pop_test"]["trend"]) * 20)
        if maintenance_stats["repair_frequency"] > 0:
            performance_score -= min(30, maintenance_stats["repair_frequency"] * 30)
        
        return {
            "tagNumber": tag_number,
            "testStatistics": test_stats,
            "maintenancePatterns": maintenance_stats,
            "timeMetrics": {
                "daysSinceLastCalibration": days_since_last_cal,
                "daysUntilDue": (psv.expire_date - datetime.utcnow()).days if psv.expire_date else 0,
                "calibrationHistory": len(calibrations)
            },
            "riskMetrics": {
                "serviceType": psv.service,
                "serviceRiskScore": service_risk.cof_score if service_risk else None,
                "performanceScore": round(max(0, min(100, performance_score)), 1),
                "failurePredictionScore": round(
                    (abs(test_stats["pop_test"]["trend"]) +
                     test_stats["pop_test"]["std"] / 2 +
                     abs(test_stats["leak_test"]["trend"]) +
                     test_stats["leak_test"]["std"] / 2) / 4,
                    2
                ) if calibrations else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating PSV performance: {str(e)}"
        )