from datetime import datetime, timedelta
from typing import Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.sql import func
from ...database import get_session
from ...psv_models import PSV, PSVStatus, Calibration, ServiceRiskCategory, RBIConfiguration
from .rbi_utils import calculate_rbi_distribution

router = APIRouter(prefix="/summary", tags=["PSV Summary"])

@router.get("/", response_model=Dict)
def get_psv_summary(db: Session = Depends(get_session)):
    """Get PSV summary statistics including calibration status and RBI levels"""
    try:
        # Get current timestamp for calculations
        now = datetime.utcnow()
        one_month_from_now = now + timedelta(days=30)

        # Get active RBI configurations
        active_configs = {
            config.level: config for config in db.exec(
                select(RBIConfiguration)
                .filter(RBIConfiguration.active == True)
            ).all()
        }

        # Get all service risk categories
        service_risks = {
            sr.service_type: sr for sr in db.exec(select(ServiceRiskCategory)).all()
        }

        # Base queries for summary stats
        main_count = select(PSV).filter(PSV.status == PSVStatus.Main)
        spare_count = select(PSV).filter(PSV.status == PSVStatus.Spare)

        # Out of calibration queries
        main_out_of_cal = main_count.filter(PSV.expire_date < now)
        spare_out_of_cal = spare_count.filter(PSV.expire_date < now)

        # Due next month queries
        main_due_next = main_count.filter(
            PSV.expire_date > now,
            PSV.expire_date <= one_month_from_now
        )
        spare_due_next = spare_count.filter(
            PSV.expire_date > now,
            PSV.expire_date <= one_month_from_now
        )

        # Never calibrated queries
        main_never_cal = main_count.filter(PSV.last_calibration_date.is_(None))
        spare_never_cal = spare_count.filter(PSV.last_calibration_date.is_(None))
        
        # Under calibration queries (PSVs with valid calibration)
        main_under_cal = main_count.filter(PSV.expire_date > now)
        spare_under_cal = spare_count.filter(PSV.expire_date > now)

        # Get all PSVs and their calibrations for RBI calculation
        all_psvs = db.exec(select(PSV)).all()
        psv_calibrations = {}

        # Pre-fetch calibrations for each PSV
        for psv in all_psvs:
            psv_calibrations[psv.tag_number] = db.exec(
                select(Calibration)
                .filter(Calibration.tag_number == psv.tag_number)
                .order_by(Calibration.calibration_date.desc())
            ).all()

        # Calculate RBI distribution
        rbi_levels = {"level1": 0, "level2": 0, "level3": 0, "level4": 0}
        for psv in all_psvs:
            service_risk = service_risks.get(psv.service)
            psv_dist = calculate_rbi_distribution(
                psv,
                psv_calibrations[psv.tag_number],
                service_risk,
                active_configs
            )
            for level, count in psv_dist.items():
                rbi_levels[level] += count

        # Build complete summary
        summary = {
            "total": {
                "main": db.exec(main_count.with_only_columns(func.count())).first(),
                "spare": db.exec(spare_count.with_only_columns(func.count())).first()
            },
            "underCalibration": {
                "main": db.exec(main_under_cal.with_only_columns(func.count())).first(),
                "spare": db.exec(spare_under_cal.with_only_columns(func.count())).first()
            },
            "outOfCalibration": {
                "main": db.exec(main_out_of_cal.with_only_columns(func.count())).first(),
                "spare": db.exec(spare_out_of_cal.with_only_columns(func.count())).first()
            },
            "dueNextMonth": {
                "main": db.exec(main_due_next.with_only_columns(func.count())).first(),
                "spare": db.exec(spare_due_next.with_only_columns(func.count())).first()
            },
            "neverCalibrated": {
                "main": db.exec(main_never_cal.with_only_columns(func.count())).first(),
                "spare": db.exec(spare_never_cal.with_only_columns(func.count())).first()
            },
            "rbiDistribution": rbi_levels
        }

        return summary

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating PSV summary: {str(e)}"
        )