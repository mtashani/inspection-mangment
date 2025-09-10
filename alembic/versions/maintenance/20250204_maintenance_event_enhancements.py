"""Add maintenance event enhancements

Revision ID: 20250204_maintenance_event_enhancements
Revises: 
Create Date: 2025-02-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250204_maintenance_event_enhancements'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    maintenance_event_category_enum = postgresql.ENUM(
        'Simple', 'Complex', 
        name='maintenanceeventcategory'
    )
    maintenance_event_category_enum.create(op.get_bind())
    
    inspection_plan_status_enum = postgresql.ENUM(
        'Planned', 'InProgress', 'Completed', 'Cancelled',
        name='inspectionplanstatus'
    )
    inspection_plan_status_enum.create(op.get_bind())
    
    inspection_priority_enum = postgresql.ENUM(
        'Low', 'Medium', 'High', 'Critical',
        name='inspectionpriority'
    )
    inspection_priority_enum.create(op.get_bind())
    
    # Add event_category column to maintenance_events table
    op.add_column('maintenance_events', 
                  sa.Column('event_category', 
                           sa.Enum('Simple', 'Complex', name='maintenanceeventcategory'),
                           nullable=False,
                           server_default='Simple'))
    
    # Create inspection_plans table
    op.create_table('inspection_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('maintenance_event_id', sa.Integer(), nullable=True),
        sa.Column('maintenance_sub_event_id', sa.Integer(), nullable=True),
        sa.Column('equipment_tag', sa.String(), nullable=False),
        sa.Column('requester', sa.String(), nullable=False),
        sa.Column('priority', sa.Enum('Low', 'Medium', 'High', 'Critical', name='inspectionpriority'), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('Planned', 'InProgress', 'Completed', 'Cancelled', name='inspectionplanstatus'), nullable=False),
        sa.Column('planned_start_date', sa.Date(), nullable=True),
        sa.Column('planned_end_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['maintenance_event_id'], ['maintenance_events.id'], ),
        sa.ForeignKeyConstraint(['maintenance_sub_event_id'], ['maintenance_sub_events.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint(
            '(maintenance_event_id IS NOT NULL AND maintenance_sub_event_id IS NULL) OR '
            '(maintenance_event_id IS NULL AND maintenance_sub_event_id IS NOT NULL)',
            name='check_event_or_sub_event'
        )
    )
    
    # Create indexes
    op.create_index(op.f('ix_inspection_plans_equipment_tag'), 'inspection_plans', ['equipment_tag'], unique=False)
    
    # Add inspection_plan_id column to inspections table
    op.add_column('inspections', 
                  sa.Column('inspection_plan_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'inspections', 'inspection_plans', ['inspection_plan_id'], ['id'])


def downgrade() -> None:
    # Remove foreign key and column from inspections table
    op.drop_constraint(None, 'inspections', type_='foreignkey')
    op.drop_column('inspections', 'inspection_plan_id')
    
    # Drop inspection_plans table
    op.drop_index(op.f('ix_inspection_plans_equipment_tag'), table_name='inspection_plans')
    op.drop_table('inspection_plans')
    
    # Remove event_category column from maintenance_events table
    op.drop_column('maintenance_events', 'event_category')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS inspectionpriority')
    op.execute('DROP TYPE IF EXISTS inspectionplanstatus')
    op.execute('DROP TYPE IF EXISTS maintenanceeventcategory')