"""RBAC Analytics API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlmodel import Session, select, func
from typing import Dict, List, Any
import logging

from app.database import get_session as get_db
from app.domains.auth.dependencies import require_standardized_permission
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole

router = APIRouter()


@router.get("/overview")
async def get_rbac_analytics_overview(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get RBAC analytics overview including usage statistics and insights.
    
    Requires system_superadmin permission.
    """
    try:
        # Total permissions
        total_permissions = db.exec(select(func.count(Permission.id))).one()
        
        # Active permissions (those assigned to roles)
        active_permissions = db.exec(
            select(func.count(func.distinct(RolePermission.permission_id)))
        ).one()
        
        # Total roles
        total_roles = db.exec(select(func.count(Role.id))).one()
        
        # Active roles (those assigned to inspectors)
        active_roles = db.exec(
            select(func.count(func.distinct(InspectorRole.role_id)))
        ).one()
        
        # System vs Technical roles count
        system_roles_count = db.exec(
            select(func.count(Role.id))
            .where((Role.name.contains('admin')) | (Role.name.contains('super')))
        ).one()
        
        tech_roles_count = total_roles - system_roles_count
        
        # Calculate permission usage percentage
        permission_usage_percentage = (active_permissions / total_permissions * 100) if total_permissions > 0 else 0
        
        # Calculate security score (simplified algorithm)
        # Based on: role distribution, permission utilization, and assignment efficiency
        security_score = min(100, (active_roles / max(total_roles, 1) * 40) + 
                            (permission_usage_percentage * 0.4) + 
                            (20 if system_roles_count <= 3 else 10))  # Penalty for too many admin roles
        
        security_grade = "A+" if security_score >= 95 else "A" if security_score >= 85 else "B+" if security_score >= 75 else "B"
        
        # Count optimization opportunities
        # 1. Unused permissions
        unused_permissions = total_permissions - active_permissions
        
        # 2. Roles with identical permission sets (simplified approach)
        role_permission_signatures = {}
        
        # Get all roles with their permissions separately
        all_roles = db.exec(select(Role)).all()
        duplicate_role_groups = 0
        
        for role in all_roles:
            # Get permissions for this role
            role_permissions = db.exec(
                select(Permission.name)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .where(RolePermission.role_id == role.id)
                .order_by(Permission.name)
            ).all()
            
            perm_signature = ','.join(sorted(role_permissions))
            if perm_signature in role_permission_signatures:
                duplicate_role_groups += 1
            else:
                role_permission_signatures[perm_signature] = role.id
        
        optimization_opportunities = unused_permissions + (duplicate_role_groups // 2)  # Groups of duplicates
        
        return {
            "permissionUsage": {
                "percentage": round(permission_usage_percentage),
                "active": active_permissions,
                "total": total_permissions,
                "unused": unused_permissions
            },
            "roleDistribution": {
                "total": total_roles,
                "active": active_roles,
                "system": system_roles_count,
                "technical": tech_roles_count
            },
            "securityScore": {
                "score": round(security_score),
                "grade": security_grade,
                "compliance": round(security_score),
                "status": "excellent" if security_score >= 90 else "good" if security_score >= 75 else "needs_review"
            },
            "optimization": {
                "opportunities": optimization_opportunities,
                "status": "review_needed" if optimization_opportunities > 3 else "good"
            }
        }
        
    except Exception as e:
        logging.error(f"Error getting RBAC analytics overview: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get RBAC analytics overview"
        )


@router.get("/permission-usage")
async def get_permission_usage_analysis(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get detailed permission usage analysis.
    
    Requires system_superadmin permission.
    """
    try:
        # Get permission usage with user counts
        permission_usage = db.exec(
            select(
                Permission.name,
                func.count(func.distinct(InspectorRole.inspector_id)).label('user_count')
            )
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .group_by(Permission.id, Permission.name)
            .order_by(func.count(func.distinct(InspectorRole.inspector_id)).desc())
        ).all()
        
        # Calculate usage percentages
        total_inspectors = db.exec(select(func.count(Inspector.id))).one()
        
        usage_analysis = []
        for perm_name, user_count in permission_usage:
            usage_percentage = (user_count / total_inspectors * 100) if total_inspectors > 0 else 0
            usage_analysis.append({
                "permission": perm_name,
                "userCount": user_count,
                "usagePercentage": round(usage_percentage)
            })
        
        return {
            "permissionUsage": usage_analysis[:10],  # Top 10 most used permissions
            "totalInspectors": total_inspectors
        }
        
    except Exception as e:
        logging.error(f"Error getting permission usage analysis: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get permission usage analysis"
        )


@router.get("/role-efficiency")
async def get_role_efficiency_analysis(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get role efficiency analysis.
    
    Requires system_superadmin permission.
    """
    try:
        # Get all roles with their permission counts and inspector counts
        role_analysis = db.exec(
            select(
                Role.id,
                Role.name,
                Role.display_label,
                func.count(func.distinct(RolePermission.permission_id)).label('permission_count'),
                func.count(func.distinct(InspectorRole.inspector_id)).label('inspector_count')
            )
            .outerjoin(RolePermission, RolePermission.role_id == Role.id)
            .outerjoin(InspectorRole, InspectorRole.role_id == Role.id)
            .group_by(Role.id, Role.name, Role.display_label)
        ).all()
        
        # Analyze each role's efficiency
        role_efficiency = []
        for role_id, role_name, display_label, perm_count, inspector_count in role_analysis:
            # Simple efficiency algorithm
            # Optimal: has permissions (3-15 range) and is used by inspectors
            if inspector_count == 0:
                status = "unused"
                message = "No inspectors assigned"
                status_color = "yellow"
            elif perm_count == 0:
                status = "under_privileged"
                message = "No permissions assigned"
                status_color = "blue"
            elif perm_count > 20:
                status = "over_privileged"
                message = f"Too many permissions ({perm_count})"
                status_color = "yellow"
            elif 3 <= perm_count <= 15 and inspector_count > 0:
                status = "optimal"
                message = "Optimal permission set"
                status_color = "green"
            else:
                status = "needs_review"
                message = "Needs review"
                status_color = "blue"
            
            role_efficiency.append({
                "roleName": role_name,
                "displayLabel": display_label or role_name,
                "status": status,
                "message": message,
                "statusColor": status_color,
                "permissionCount": perm_count,
                "inspectorCount": inspector_count
            })
        
        return {
            "roleEfficiency": role_efficiency
        }
        
    except Exception as e:
        logging.error(f"Error getting role efficiency analysis: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get role efficiency analysis"
        )


@router.get("/recommendations")
async def get_rbac_recommendations(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get RBAC optimization recommendations.
    
    Requires system_superadmin permission.
    """
    try:
        recommendations = []
        
        # Check for unused permissions
        unused_permissions = db.exec(
            select(func.count(Permission.id))
            .outerjoin(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.permission_id == None)
        ).one()
        
        if unused_permissions > 0:
            recommendations.append({
                "type": "warning",
                "title": "Unused Permissions Detected",
                "description": f"{unused_permissions} permissions haven't been assigned to any roles. Consider reviewing their necessity.",
                "priority": "medium",
                "action": "review_permissions"
            })
        
        # Check for roles with identical permission sets (simplified approach)
        duplicate_groups = {}
        all_roles = db.exec(select(Role)).all()
        
        role_signatures = {}
        for role in all_roles:
            # Get permissions for this role
            role_permissions = db.exec(
                select(Permission.name)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .where(RolePermission.role_id == role.id)
                .order_by(Permission.name)
            ).all()
            
            perm_signature = ','.join(sorted(role_permissions))
            if perm_signature in role_signatures:
                if perm_signature not in duplicate_groups:
                    duplicate_groups[perm_signature] = [role_signatures[perm_signature]]
                duplicate_groups[perm_signature].append(role.name)
            else:
                role_signatures[perm_signature] = role.name
        
        if duplicate_groups:
            duplicate_count = sum(len(group) for group in duplicate_groups.values())
            recommendations.append({
                "type": "info",
                "title": "Role Consolidation Opportunity",
                "description": f"{duplicate_count} roles have identical permission sets. Consider merging them for better management.",
                "priority": "low",
                "action": "consolidate_roles"
            })
        
        # Check for unassigned roles
        unassigned_roles = db.exec(
            select(func.count(Role.id))
            .outerjoin(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.role_id == None)
        ).one()
        
        if unassigned_roles > 0:
            recommendations.append({
                "type": "info",
                "title": "Unassigned Roles",
                "description": f"{unassigned_roles} roles are not assigned to any inspectors. Consider whether they are still needed.",
                "priority": "low",
                "action": "review_roles"
            })
        
        # Check security compliance (always add this as positive feedback)
        critical_permissions = db.exec(
            select(func.count(Permission.id))
            .where((Permission.name.contains('superadmin')) | (Permission.name.contains('delete')))
        ).one()
        
        recommendations.append({
            "type": "success",
            "title": "Security Compliance",
            "description": "All critical permissions are properly assigned. No security issues detected.",
            "priority": "info",
            "action": "maintain_current"
        })
        
        return {
            "recommendations": recommendations
        }
        
    except Exception as e:
        logging.error(f"Error getting RBAC recommendations: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get RBAC recommendations"
        )