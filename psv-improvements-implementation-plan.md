# PSV Management System Improvements Implementation Plan

Based on reviewing your codebase, I see that you've already implemented much of the PSV RBI system. This plan focuses on what needs to be fixed and added to meet your requirements fully.

## Current State Analysis

### What's Already Implemented

1. **Database Models**:
   - PSV model with all required fields ✅
   - Calibration model with fields for pre/post repair tests and condition assessment ✅
   - RBIConfiguration model with JSON settings ✅
   - ServiceRiskCategory model ✅

2. **Backend Logic**:
   - RBI calculation functions for Levels 1-4 ✅
   - GET and POST endpoints for RBI configurations ✅
   - Calculation endpoints with proper level fallbacks ✅

3. **Frontend**:
   - Settings page with RBI configuration form ✅
   - Basic UI for viewing and creating configurations ✅

### Current Issues

1. **API Endpoints**:
   - Missing PUT endpoint for updating RBI configurations ❌
   - `calculate_test_statistics` function referenced but not defined ❌

2. **Calculation Logic**:
   - Level 1 calculation uses fixed_interval from config instead of PSV's frequency field ❌
   - Some calculation functions have errors or undefined references ❌

3. **Frontend Issues**:
   - Settings don't update when configurations are changed ❌
   - Creating new configurations results in errors ❌
   - Service risk categories UI not implemented ❌
   - No feedback/toast notifications for success/failure ❌
   - Navigation between PSV pages is inconsistent ❌

## Implementation Plan

### 1. Backend Fixes

#### 1.1 Add Missing PUT Endpoint for RBI Configuration

Add to `backend/app/routers/psv/rbi_routes.py`:

```python
@router.put("/config/{config_id}", response_model=RBIConfiguration)
def update_rbi_config(
    config_id: int,
    config_update: RBIConfiguration,
    db: Session = Depends(get_session)
):
    """Update existing RBI configuration"""
    db_config = db.get(RBIConfiguration, config_id)
    if not db_config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Update configuration fields
    config_data = config_update.dict(exclude_unset=True)
    config_data["updated_at"] = datetime.utcnow()
    
    for key, value in config_data.items():
        setattr(db_config, key, value)
    
    # If this config is active, deactivate other configs at the same level
    if config_data.get("active") is True:
        # Get all other configurations at the same level
        other_configs = db.exec(
            select(RBIConfiguration)
            .filter(
                RBIConfiguration.id != config_id,
                RBIConfiguration.level == db_config.level,
                RBIConfiguration.active == True
            )
        ).all()
        
        # Deactivate them
        for other_config in other_configs:
            other_config.active = False
    
    try:
        db.commit()
        db.refresh(db_config)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_config
```

#### 1.2 Add Missing Functions

Add to `backend/app/routers/psv/rbi_routes.py`:

```python
def calculate_test_statistics(calibrations: List[Calibration]) -> Dict:
    """Calculate statistics from calibration test results"""
    if not calibrations:
        return {
            "pop_test": {"avg": None, "trend": 0},
            "leak_test": {"avg": None, "trend": 0}
        }
    
    # Extract pop test values
    pop_tests = [c.post_repair_pop_test for c in calibrations if c.post_repair_pop_test is not None]
    leak_tests = [c.post_repair_leak_test for c in calibrations if c.post_repair_leak_test is not None]
    
    # Calculate averages
    pop_avg = sum(pop_tests) / len(pop_tests) if pop_tests else None
    leak_avg = sum(leak_tests) / len(leak_tests) if leak_tests else None
    
    # Calculate trends if enough data
    pop_trend = calculate_trend(pop_tests) if len(pop_tests) >= 2 else 0
    leak_trend = calculate_trend(leak_tests) if len(leak_tests) >= 2 else 0
    
    return {
        "pop_test": {
            "avg": pop_avg,
            "trend": pop_trend
        },
        "leak_test": {
            "avg": leak_avg,
            "trend": leak_trend
        }
    }

def analyze_maintenance_patterns(calibrations: List[Calibration]) -> Dict:
    """Analyze maintenance patterns from calibration history"""
    if not calibrations:
        return {
            "repair_frequency": 0,
            "common_repairs": [],
            "avg_condition_score": None
        }
    
    # Simplified implementation - can be expanded based on requirements
    condition_scores = []
    for cal in calibrations:
        scores = []
        if cal.body_condition_score:
            scores.append(cal.body_condition_score)
        if cal.internal_parts_score:
            scores.append(cal.internal_parts_score)
        if cal.seat_plug_condition_score:
            scores.append(cal.seat_plug_condition_score)
        
        if scores:
            condition_scores.append(sum(scores) / len(scores))
    
    avg_score = sum(condition_scores) / len(condition_scores) if condition_scores else None
    
    return {
        "repair_frequency": 0,  # Would require work_maintenance analysis over time
        "common_repairs": [],   # Would require analysis of change_parts field
        "avg_condition_score": avg_score
    }
```

