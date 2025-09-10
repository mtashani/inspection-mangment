"""Template management API routes"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.domains.report.services.template_service import TemplateService
from app.domains.report.models.template import Template
from app.domains.report.models.enums import SectionType, FieldType

# Initialize router
router = APIRouter(prefix="/templates", tags=["Report Templates"])

# Initialize logger
logger = logging.getLogger(__name__)

# Dependency injection
from app.database import get_session
from sqlmodel import Session

async def get_template_service(session: Session = Depends(get_session)) -> TemplateService:
    """Get template service instance"""
    return TemplateService(session)


@router.post(
    "/",
    response_model=Dict[str, Any],
    summary="Create Report Template",
    description="Create a new report template with sections and fields"
)
async def create_template(
    template_data: Dict[str, Any],
    template_service: TemplateService = Depends(get_template_service)
) -> Dict[str, Any]:
    """Create a new report template"""
    
    try:
        logger.info(f"Creating new template: {template_data.get('name', 'Unknown')}")
        
        # Create template
        template = await template_service.create_template(template_data)
        
        return {
            "success": True,
            "template_id": template.id,
            "message": "Template created successfully",
            "created_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to create template: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create template: {str(e)}"
        )


@router.get(
    "/",
    response_model=List[Dict[str, Any]],
    summary="Get All Templates",
    description="Retrieve all available report templates"
)
async def get_templates(
    active_only: bool = Query(True, description="Return only active templates"),
    template_service: TemplateService = Depends(get_template_service)
) -> List[Dict[str, Any]]:
    """Get all report templates"""
    
    try:
        logger.info("Retrieving all templates")
        
        # Get templates
        templates = await template_service.get_all_templates(active_only=active_only)
        
        return [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "is_active": template.is_active,
                "created_at": template.created_at,
                "updated_at": template.updated_at
            }
            for template in templates
        ]
        
    except Exception as e:
        logger.error(f"Failed to retrieve templates: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve templates: {str(e)}"
        )


@router.get(
    "/{template_id}",
    response_model=Dict[str, Any],
    summary="Get Template Details",
    description="Retrieve detailed template structure including sections and fields"
)
async def get_template(
    template_id: int = Path(..., description="Template ID"),
    template_service: TemplateService = Depends(get_template_service)
) -> Dict[str, Any]:
    """Get template details"""
    
    try:
        logger.info(f"Retrieving template {template_id}")
        
        # Get template with full structure
        template = await template_service.get_template_with_structure(template_id)
        
        if not template:
            raise HTTPException(
                status_code=404,
                detail=f"Template {template_id} not found"
            )
        
        return {
            "success": True,
            "template": template,
            "message": "Template retrieved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve template: {str(e)}"
        )


@router.put(
    "/{template_id}",
    response_model=Dict[str, Any],
    summary="Update Template",
    description="Update existing template structure"
)
async def update_template(
    template_id: int = Path(..., description="Template ID"),
    template_data: Dict[str, Any] = ...,
    template_service: TemplateService = Depends(get_template_service)
) -> Dict[str, Any]:
    """Update template"""
    
    try:
        logger.info(f"Updating template {template_id}")
        
        # Update template
        updated_template = await template_service.update_template(template_id, template_data)
        
        return {
            "success": True,
            "template_id": updated_template.id,
            "message": "Template updated successfully",
            "updated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to update template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update template: {str(e)}"
        )


@router.delete(
    "/{template_id}",
    response_model=Dict[str, Any],
    summary="Delete Template",
    description="Delete a report template (soft delete - marks as inactive)"
)
async def delete_template(
    template_id: int = Path(..., description="Template ID"),
    template_service: TemplateService = Depends(get_template_service)
) -> Dict[str, Any]:
    """Delete template"""
    
    try:
        logger.info(f"Deleting template {template_id}")
        
        # Delete template (soft delete)
        await template_service.delete_template(template_id)
        
        return {
            "success": True,
            "message": "Template deleted successfully",
            "deleted_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to delete template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete template: {str(e)}"
        )


@router.post(
    "/{template_id}/validate",
    response_model=Dict[str, Any],
    summary="Validate Template",
    description="Validate template structure and configuration"
)
async def validate_template(
    template_id: int = Path(..., description="Template ID"),
    template_service: TemplateService = Depends(get_template_service)
) -> Dict[str, Any]:
    """Validate template structure"""
    
    try:
        logger.info(f"Validating template {template_id}")
        
        # Validate template
        validation_result = await template_service.validate_template(template_id)
        
        return {
            "success": True,
            "validation_result": validation_result,
            "message": "Template validation completed"
        }
        
    except Exception as e:
        logger.error(f"Template validation failed for {template_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Template validation failed: {str(e)}"
        )


@router.post(
    "/{template_id}/clone",
    response_model=Dict[str, Any],
    summary="Clone Template",
    description="Create a copy of existing template"
)
async def clone_template(
    template_id: int = Path(..., description="Template ID to clone"),
    new_name: str = Query(..., description="Name for the cloned template"),
    template_service: TemplateService = Depends(get_template_service)
) -> Dict[str, Any]:
    """Clone template"""
    
    try:
        logger.info(f"Cloning template {template_id} as '{new_name}'")
        
        # Clone template
        cloned_template = await template_service.clone_template(template_id, new_name)
        
        return {
            "success": True,
            "original_template_id": template_id,
            "cloned_template_id": cloned_template.id,
            "message": "Template cloned successfully",
            "created_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to clone template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clone template: {str(e)}"
        )


@router.get(
    "/{template_id}/preview",
    response_model=Dict[str, Any],
    summary="Preview Template",
    description="Generate a preview of how the template will look when filled"
)
async def preview_template(
    template_id: int = Path(..., description="Template ID"),
    template_service: TemplateService = Depends(get_template_service)
) -> Dict[str, Any]:
    """Preview template"""
    
    try:
        logger.info(f"Generating preview for template {template_id}")
        
        # Generate preview
        preview = await template_service.generate_template_preview(template_id)
        
        return {
            "success": True,
            "preview": preview,
            "message": "Template preview generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to generate preview for template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate template preview: {str(e)}"
        )