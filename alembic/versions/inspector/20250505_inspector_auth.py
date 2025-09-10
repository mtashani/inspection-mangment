"""Add authentication and role-based permissions to inspectors

Revision ID: 20250505_inspector_auth
Revises: 
Create Date: 2025-05-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Date, ForeignKey, JSON, Text
from sqlalchemy.sql import func
import datetime

# revision identifiers, used by Alembic.
revision = '20250505_inspector_auth'
down_revision = None
branch_labels = ('inspector_auth',)
depends_on = None


def upgrade():
    """
    Upgrade the database to include authentication and role-based permission features.
    """
    # 1. Update inspectors table with auth and profile fields
    op.add_column('inspectors', sa.Column('username', sa.String(50), unique=True, nullable=True))
    op.add_column('inspectors', sa.Column('password_hash', sa.String(255), nullable=True))
    op.add_column('inspectors', sa.Column('can_login', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('inspectors', sa.Column('last_login', sa.DateTime(), nullable=True))
    op.add_column('inspectors', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('inspectors', sa.Column('profile_image_url', sa.String(255), nullable=True))
    
    # Create index for username
    op.create_index(op.f('ix_inspectors_username'), 'inspectors', ['username'], unique=True)
    
    # 2. Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(50), unique=True, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'))
    )
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=True)
    
    # 3. Create permissions table
    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), unique=True, nullable=False),
        sa.Column('resource', sa.String(50), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'))
    )
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)
    
    # 4. Create role_permissions table (many-to-many)
    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.Integer(), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('permission_id', sa.Integer(), sa.ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'))
    )
    
    # 5. Create inspector_roles table (many-to-many)
    op.create_table(
        'inspector_roles',
        sa.Column('inspector_id', sa.Integer(), sa.ForeignKey('inspectors.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role_id', sa.Integer(), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'))
    )
    
    # 6. Create inspector_documents table
    op.create_table(
        'inspector_documents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('inspector_id', sa.Integer(), sa.ForeignKey('inspectors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('file_url', sa.String(255), nullable=False),
        sa.Column('upload_date', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'))
    )
    
    # 7. Update calibration table to use inspector IDs instead of strings
    # Calibration Table: First add columns, we'll handle data migration in a separate step
    try:
        op.add_column('calibration', sa.Column('inspector_id', sa.Integer(), sa.ForeignKey('inspectors.id'), nullable=True))
        op.add_column('calibration', sa.Column('test_operator_id', sa.Integer(), sa.ForeignKey('inspectors.id'), nullable=True))
        op.add_column('calibration', sa.Column('approved_by_id', sa.Integer(), sa.ForeignKey('inspectors.id'), nullable=True))
    except Exception as e:
        print(f"Warning: Couldn't add columns to calibration table. This may be normal if the table doesn't exist yet: {str(e)}")
    
    # 8. Update corrosion_analysis_reports table to use inspector IDs
    try:
        op.add_column('corrosion_analysis_reports', sa.Column('cleaned_by_id', sa.Integer(), sa.ForeignKey('inspectors.id'), nullable=True))
        op.add_column('corrosion_analysis_reports', sa.Column('analyzed_by_id', sa.Integer(), sa.ForeignKey('inspectors.id'), nullable=True))
        op.add_column('corrosion_analysis_reports', sa.Column('approved_by_id', sa.Integer(), sa.ForeignKey('inspectors.id'), nullable=True))
    except Exception as e:
        print(f"Warning: Couldn't add columns to corrosion_analysis_reports table. This may be normal if the table doesn't exist yet: {str(e)}")
    
    # Insert default roles and permissions
    _create_default_roles_and_permissions()


def downgrade():
    """
    Downgrade the database to remove authentication and role-based permission features.
    """
    # Carefully drop foreign keys first
    try:
        # 1. Drop corrosion analysis inspector ID columns
        op.drop_column('corrosion_analysis_reports', 'cleaned_by_id')
        op.drop_column('corrosion_analysis_reports', 'analyzed_by_id')
        op.drop_column('corrosion_analysis_reports', 'approved_by_id')
    except Exception:
        pass
    
    try:
        # 2. Drop calibration inspector ID columns
        op.drop_column('calibration', 'inspector_id')
        op.drop_column('calibration', 'test_operator_id')
        op.drop_column('calibration', 'approved_by_id')
    except Exception:
        pass
    
    # 3. Drop tables in reverse order of creation
    op.drop_table('inspector_documents')
    op.drop_table('inspector_roles')
    op.drop_table('role_permissions')
    op.drop_table('permissions')
    op.drop_table('roles')
    
    # 4. Drop inspector auth columns
    op.drop_index(op.f('ix_inspectors_username'), 'inspectors')
    op.drop_column('inspectors', 'profile_image_url')
    op.drop_column('inspectors', 'date_of_birth')
    op.drop_column('inspectors', 'last_login')
    op.drop_column('inspectors', 'can_login')
    op.drop_column('inspectors', 'password_hash')
    op.drop_column('inspectors', 'username')


def _create_default_roles_and_permissions():
    """Create default roles and permissions"""
    
    # Create roles
    roles = [
        {'id': 1, 'name': 'Admin', 'description': 'Administrator with full access'},
        {'id': 2, 'name': 'PSVInspector', 'description': 'Inspector for pressure safety valves'},
        {'id': 3, 'name': 'CorrosionInspector', 'description': 'Inspector for corrosion monitoring'},
        {'id': 4, 'name': 'PSVApprover', 'description': 'Can approve PSV calibration reports'},
        {'id': 5, 'name': 'CorrosionApprover', 'description': 'Can approve corrosion analysis reports'},
        {'id': 6, 'name': 'LiftingEquipmentOperator', 'description': 'Operator for lifting equipment tests'},
        {'id': 7, 'name': 'PSVOperator', 'description': 'Operator for PSV tests'}
    ]
    
    op.bulk_insert(sa.table('roles', 
        sa.column('id', sa.Integer),
        sa.column('name', sa.String),
        sa.column('description', sa.String)
    ), roles)
    
    # Create permissions
    permissions = [
        # Admin permissions
        {'id': 1, 'name': 'admin_access', 'resource': 'admin', 'action': 'access', 'description': 'Access admin area'},
        {'id': 2, 'name': 'inspectors_create', 'resource': 'inspectors', 'action': 'create', 'description': 'Create inspectors'},
        {'id': 3, 'name': 'inspectors_read', 'resource': 'inspectors', 'action': 'read', 'description': 'Read inspector details'},
        {'id': 4, 'name': 'inspectors_update', 'resource': 'inspectors', 'action': 'update', 'description': 'Update inspectors'},
        {'id': 5, 'name': 'inspectors_delete', 'resource': 'inspectors', 'action': 'delete', 'description': 'Delete inspectors'},
        
        # PSV permissions
        {'id': 6, 'name': 'psv_read', 'resource': 'psv', 'action': 'read', 'description': 'Read PSV data'},
        {'id': 7, 'name': 'psv_create', 'resource': 'psv', 'action': 'create', 'description': 'Create PSV records'},
        {'id': 8, 'name': 'psv_update', 'resource': 'psv', 'action': 'update', 'description': 'Update PSV records'},
        
        # Calibration permissions
        {'id': 9, 'name': 'calibration_read', 'resource': 'calibration', 'action': 'read', 'description': 'Read calibration data'},
        {'id': 10, 'name': 'calibration_create', 'resource': 'calibration', 'action': 'create', 'description': 'Create calibration records'},
        {'id': 11, 'name': 'calibration_approve', 'resource': 'calibration', 'action': 'approve', 'description': 'Approve calibration records'},
        
        # Corrosion permissions
        {'id': 12, 'name': 'corrosion_read', 'resource': 'corrosion', 'action': 'read', 'description': 'Read corrosion data'},
        {'id': 13, 'name': 'corrosion_create', 'resource': 'corrosion', 'action': 'create', 'description': 'Create corrosion records'},
        {'id': 14, 'name': 'corrosion_update', 'resource': 'corrosion', 'action': 'update', 'description': 'Update corrosion records'},
        {'id': 15, 'name': 'corrosion_approve', 'resource': 'corrosion', 'action': 'approve', 'description': 'Approve corrosion analysis'}
    ]
    
    op.bulk_insert(sa.table('permissions', 
        sa.column('id', sa.Integer),
        sa.column('name', sa.String),
        sa.column('resource', sa.String),
        sa.column('action', sa.String),
        sa.column('description', sa.String)
    ), permissions)
    
    # Assign permissions to roles
    role_permissions = []
    
    # Admin has all permissions
    for i in range(1, 16):
        role_permissions.append({'role_id': 1, 'permission_id': i})
    
    # PSV Inspector permissions
    for perm_id in [6, 7, 8, 9, 10]:
        role_permissions.append({'role_id': 2, 'permission_id': perm_id})
    
    # Corrosion Inspector permissions
    for perm_id in [12, 13, 14]:
        role_permissions.append({'role_id': 3, 'permission_id': perm_id})
    
    # PSV Approver permissions
    for perm_id in [6, 9, 11]:
        role_permissions.append({'role_id': 4, 'permission_id': perm_id})
    
    # Corrosion Approver permissions
    for perm_id in [12, 15]:
        role_permissions.append({'role_id': 5, 'permission_id': perm_id})
    
    # Lifting Equipment Operator permissions
    role_permissions.append({'role_id': 6, 'permission_id': 6})  # Basic PSV read permission
    
    # PSV Operator permissions
    for perm_id in [6, 9, 10]:
        role_permissions.append({'role_id': 7, 'permission_id': perm_id})
    
    op.bulk_insert(sa.table('role_permissions', 
        sa.column('role_id', sa.Integer),
        sa.column('permission_id', sa.Integer)
    ), role_permissions)