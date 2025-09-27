from sqlmodel import Session, select
from app.database import engine
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole

with Session(engine) as session:
    # Find super admin user
    admin = session.exec(select(Inspector).where(Inspector.username == 'admin')).first()
    print(f'Admin user found: {admin.username if admin else "Not found"}')
    
    if admin:
        print(f'Admin ID: {admin.id}')
        print(f'Admin active: {admin.active}')
        print(f'Admin can_login: {admin.can_login}')
        
        # Get admin roles
        admin_roles = session.exec(
            select(Role)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.inspector_id == admin.id)
        ).all()
        
        print(f'Admin roles: {[role.name for role in admin_roles]}')
        
        # Get admin permissions
        admin_permissions = session.exec(
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(InspectorRole, InspectorRole.role_id == RolePermission.role_id)
            .where(InspectorRole.inspector_id == admin.id)
        ).all()
        
        print(f'Admin permissions: {list(admin_permissions)}')
        
        # Check if system_superadmin permission exists
        superadmin_perm = session.exec(
            select(Permission).where(Permission.name == 'system_superadmin')
        ).first()
        print(f'system_superadmin permission exists: {superadmin_perm is not None}')
        
    # Check what user is currently logged in (from token perspective)
    print("\n--- Checking all users ---")
    all_users = session.exec(select(Inspector)).all()
    for user in all_users:
        print(f"User: {user.username}, ID: {user.id}, Active: {user.active}, Can Login: {user.can_login}")