#### 1.3 Update RBI Level 1 Calculation Logic

Modify in `backend/app/routers/psv/rbi_utils.py`:

```python
def calculate_rbi_level_1(psv: PSV, config: RBIConfiguration) -> Tuple[int, datetime]:
    """Calculate fixed interval for RBI Level 1 using the PSV's frequency field"""
    # Use the PSV's frequency field instead of config settings
    interval = psv.frequency
    
    # If no calibration date exists, use current date as base
    base_date = psv.last_calibration_date if psv.last_calibration_date else datetime.utcnow()
    next_date = base_date + timedelta(days=interval * 30)  # Approximate months
    
    return interval, next_date
```

### 2. Frontend Improvements

#### 2.1 Create Shared Layout for Consistent Navigation

Create `frontend/src/app/(psv-layout)/layout.tsx`:

```tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "PSV List",
    href: "/psv",
  },
  {
    title: "Settings",
    href: "/psv-settings",
  },
  {
    title: "Analytics",
    href: "/psv-analytics",
  },
];

interface PSVLayoutWrapperProps {
  children: React.ReactNode;
}

export default function PSVLayoutWrapper({ children }: PSVLayoutWrapperProps) {
  const pathname = usePathname();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PSV Management</h2>
          <p className="text-muted-foreground">
            Manage and monitor pressure safety valves
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <nav className="flex space-x-2 border-b">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 Move Existing Pages

Restructure by moving:
- `frontend/src/app/psv/page.tsx` to `frontend/src/app/(psv-layout)/psv/page.tsx`
- `frontend/src/app/psv-settings/page.tsx` to `frontend/src/app/(psv-layout)/psv-settings/page.tsx`
- `frontend/src/app/psv-analytics/page.tsx` to `frontend/src/app/(psv-layout)/psv-analytics/page.tsx`

#### 2.3 Create API Service for RBI

Create `frontend/src/api/rbi.ts`:

```typescript
import { RBIConfiguration, ServiceRiskCategory } from "@/components/psv/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchRBIConfigurations(): Promise<RBIConfiguration[]> {
  const response = await fetch(`${API_URL}/api/psv/rbi/config`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch RBI configurations");
  }
  return response.json();
}

export async function createRBIConfiguration(config: RBIConfiguration): Promise<RBIConfiguration> {
  const response = await fetch(`${API_URL}/api/psv/rbi/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create RBI configuration");
  }
  
  return response.json();
}

export async function updateRBIConfiguration(id: number, config: Partial<RBIConfiguration>): Promise<RBIConfiguration> {
  const response = await fetch(`${API_URL}/api/psv/rbi/config/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to update RBI configuration");
  }
  
  return response.json();
}

// Service Risk Categories API functions
export async function fetchServiceRiskCategories(): Promise<ServiceRiskCategory[]> {
  const response = await fetch(`${API_URL}/api/psv/service-risk`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch service risk categories");
  }
  return response.json();
}

