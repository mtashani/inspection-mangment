# Import models to make them accessible from the package
from app.domains.inspector.models import (
    Inspector, InspectorCertificationRecord,
    Role, Permission, RolePermission, InspectorRole,
    InspectorDocument, DocumentType,
    InspectorType, InspectorCertification, CertificationLevel
)
