"""initial migration

Revision ID: 231034ea3ec4
Revises: 
Create Date: 2024-02-09 01:33:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '231034ea3ec4'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create tables without enum dependencies
    op.create_table(
        'equipment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('equipment_code', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('installation_date', sa.Date(), nullable=False),
        sa.Column('operating_pressure', sa.Float(), nullable=False),
        sa.Column('operating_temperature', sa.Float(), nullable=False),
        sa.Column('material', sa.String(), nullable=False),
        sa.Column('degradation_mechanism', sa.String(), nullable=False),
        sa.Column('initial_thickness', sa.Float(), nullable=False),
        sa.Column('min_thickness', sa.Float(), nullable=False),
        sa.Column('safety_factor', sa.Float(), nullable=False),
        sa.Column('max_inspection_interval', sa.Integer(), nullable=False),
        sa.Column('risk_level', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_equipment_equipment_code'), 'equipment', ['equipment_code'], unique=True)
    op.create_index(op.f('ix_equipment_location'), 'equipment', ['location'], unique=False)

    op.create_table(
        'inspector',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('inspector_type', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'inspection',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('equipment_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('final_description', sa.String(), nullable=True),
        sa.Column('measured_thickness', sa.Float(), nullable=True),
        sa.Column('report_file_path', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'dailyreport',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('inspection_id', sa.Integer(), nullable=False),
        sa.Column('report_date', sa.DateTime(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['inspection_id'], ['inspection.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'dailyreportinspector',
        sa.Column('daily_report_id', sa.Integer(), nullable=False),
        sa.Column('inspector_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['daily_report_id'], ['dailyreport.id'], ),
        sa.ForeignKeyConstraint(['inspector_id'], ['inspector.id'], ),
        sa.PrimaryKeyConstraint('daily_report_id', 'inspector_id')
    )

def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('dailyreportinspector')
    op.drop_table('dailyreport')
    op.drop_table('inspection')
    op.drop_table('inspector')
    op.drop_index(op.f('ix_equipment_location'), table_name='equipment')
    op.drop_index(op.f('ix_equipment_equipment_code'), table_name='equipment')
    op.drop_table('equipment')