export async function createServiceRiskCategory(category: ServiceRiskCategory): Promise<ServiceRiskCategory> {
  const response = await fetch(`${API_URL}/api/psv/service-risk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create service risk category");
  }
  
  return response.json();
}

export async function updateServiceRiskCategory(id: number, category: Partial<ServiceRiskCategory>): Promise<ServiceRiskCategory> {
  const response = await fetch(`${API_URL}/api/psv/service-risk/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to update service risk category");
  }
  
  return response.json();
}

export async function deleteServiceRiskCategory(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/psv/service-risk/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to delete service risk category");
  }
}
```

### 3. Service Risk API Endpoints

Add to `backend/app/routers/psv/service_risk_routes.py`:

```python
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ...database import get_session
from ...psv_models import ServiceRiskCategory

router = APIRouter(tags=["PSV Service Risk"])

@router.get("/", response_model=List[ServiceRiskCategory])
def get_service_risk_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """Get service risk categories"""
    query = select(ServiceRiskCategory)
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/", response_model=ServiceRiskCategory)
def create_service_risk_category(
    category: ServiceRiskCategory,
    db: Session = Depends(get_session)
):
    """Create new service risk category"""
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return category

@router.get("/{id}", response_model=ServiceRiskCategory)
def get_service_risk_category(
    id: int,
    db: Session = Depends(get_session)
):
    """Get service risk category by ID"""
    category = db.get(ServiceRiskCategory, id)
    if not category:
        raise HTTPException(status_code=404, detail="Service risk category not found")
    return category

@router.put("/{id}", response_model=ServiceRiskCategory)
def update_service_risk_category(
    id: int,
    category_update: ServiceRiskCategory,
    db: Session = Depends(get_session)
):
    """Update service risk category"""
    db_category = db.get(ServiceRiskCategory, id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Service risk category not found")
    
    category_data = category_update.dict(exclude_unset=True)
    category_data["updated_at"] = datetime.utcnow()
    
    for key, value in category_data.items():
        setattr(db_category, key, value)
    
    try:
        db.commit()
        db.refresh(db_category)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_category

@router.delete("/{id}")
def delete_service_risk_category(
    id: int,
    db: Session = Depends(get_session)
):
    """Delete service risk category"""
    db_category = db.get(ServiceRiskCategory, id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Service risk category not found")
    
    try:
        db.delete(db_category)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Service risk category deleted successfully"}
```

### 4. Update Router Registration

Make sure the service risk routes are properly registered in `backend/app/routers/psv/__init__.py`:

```python
from fastapi import APIRouter
from .psv_routes import router as psv_router
from .calibration_routes import router as calibration_router
from .rbi_routes import router as rbi_router
from .service_risk_routes import router as service_risk_router

router = APIRouter(prefix="/psv", tags=["PSV"])

router.include_router(psv_router)
router.include_router(calibration_router)
router.include_router(rbi_router)
router.include_router(service_risk_router, prefix="/service-risk")
```

## Implementation Order

1. **Backend Updates**
   - Update RBI Level 1 calculation logic
   - Add missing functions
   - Add PUT endpoint for RBI configurations
   - Add Service Risk Category API endpoints
   - Update router registration

2. **Frontend Updates**
   - Create shared layout
   - Move existing pages to new structure
   - Create RBI API service
   - Update PSV Settings Page
   - Create Service Risk Form component

## Testing Steps

1. **Backend Testing**
   - Test PUT endpoint for updating RBI configuration
   - Verify RBI Level 1 calculation using PSV's frequency
   - Test Service Risk Category API endpoints

2. **Frontend Testing**
   - Verify navigation works between all pages
   - Test creating and updating RBI configurations
   - Test creating and updating Service Risk Categories
   - Check for proper feedback messages

## Moving to Code Implementation

Once this plan has been reviewed and approved, we can switch to Code mode to begin implementing these changes. We'll proceed systematically through each item, starting with the backend updates.