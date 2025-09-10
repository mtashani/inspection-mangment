"""TemplateService for managing report templates"""

import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from app.domains.report.models.template import Template
from app.domains.report.models.template_section import TemplateSection
from app.domains.report.models.template_subsection import TemplateSubSection
from app.domains.report.models.template_field import TemplateField
from app.domains.report.models.enums import SectionType, FieldType, ValueSource
from app.domains.report.services.auto_field_service import AUTO_SOURCES


class TemplateServiceError(Exception):
    """Exception raised by TemplateService operations"""
    
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class ValidationError(Exception):
    """Exception raised during template validation"""
    
    def __init__(self, message: str, field_path: str = None, error_code: str = None):
        self.message = message
        self.field_path = field_path
        self.error_code = error_code
        super().__init__(message)


class ValidationResult:
    """Result of template validation"""
    
    def __init__(self):
        self.is_valid = True
        self.errors = []
        self.warnings = []
    
    def add_error(self, message: str, field_path: str = None, error_code: str = None):
        """Add validation error"""
        self.is_valid = False
        self.errors.append({
            'message': message,
            'field_path': field_path,
            'error_code': error_code,
            'type': 'error'
        })
    
    def add_warning(self, message: str, field_path: str = None, error_code: str = None):
        """Add validation warning"""
        self.warnings.append({
            'message': message,
            'field_path': field_path,
            'error_code': error_code,
            'type': 'warning'
        })
    
    def get_summary(self) -> Dict[str, Any]:
        """Get validation summary"""
        return {
            'is_valid': self.is_valid,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings),
            'errors': self.errors,
            'warnings': self.warnings
        }


