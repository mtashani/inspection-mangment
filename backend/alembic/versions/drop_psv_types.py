"""drop psv types

Revision ID: drop_psv_types
Revises: 231034ea3ec4
Create Date: 2025-02-27 22:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = 'drop_psv_types'
down_revision: Union[str, None] = '231034ea3ec4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Drop existing enum types if they exist
    connection = op.get_bind()
    connection.execute(text('DROP TYPE IF EXISTS psv_status CASCADE'))
    connection.execute(text('DROP TYPE IF EXISTS work_maintenance CASCADE'))
    connection.execute(text('DROP TYPE IF EXISTS test_medium CASCADE'))

def downgrade() -> None:
    pass