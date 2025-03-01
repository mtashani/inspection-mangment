# PSV Backend Updates Plan

## 1. Add Summary Statistics Endpoint

Need to implement `/api/psv/summary` endpoint to provide aggregated statistics currently calculated on frontend:

```python
@router.get("/summary")
def get_psv_summary(db: Session = Depends(get_session)):
    """Get PSV summary statistics"""
    # Get all PSVs
    psvs = db.exec(select(PSV)).all()
    
    # Split by status
    main_psvs = [p for p in psvs if p.status == "Main"]
    spare_psvs = [p for p in psvs if p.status == "Spare"]
    
    now = datetime.utcnow()
    one_month_from_now = datetime.utcnow() + timedelta(days=30)
    
    return {
        "total": {
            "main": len(main_psvs),
            "spare": len(spare_psvs)
        },
        "underCalibration": {
            "main": len([p for p in main_psvs if p.status == "Under_Calibration"]),
            "spare": len([p for p in spare_psvs if p.status == "Under_Calibration"])
        },
        "outOfCalibration": {
            "main": len([p for p in main_psvs if p.expire_date and datetime.fromisoformat(p.expire_date) < now]),
            "spare": len([p for p in spare_psvs if p.expire_date and datetime.fromisoformat(p.expire_date) < now])
        },
        "dueNextMonth": {
            "main": len([p for p in main_psvs if p.expire_date and now < datetime.fromisoformat(p.expire_date) <= one_month_from_now]),
            "spare": len([p for p in spare_psvs if p.expire_date and now < datetime.fromisoformat(p.expire_date) <= one_month_from_now])
        },
        "neverCalibrated": {
            "main": len([p for p in main_psvs if not p.last_calibration_date]),
            "spare": len([p for p in spare_psvs if not p.last_calibration_date])
        },
        "rbiLevel": {
            "level1": 0,  # TODO: Implement once RBI calculation is done
            "level2": 0,
            "level3": 0,
            "level4": 0
        }
    }
```

## 2. Implement RBI Calculation Logic

Complete the TODO in the calculate-rbi endpoint:

```python
@router.post("/{tag_number}/calculate-rbi")
def calculate_rbi(
    tag_number: str,
    level: int = Query(..., ge=1, le=4),
    db: Session = Depends(get_session)
):
    """Calculate next calibration date using RBI methodology"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
    
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
    
    # Get calibration history
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
    
    # Calculate based on RBI level
    if level == 1:
        # Fixed interval based on configuration
        interval = config.settings.get("fixed_interval", 24)  # Default 24 months
        next_date = datetime.utcnow() + timedelta(months=interval)
        
        return {
            "tag_number": tag_number,
            "rbi_level": level,
            "current_risk_score": 1,  # Fixed for level 1
            "recommended_interval": interval,
            "next_calibration_date": next_date.isoformat()
        }
    
    elif level == 2:
        # Based on pop test and leak test thresholds
        if not calibrations:
            return level_1_calculation()  # Fall back to level 1 if no history
            
        latest_cal = calibrations[0]
        thresholds = config.settings.get("pop_test_thresholds", {"min": -3, "max": 3})
        
        # Calculate deviation percentage
        pop_deviation = latest_cal.post_repair_pop_test
        risk_score = calculate_level_2_risk(pop_deviation, thresholds)
        interval = map_risk_to_interval(risk_score, config)
        
        return {
            "tag_number": tag_number,
            "rbi_level": level,
            "current_risk_score": risk_score,
            "recommended_interval": interval,
            "next_calibration_date": (datetime.utcnow() + timedelta(months=interval)).isoformat()
        }
    
    elif level == 3:
        # Based on condition assessment scores
        if not calibrations:
            return level_2_calculation()
            
        latest_cal = calibrations[0]
        weights = config.settings.get("parameter_weights", {})
        
        # Calculate weighted average of condition scores
        scores = [
            (latest_cal.body_condition_score or 0) * weights.get("body", 0.4),
            (latest_cal.internal_parts_score or 0) * weights.get("internal", 0.3),
            (latest_cal.seat_plug_condition_score or 0) * weights.get("seat", 0.3)
        ]
        
        risk_score = sum(scores)
        interval = map_risk_to_interval(risk_score, config)
        
        return {
            "tag_number": tag_number,
            "rbi_level": level,
            "current_risk_score": risk_score,
            "pof_score": calculate_pof_score(latest_cal),
            "recommended_interval": interval,
            "next_calibration_date": (datetime.utcnow() + timedelta(months=interval)).isoformat()
        }
    
    elif level == 4:
        # Based on risk matrix (PoF x CoF)
        if not calibrations or not service_risk:
            return level_3_calculation()
            
        latest_cal = calibrations[0]
        pof_score = calculate_pof_score(latest_cal)
        cof_score = service_risk.cof_score
        
        risk_matrix = config.settings.get("risk_matrix", {})
        risk_score = risk_matrix.get(f"{pof_score},{cof_score}", 3)
        interval = map_risk_to_interval(risk_score, config)
        
        return {
            "tag_number": tag_number,
            "rbi_level": level,
            "current_risk_score": risk_score,
            "pof_score": pof_score,
            "cof_score": cof_score,
            "risk_category": get_risk_category(risk_score),
            "recommended_interval": interval,
            "next_calibration_date": (datetime.utcnow() + timedelta(months=interval)).isoformat()
        }
```

## 3. Add Analytics Endpoint

Add new endpoint for PSV analytics:

```python
@router.get("/analytics")
def get_psv_analytics(
    start_date: datetime = Query(default=None),
    end_date: datetime = Query(default=None),
    db: Session = Depends(get_session)
):
    """Get PSV analytics data"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=365)  # Default to last year
    if not end_date:
        end_date = datetime.utcnow()
    
    # Get all PSVs and calibrations in date range
    psvs = db.exec(select(PSV)).all()
    calibrations = db.exec(
        select(Calibration)
        .filter(Calibration.calibration_date.between(start_date, end_date))
    ).all()
    
    # Group by month
    monthly_data = {}
    current = start_date
    while current <= end_date:
        month_key = current.strftime("%Y-%m")
        month_end = current.replace(day=28) + timedelta(days=4)  # Handle varying month lengths
        month_end = month_end - timedelta(days=month_end.day)  # Last day of month
        
        due_this_month = [
            p for p in psvs
            if p.expire_date and month_key in p.expire_date
        ]
        
        cals_this_month = [
            c for c in calibrations
            if c.calibration_date.strftime("%Y-%m") == month_key
        ]
        
        monthly_data[month_key] = {
            "month": month_key,
            "totalDue": len(due_this_month),
            "calibrated": len(cals_this_month),
            "remaining": len(due_this_month) - len(cals_this_month),
            "neverCalibrated": len([p for p in psvs if not p.last_calibration_date]),
            "rbiDistribution": get_rbi_distribution(psvs),
            "avgRiskScore": calculate_avg_risk_score(psvs)
        }
        
        current = month_end + timedelta(days=1)
    
    return list(monthly_data.values())
```

## Implementation Notes

1. The summary endpoint should be optimized with proper database queries rather than filtering in memory
2. RBI calculation logic needs thorough testing with different scenarios
3. Analytics endpoint should include pagination for large datasets
4. Consider adding caching for summary and analytics endpoints
5. Add proper error handling and validation for all new endpoints
6. Update the database models if needed to support new functionality
7. Consider adding background tasks for expensive calculations