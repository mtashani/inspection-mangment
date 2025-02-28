"""add PSV tables

Revision ID: add_psv_tables
Revises: drop_psv_types
Create Date: 2025-02-27 22:05:00.000000

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy import Enum, text
from sqlalchemy.dialects import postgresql
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'add_psv_tables'
down_revision: Union[str, None] = 'drop_psv_types'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create enum types
    psv_status_enum = postgresql.ENUM('Main', 'Spare', name='psv_status', create_type=True)
    work_maintenance_enum = postgresql.ENUM('Adjust', 'Cleaning', 'Lapping', name='workmaintenance', create_type=True)
    test_medium_enum = postgresql.ENUM('Nitrogen', 'Air', 'Steam', 'Water', name='testmedium', create_type=True)

    # Create psv table
    op.create_table(
        'psv',
        sa.Column('tag_number', sa.String(), nullable=False),
        sa.Column('unique_no', sa.String(), nullable=False),
        sa.Column('status', psv_status_enum, nullable=False),
        sa.Column('frequency', sa.Integer(), nullable=False),
        sa.Column('last_calibration_date', sa.DateTime(), nullable=False),
        sa.Column('expire_date', sa.DateTime(), nullable=False),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('train', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('serial_no', sa.String(), nullable=False),
        sa.Column('set_pressure', sa.Float(), nullable=False),
        sa.Column('cdtp', sa.Float(), nullable=False),
        sa.Column('back_pressure', sa.Float(), nullable=False),
        sa.Column('nps', sa.String(), nullable=False),
        sa.Column('inlet_size', sa.String(), nullable=False),
        sa.Column('inlet_rating', sa.String(), nullable=False),
        sa.Column('outlet_size', sa.String(), nullable=False),
        sa.Column('outlet_rating', sa.String(), nullable=False),
        sa.Column('p_and_id', sa.String(), nullable=False),
        sa.Column('line_number', sa.String(), nullable=False),
        sa.Column('service', sa.String(), nullable=False),
        sa.Column('data_sheet_no', sa.String(), nullable=False),
        sa.Column('manufacturer', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.PrimaryKeyConstraint('tag_number'),
        sa.UniqueConstraint('unique_no')
    )

    op.create_index(op.f('ix_psv_unique_no'), 'psv', ['unique_no'], unique=True)

    # Create calibration table
    op.create_table(
        'calibration',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tag_number', sa.String(), nullable=False),
        sa.Column('calibration_date', sa.DateTime(), nullable=False),
        sa.Column('work_maintenance', work_maintenance_enum, nullable=False),
        sa.Column('change_parts', sa.String(), nullable=True),
        sa.Column('test_medium', test_medium_enum, nullable=False),
        sa.Column('inspector', sa.String(), nullable=False),
        sa.Column('test_operator', sa.String(), nullable=False),
        sa.Column('general_condition', sa.String(), nullable=True),
        sa.Column('approved_by', sa.String(), nullable=False),
        sa.Column('work_no', sa.String(), nullable=False),
        sa.Column('pre_repair_pop_test', sa.Float(), nullable=True),
        sa.Column('pre_repair_leak_test', sa.Float(), nullable=True),
        sa.Column('post_repair_pop_test', sa.Float(), nullable=False),
        sa.Column('post_repair_leak_test', sa.Float(), nullable=False),
        sa.Column('body_condition_score', sa.Integer(), nullable=True),
        sa.Column('body_condition_notes', sa.String(), nullable=True),
        sa.Column('internal_parts_score', sa.Integer(), nullable=True),
        sa.Column('internal_parts_notes', sa.String(), nullable=True),
        sa.Column('seat_plug_condition_score', sa.Integer(), nullable=True),
        sa.Column('seat_plug_notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['tag_number'], ['psv.tag_number'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('body_condition_score BETWEEN 1 AND 5'),
        sa.CheckConstraint('internal_parts_score BETWEEN 1 AND 5'),
        sa.CheckConstraint('seat_plug_condition_score BETWEEN 1 AND 5')
    )

    # Create rbi_configuration table
    op.create_table(
        'rbi_configuration',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, default=True),
        sa.Column('settings', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('level BETWEEN 1 AND 4')
    )

    # Create service risk category table
    op.create_table(
        'service_risk_category',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_type', sa.String(), nullable=False),
        sa.Column('cof_score', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('service_type'),
        sa.CheckConstraint('cof_score BETWEEN 1 AND 5')
    )
    op.create_index(op.f('ix_service_risk_category_service_type'), 'service_risk_category', ['service_type'], unique=True)

def downgrade() -> None:
    # Drop tables
    op.drop_table('service_risk_category')
    op.drop_table('rbi_configuration')
    op.drop_table('calibration')
    op.drop_table('psv')

    # Drop enum types
    connection = op.get_bind()
    connection.execute(text('DROP TYPE IF EXISTS psv_status CASCADE'))
    connection.execute(text('DROP TYPE IF EXISTS workmaintenance CASCADE'))
    connection.execute(text('DROP TYPE IF EXISTS testmedium CASCADE'))