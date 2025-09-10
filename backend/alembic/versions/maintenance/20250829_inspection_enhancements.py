\"\"\"Add actual dates to inspections and status history table

Revision ID: 20250829_inspection_enhancements
Revises: 
Create Date: 2025-08-29 00:00:00.000000
\"\"\"
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '20250829_inspection_enhancements'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add actual_start_date and actual_end_date to inspections table
    op.add_column('inspections', sa.Column('actual_start_date', sa.Date(), nullable=True))
    op.add_column('inspections', sa.Column('actual_end_date', sa.Date(), nullable=True))
    
    # Create status_history table
    op.create_table('status_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('from_status', sa.String(), nullable=True),
        sa.Column('to_status', sa.String(), nullable=False),
        sa.Column('changed_by', sa.String(), nullable=False),
        sa.Column('changed_at', sa.DateTime(), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index('ix_status_history_entity', 'status_history', ['entity_type', 'entity_id'])
    op.create_index('ix_status_history_changed_at', 'status_history', ['changed_at'])
    
    # Add comments to explain the fields
    op.execute(
        \"COMMENT ON COLUMN inspections.actual_start_date IS 'When inspection actually started (vs planned start_date)'\"
    )
    op.execute(
        \"COMMENT ON COLUMN inspections.actual_end_date IS 'When inspection actually completed (vs planned end_date)'\"
    )
    op.execute(
        \"COMMENT ON TABLE status_history IS 'Audit trail for all entity status changes'\"
    )

def downgrade():
    # Remove the new columns and table
    op.drop_index('ix_status_history_changed_at', table_name='status_history')
    op.drop_index('ix_status_history_entity', table_name='status_history')
    op.drop_table('status_history')
    op.drop_column('inspections', 'actual_end_date')
    op.drop_column('inspections', 'actual_start_date')