class TemplateService:
    """Service for managing report templates"""
    
    def __init__(self, session: Session):
        """Initialize the template service"""
        self.session = session
    
    # CRUD Operations
    
    def create_template(self, name: str, description: Optional[str] = None) -> Template:
        """
        Create a new template
        
        Args:
            name: Template name (must be unique)
            description: Optional template description
            
        Returns:
            Created Template instance
            
        Raises:
            TemplateServiceError: If template creation fails
        """
        try:
            template = Template(
                name=name,
                description=description,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.session.add(template)
            self.session.commit()
            self.session.refresh(template)
            
            return template
            
        except IntegrityError as e:
            self.session.rollback()
            if "UNIQUE constraint failed" in str(e) or "duplicate key" in str(e):
                raise TemplateServiceError(
                    f"Template with name '{name}' already exists",
                    "DUPLICATE_NAME"
                )
            raise TemplateServiceError(f"Failed to create template: {str(e)}")
        except Exception as e:
            self.session.rollback()
            raise TemplateServiceError(f"Failed to create template: {str(e)}")
    
    def get_template(self, template_id: int) -> Optional[Template]:
        """
        Get template by ID
        
        Args:
            template_id: Template ID
            
        Returns:
            Template instance or None if not found
        """
        try:
            statement = select(Template).where(Template.id == template_id)
            return self.session.exec(statement).first()
        except Exception as e:
            raise TemplateServiceError(f"Failed to get template: {str(e)}")
    
    def get_template_by_name(self, name: str) -> Optional[Template]:
        """
        Get template by name
        
        Args:
            name: Template name
            
        Returns:
            Template instance or None if not found
        """
        try:
            statement = select(Template).where(Template.name == name)
            return self.session.exec(statement).first()
        except Exception as e:
            raise TemplateServiceError(f"Failed to get template by name: {str(e)}")
    
    def get_all_templates(self, active_only: bool = True) -> List[Template]:
        """
        Get all templates
        
        Args:
            active_only: If True, only return active templates
            
        Returns:
            List of Template instances
        """
        try:
            statement = select(Template)
            if active_only:
                statement = statement.where(Template.is_active == True)
            
            return list(self.session.exec(statement).all())
        except Exception as e:
            raise TemplateServiceError(f"Failed to get templates: {str(e)}")
    
    def update_template(
        self, 
        template_id: int, 
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Template]:
        """
        Update template
        
        Args:
            template_id: Template ID
            name: New name (optional)
            description: New description (optional)
            is_active: New active status (optional)
            
        Returns:
            Updated Template instance or None if not found
            
        Raises:
            TemplateServiceError: If update fails
        """
        try:
            template = self.get_template(template_id)
            if not template:
                return None
            
            if name is not None:
                template.name = name
            if description is not None:
                template.description = description
            if is_active is not None:
                template.is_active = is_active
            
            template.updated_at = datetime.utcnow()
            
            self.session.add(template)
            self.session.commit()
            self.session.refresh(template)
            
            return template
            
        except IntegrityError as e:
            self.session.rollback()
            if "UNIQUE constraint failed" in str(e) or "duplicate key" in str(e):
                raise TemplateServiceError(
                    f"Template with name '{name}' already exists",
                    "DUPLICATE_NAME"
                )
            raise TemplateServiceError(f"Failed to update template: {str(e)}")
        except Exception as e:
            self.session.rollback()
            raise TemplateServiceError(f"Failed to update template: {str(e)}")
    
    def delete_template(self, template_id: int) -> bool:
        """
        Delete template (soft delete by setting is_active=False)
        
        Args:
            template_id: Template ID
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            TemplateServiceError: If deletion fails
        """
        try:
            template = self.get_template(template_id)
            if not template:
                return False
            
            template.is_active = False
            template.updated_at = datetime.utcnow()
            
            self.session.add(template)
            self.session.commit()
            
            return True
            
        except Exception as e:
            self.session.rollback()
            raise TemplateServiceError(f"Failed to delete template: {str(e)}")
    
    def hard_delete_template(self, template_id: int) -> bool:
        """
        Permanently delete template and all related data
        
        Args:
            template_id: Template ID
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            TemplateServiceError: If deletion fails
        """
        try:
            template = self.get_template(template_id)
            if not template:
                return False
            
            # Delete all related data in correct order
            # Fields -> SubSections -> Sections -> Template
            
            # Get all sections
            sections = self.session.exec(
                select(TemplateSection).where(TemplateSection.template_id == template_id)
            ).all()
            
            for section in sections:
                # Get all subsections
                subsections = self.session.exec(
                    select(TemplateSubSection).where(TemplateSubSection.section_id == section.id)
                ).all()
                
                for subsection in subsections:
                    # Delete all fields
                    fields = self.session.exec(
                        select(TemplateField).where(TemplateField.subsection_id == subsection.id)
                    ).all()
                    
                    for field in fields:
                        self.session.delete(field)
                    
                    # Delete subsection
                    self.session.delete(subsection)
                
                # Delete section
                self.session.delete(section)
            
            # Delete template
            self.session.delete(template)
            self.session.commit()
            
            return True
            
        except Exception as e:
            self.session.rollback()
            raise TemplateServiceError(f"Failed to hard delete template: {str(e)}")
    
    # Template Structure Operations
    
    def get_template_with_structure(self, template_id: int) -> Optional[Template]:
        """
        Get template with full structure (sections, subsections, fields)
        
        Args:
            template_id: Template ID
            
        Returns:
            Template with loaded relationships or None if not found
        """
        try:
            # Get template with all relationships loaded
            statement = (
                select(Template)
                .where(Template.id == template_id)
            )
            
            template = self.session.exec(statement).first()
            if not template:
                return None
            
            # Manually load relationships to ensure they're available
            # This is a simple approach - in production you might use eager loading
            template.sections = list(self.session.exec(
                select(TemplateSection)
                .where(TemplateSection.template_id == template_id)
                .order_by(TemplateSection.order)
            ).all())
            
            for section in template.sections:
                section.subsections = list(self.session.exec(
                    select(TemplateSubSection)
                    .where(TemplateSubSection.section_id == section.id)
                    .order_by(TemplateSubSection.order)
                ).all())
                
                for subsection in section.subsections:
                    subsection.fields = list(self.session.exec(
                        select(TemplateField)
                        .where(TemplateField.subsection_id == subsection.id)
                        .order_by(TemplateField.order)
                    ).all())
            
            return template
            
        except Exception as e:
            raise TemplateServiceError(f"Failed to get template structure: {str(e)}")
    
    def clone_template(self, template_id: int, new_name: str) -> Optional[Template]:
        """
        Clone an existing template with all its structure
        
        Args:
            template_id: Source template ID
            new_name: Name for the cloned template
            
        Returns:
            Cloned Template instance or None if source not found
            
        Raises:
            TemplateServiceError: If cloning fails
        """
        try:
            # Get source template with full structure
            source_template = self.get_template_with_structure(template_id)
            if not source_template:
                return None
            
            # Create new template
            new_template = self.create_template(
                name=new_name,
                description=f"Cloned from: {source_template.name}"
            )
            
            # Clone sections
            for source_section in source_template.sections:
                new_section = TemplateSection(
                    template_id=new_template.id,
                    title=source_section.title,
                    section_type=source_section.section_type,
                    order=source_section.order
                )
                self.session.add(new_section)
                self.session.flush()  # Get the ID
                
                # Clone subsections
                for source_subsection in source_section.subsections:
                    new_subsection = TemplateSubSection(
                        section_id=new_section.id,
                        title=source_subsection.title,
                        order=source_subsection.order
                    )
                    self.session.add(new_subsection)
                    self.session.flush()  # Get the ID
                    
                    # Clone fields
                    for source_field in source_subsection.fields:
                        new_field = TemplateField(
                            subsection_id=new_subsection.id,
                            label=source_field.label,
                            field_type=source_field.field_type,
                            value_source=source_field.value_source,
                            order=source_field.order,
                            row=source_field.row,
                            col=source_field.col,
                            rowspan=source_field.rowspan,
                            colspan=source_field.colspan,
                            options=source_field.options,
                            is_required=source_field.is_required,
                            placeholder=source_field.placeholder,
                            auto_source_key=source_field.auto_source_key,
                            purpose=source_field.purpose
                        )
                        self.session.add(new_field)
            
            self.session.commit()
            
            # Return the cloned template with structure
            return self.get_template_with_structure(new_template.id)
            
        except Exception as e:
            self.session.rollback()
            raise TemplateServiceError(f"Failed to clone template: {str(e)}")
    
    # Template Statistics and Info
    
    def get_template_stats(self, template_id: int) -> Optional[Dict[str, Any]]:
        """
        Get template statistics
        
        Args:
            template_id: Template ID
            
        Returns:
            Dictionary with template statistics or None if not found
        """
        try:
            template = self.get_template_with_structure(template_id)
            if not template:
                return None
            
            total_sections = len(template.sections)
            total_subsections = sum(len(section.subsections) for section in template.sections)
            total_fields = sum(
                len(subsection.fields) 
                for section in template.sections 
                for subsection in section.subsections
            )
            
            # Count field types
            field_types = {}
            auto_fields = 0
            manual_fields = 0
            required_fields = 0
            
            for section in template.sections:
                for subsection in section.subsections:
                    for field in subsection.fields:
                        # Count field types
                        field_type = field.field_type.value
                        field_types[field_type] = field_types.get(field_type, 0) + 1
                        
                        # Count value sources
                        if field.value_source == ValueSource.AUTO:
                            auto_fields += 1
                        else:
                            manual_fields += 1
                        
                        # Count required fields
                        if field.is_required:
                            required_fields += 1
            
            return {
                'template_id': template_id,
                'name': template.name,
                'is_active': template.is_active,
                'created_at': template.created_at,
                'updated_at': template.updated_at,
                'structure': {
                    'total_sections': total_sections,
                    'total_subsections': total_subsections,
                    'total_fields': total_fields,
                },
                'field_analysis': {
                    'field_types': field_types,
                    'auto_fields': auto_fields,
                    'manual_fields': manual_fields,
                    'required_fields': required_fields,
                }
            }
            
        except Exception as e:
            raise TemplateServiceError(f"Failed to get template stats: {str(e)}")
    
    def search_templates(self, query: str, active_only: bool = True) -> List[Template]:
        """
        Search templates by name or description
        
        Args:
            query: Search query
            active_only: If True, only search active templates
            
        Returns:
            List of matching Template instances
        """
        try:
            statement = select(Template).where(
                (Template.name.contains(query)) | 
                (Template.description.contains(query))
            )
            
            if active_only:
                statement = statement.where(Template.is_active == True)
            
            return list(self.session.exec(statement).all())
            
        except Exception as e:
            raise TemplateServiceError(f"Failed to search templates: {str(e)}")
    
    # Template Validation Methods
    
    def validate_template_structure(self, template_id: int) -> ValidationResult:
        """
        Validate complete template structure
        
        Args:
            template_id: Template ID to validate
            
        Returns:
            ValidationResult with validation details
            
        Raises:
            TemplateServiceError: If validation process fails
        """
        try:
            template = self.get_template_with_structure(template_id)
            if not template:
                raise TemplateServiceError(f"Template {template_id} not found")
            
            result = ValidationResult()
            
            # Validate template basic properties
            self._validate_template_basic(template, result)
            
            # Validate sections
            self._validate_sections(template.sections, result)
            
            # Validate section ordering
            self._validate_section_ordering(template.sections, result)
            
            # Validate subsections and fields
            for section in template.sections:
                section_path = f"sections[{section.order}]"
                self._validate_subsections(section.subsections, result, section_path)
                
                for subsection in section.subsections:
                    subsection_path = f"{section_path}.subsections[{subsection.order}]"
                    self._validate_fields(subsection.fields, result, subsection_path)
                    
                    # Validate canvas positioning
                    self._validate_canvas_positioning(subsection.fields, result, subsection_path)
            
            return result
            
        except Exception as e:
            if isinstance(e, TemplateServiceError):
                raise
            raise TemplateServiceError(f"Failed to validate template structure: {str(e)}")
    
    def _validate_template_basic(self, template: Template, result: ValidationResult):
        """Validate basic template properties"""
        if not template.name or template.name.strip() == "":
            result.add_error("Template name is required", "name", "MISSING_NAME")
        
        if len(template.name) > 255:
            result.add_error("Template name too long (max 255 characters)", "name", "NAME_TOO_LONG")
        
        if not template.sections:
            result.add_error("Template must have at least one section", "sections", "NO_SECTIONS")
    
    def _validate_sections(self, sections: List[TemplateSection], result: ValidationResult):
        """Validate sections"""
        if not sections:
            return
        
        # Check for duplicate section types
        section_types = {}
        for section in sections:
            section_type = section.section_type
            if section_type in section_types:
                result.add_warning(
                    f"Duplicate section type: {section_type.value}",
                    f"sections[{section.order}].section_type",
                    "DUPLICATE_SECTION_TYPE"
                )
            else:
                section_types[section_type] = section
            
            # Validate section title
            if not section.title or section.title.strip() == "":
                result.add_error(
                    "Section title is required",
                    f"sections[{section.order}].title",
                    "MISSING_SECTION_TITLE"
                )
    
    def _validate_section_ordering(self, sections: List[TemplateSection], result: ValidationResult):
        """Validate section ordering"""
        if not sections:
            return
        
        orders = [section.order for section in sections]
        
        # Check for duplicate orders
        if len(orders) != len(set(orders)):
            result.add_error("Duplicate section orders found", "sections.order", "DUPLICATE_SECTION_ORDER")
        
        # Check for gaps in ordering (should be sequential starting from 0 or 1)
        sorted_orders = sorted(orders)
        expected_start = min(sorted_orders) if sorted_orders else 0
        
        for i, order in enumerate(sorted_orders):
            expected_order = expected_start + i
            if order != expected_order:
                result.add_warning(
                    f"Section ordering gap: expected {expected_order}, found {order}",
                    "sections.order",
                    "SECTION_ORDER_GAP"
                )
                break
    
    def _validate_subsections(self, subsections: List[TemplateSubSection], result: ValidationResult, section_path: str):
        """Validate subsections"""
        if not subsections:
            result.add_warning("Section has no subsections", f"{section_path}.subsections", "NO_SUBSECTIONS")
            return
        
        # Check subsection ordering
        orders = [subsection.order for subsection in subsections]
        if len(orders) != len(set(orders)):
            result.add_error(
                "Duplicate subsection orders found",
                f"{section_path}.subsections.order",
                "DUPLICATE_SUBSECTION_ORDER"
            )
    
    def _validate_fields(self, fields: List[TemplateField], result: ValidationResult, subsection_path: str):
        """Validate fields"""
        if not fields:
            result.add_warning("Subsection has no fields", f"{subsection_path}.fields", "NO_FIELDS")
            return
        
        for field in fields:
            field_path = f"{subsection_path}.fields[{field.order}]"
            
            # Validate field label
            if not field.label or field.label.strip() == "":
                result.add_error(
                    "Field label is required",
                    f"{field_path}.label",
                    "MISSING_FIELD_LABEL"
                )
            
            # Validate field type
            if not field.field_type:
                result.add_error(
                    "Field type is required",
                    f"{field_path}.field_type",
                    "MISSING_FIELD_TYPE"
                )
            
            # Validate value source
            if not field.value_source:
                result.add_error(
                    "Field value source is required",
                    f"{field_path}.value_source",
                    "MISSING_VALUE_SOURCE"
                )
            
            # Validate auto-field configuration
            if field.value_source == ValueSource.AUTO:
                if not field.auto_source_key:
                    result.add_error(
                        "Auto-source key is required for auto fields",
                        f"{field_path}.auto_source_key",
                        "MISSING_AUTO_SOURCE_KEY"
                    )
                elif field.auto_source_key not in AUTO_SOURCES:
                    result.add_error(
                        f"Invalid auto-source key: {field.auto_source_key}",
                        f"{field_path}.auto_source_key",
                        "INVALID_AUTO_SOURCE_KEY"
                    )
            
            # Validate select field options
            if field.field_type == FieldType.SELECT:
                if not field.options:
                    result.add_error(
                        "Select field must have options",
                        f"{field_path}.options",
                        "MISSING_SELECT_OPTIONS"
                    )
                else:
                    # Try to parse JSON options
                    try:
                        import json
                        options = json.loads(field.options)
                        if not isinstance(options, list) or len(options) == 0:
                            result.add_error(
                                "Select options must be a non-empty array",
                                f"{field_path}.options",
                                "INVALID_SELECT_OPTIONS"
                            )
                    except json.JSONDecodeError:
                        result.add_error(
                            "Select options must be valid JSON",
                            f"{field_path}.options",
                            "INVALID_SELECT_OPTIONS_JSON"
                        )
            
            # Validate positioning
            if field.row < 0 or field.col < 0:
                result.add_error(
                    "Field position cannot be negative",
                    f"{field_path}.position",
                    "NEGATIVE_POSITION"
                )
            
            if field.rowspan < 1 or field.colspan < 1:
                result.add_error(
                    "Field span must be at least 1",
                    f"{field_path}.span",
                    "INVALID_SPAN"
                )
        
        # Check field ordering
        orders = [field.order for field in fields]
        if len(orders) != len(set(orders)):
            result.add_error(
                "Duplicate field orders found",
                f"{subsection_path}.fields.order",
                "DUPLICATE_FIELD_ORDER"
            )
    
    def _validate_canvas_positioning(self, fields: List[TemplateField], result: ValidationResult, subsection_path: str):
        """Validate canvas positioning for conflicts"""
        if not fields:
            return
        
        # Create a grid to check for overlaps
        occupied_cells = {}
        
        for field in fields:
            field_path = f"{subsection_path}.fields[{field.order}]"
            
            # Check each cell this field occupies
            for row in range(field.row, field.row + field.rowspan):
                for col in range(field.col, field.col + field.colspan):
                    cell_key = f"{row},{col}"
                    
                    if cell_key in occupied_cells:
                        other_field = occupied_cells[cell_key]
                        result.add_error(
                            f"Field positioning conflict at ({row}, {col}) with field '{other_field.label}'",
                            f"{field_path}.position",
                            "POSITION_CONFLICT"
                        )
                    else:
                        occupied_cells[cell_key] = field
    
    def validate_template_completeness(self, template_id: int) -> ValidationResult:
        """
        Validate template completeness for report generation
        
        Args:
            template_id: Template ID to validate
            
        Returns:
            ValidationResult with completeness validation
        """
        try:
            template = self.get_template_with_structure(template_id)
            if not template:
                raise TemplateServiceError(f"Template {template_id} not found")
            
            result = ValidationResult()
            
            # Check if template has required sections
            section_types = {section.section_type for section in template.sections}
            
            if SectionType.HEADER not in section_types:
                result.add_warning("Template missing header section", "sections", "MISSING_HEADER")
            
            if SectionType.BODY not in section_types:
                result.add_warning("Template missing body section", "sections", "MISSING_BODY")
            
            # Check for at least some manual fields (user input required)
            total_fields = 0
            manual_fields = 0
            required_fields = 0
            
            for section in template.sections:
                for subsection in section.subsections:
                    for field in subsection.fields:
                        total_fields += 1
                        if field.value_source == ValueSource.MANUAL:
                            manual_fields += 1
                        if field.is_required:
                            required_fields += 1
            
            if total_fields == 0:
                result.add_error("Template has no fields", "fields", "NO_FIELDS")
            elif manual_fields == 0:
                result.add_warning("Template has no manual fields (all auto-populated)", "fields", "NO_MANUAL_FIELDS")
            
            if required_fields == 0:
                result.add_warning("Template has no required fields", "fields", "NO_REQUIRED_FIELDS")
            
            return result
            
        except Exception as e:
            if isinstance(e, TemplateServiceError):
                raise
            raise TemplateServiceError(f"Failed to validate template completeness: {str(e)}")
    
    def validate_field_configuration(self, field_data: Dict[str, Any]) -> ValidationResult:
        """
        Validate individual field configuration
        
        Args:
            field_data: Dictionary with field configuration
            
        Returns:
            ValidationResult with field validation
        """
        result = ValidationResult()
        
        # Required fields
        required_fields = ['label', 'field_type', 'value_source']
        for req_field in required_fields:
            if req_field not in field_data or not field_data[req_field]:
                result.add_error(
                    f"Field {req_field} is required",
                    req_field,
                    f"MISSING_{req_field.upper()}"
                )
        
        # Validate field type
        if 'field_type' in field_data:
            try:
                FieldType(field_data['field_type'])
            except ValueError:
                result.add_error(
                    f"Invalid field type: {field_data['field_type']}",
                    "field_type",
                    "INVALID_FIELD_TYPE"
                )
        
        # Validate value source
        if 'value_source' in field_data:
            try:
                ValueSource(field_data['value_source'])
            except ValueError:
                result.add_error(
                    f"Invalid value source: {field_data['value_source']}",
                    "value_source",
                    "INVALID_VALUE_SOURCE"
                )
        
        # Validate auto-source key
        if field_data.get('value_source') == 'auto':
            auto_source_key = field_data.get('auto_source_key')
            if not auto_source_key:
                result.add_error(
                    "Auto-source key is required for auto fields",
                    "auto_source_key",
                    "MISSING_AUTO_SOURCE_KEY"
                )
            elif auto_source_key not in AUTO_SOURCES:
                result.add_error(
                    f"Invalid auto-source key: {auto_source_key}",
                    "auto_source_key",
                    "INVALID_AUTO_SOURCE_KEY"
                )
        
        # Validate positioning
        for pos_field in ['row', 'col', 'rowspan', 'colspan']:
            if pos_field in field_data:
                value = field_data[pos_field]
                if not isinstance(value, int) or value < 0:
                    result.add_error(
                        f"Field {pos_field} must be a non-negative integer",
                        pos_field,
                        f"INVALID_{pos_field.upper()}"
                    )
                
                if pos_field in ['rowspan', 'colspan'] and value < 1:
                    result.add_error(
                        f"Field {pos_field} must be at least 1",
                        pos_field,
                        f"INVALID_{pos_field.upper()}"
                    )
        
        return result  
  
    # Additional API methods
    
    def create_template(self, template_data: Dict[str, Any]) -> Template:
        """
        Create a new template from API data
        
        Args:
            template_data: Dictionary containing template data
            
        Returns:
            Created Template instance
        """
        try:
            name = template_data.get('name')
            description = template_data.get('description')
            
            if not name:
                raise TemplateServiceError("Template name is required")
            
            # Use existing create_template method
            template = self.create_template(name, description)
            
            # If sections are provided, create them
            if 'sections' in template_data:
                for section_data in template_data['sections']:
                    section = self.add_section(
                        template.id,
                        section_data.get('title', ''),
                        section_data.get('section_type', 'body'),
                        section_data.get('order', 0)
                    )
                    
                    # Add subsections if provided
                    if 'subsections' in section_data:
                        for subsection_data in section_data['subsections']:
                            subsection = self.add_subsection(
                                section.id,
                                subsection_data.get('title'),
                                subsection_data.get('order', 0)
                            )
                            
                            # Add fields if provided
                            if 'fields' in subsection_data:
                                for field_data in subsection_data['fields']:
                                    self.add_field(subsection.id, field_data)
            
            return template
            
        except Exception as e:
            raise TemplateServiceError(f"Failed to create template from data: {str(e)}")
    
    def validate_template(self, template_id: int) -> Dict[str, Any]:
        """
        Validate template structure and return results
        
        Args:
            template_id: ID of the template to validate
            
        Returns:
            Dictionary with validation results
        """
        try:
            # Use existing validation methods
            structure_result = self.validate_template_structure(template_id)
            completeness_result = self.validate_template_completeness(template_id)
            
            return {
                'is_valid': structure_result.is_valid and completeness_result.is_valid,
                'structure_validation': {
                    'is_valid': structure_result.is_valid,
                    'errors': structure_result.errors,
                    'warnings': structure_result.warnings
                },
                'completeness_validation': {
                    'is_valid': completeness_result.is_valid,
                    'errors': completeness_result.errors,
                    'warnings': completeness_result.warnings
                }
            }
            
        except Exception as e:
            raise TemplateServiceError(f"Failed to validate template: {str(e)}")
    
    def generate_template_preview(self, template_id: int) -> Dict[str, Any]:
        """
        Generate a preview of how the template will look
        
        Args:
            template_id: ID of the template
            
        Returns:
            Dictionary with preview data
        """
        try:
            # Get template with structure
            template = self.get_template_with_structure(template_id)
            if not template:
                raise TemplateServiceError(f"Template {template_id} not found")
            
            # Generate preview structure
            preview = {
                'template_id': template.id,
                'template_name': template.name,
                'sections': []
            }
            
            for section in template.sections:
                section_preview = {
                    'title': section.title,
                    'type': section.section_type,
                    'subsections': []
                }
                
                for subsection in section.subsections:
                    subsection_preview = {
                        'title': subsection.title,
                        'fields': []
                    }
                    
                    for field in subsection.fields:
                        field_preview = {
                            'label': field.label,
                            'type': field.field_type,
                            'required': field.is_required,
                            'placeholder': field.placeholder,
                            'position': {
                                'row': field.row,
                                'col': field.col,
                                'rowspan': field.rowspan,
                                'colspan': field.colspan
                            }
                        }
                        
                        # Add options for select fields
                        if field.field_type == 'select' and field.options:
                            try:
                                field_preview['options'] = json.loads(field.options)
                            except:
                                field_preview['options'] = []
                        
                        # Add auto-source info
                        if field.value_source == 'auto':
                            field_preview['auto_source'] = field.auto_source_key
                        
                        subsection_preview['fields'].append(field_preview)
                    
                    section_preview['subsections'].append(subsection_preview)
                
                preview['sections'].append(section_preview)
            
            return preview
            
        except Exception as e:
            raise TemplateServiceError(f"Failed to generate template preview: {str(e)}")