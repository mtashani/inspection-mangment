"""Enumerations for the report domain"""

from enum import Enum


class FieldType(str, Enum):
    """Enumeration for template field types"""
    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    CHECKBOX = "checkbox"
    IMAGE = "image"
    FILE = "file"


class ValueSource(str, Enum):
    """Enumeration for field value sources"""
    MANUAL = "manual"
    AUTO = "auto"


class SectionType(str, Enum):
    """Enumeration for template section types"""
    HEADER = "header"
    BODY = "body"
    FOOTER = "footer"
    ATTACHMENTS = "attachments"
    CUSTOM = "custom"


class ReportStatus(str, Enum):
    """Enumeration for final report status"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"