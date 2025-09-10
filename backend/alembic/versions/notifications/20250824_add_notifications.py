"""
Migration script to add notification system tables.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
import datetime

# revision identifiers, used by Alembic.
revision = '20250824_add_notifications'
down_revision = None
depends_on = None


def upgrade():
    """
    Upgrade the database to include notification system tables.
    """
    
    # 1. Create notifications table
    op.create_table(
        'notifications',
        Column('id', Integer, primary_key=True),
        Column('title', String(255), nullable=False),
        Column('message', Text, nullable=False),
        Column('type', String(50), nullable=False),
        Column('priority', String(20), nullable=False, server_default='medium'),
        Column('status', String(20), nullable=False, server_default='unread'),
        Column('recipient_id', Integer, ForeignKey('inspectors.id'), nullable=True),
        Column('recipient_type', String(50), nullable=True, server_default='inspector'),
        Column('related_item_id', String(100), nullable=True),
        Column('related_item_type', String(50), nullable=True),
        Column('action_url', String(500), nullable=True),
        Column('extra_data', JSON, nullable=True),
        Column('created_at', DateTime, nullable=False, server_default=func.now()),
        Column('read_at', DateTime, nullable=True),
        Column('expires_at', DateTime, nullable=True),
    )\n    \n    # Create indexes for notifications\n    op.create_index('ix_notifications_recipient_id', 'notifications', ['recipient_id'])\n    op.create_index('ix_notifications_status', 'notifications', ['status'])\n    op.create_index('ix_notifications_type', 'notifications', ['type'])\n    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])\n    op.create_index('ix_notifications_priority', 'notifications', ['priority'])\n    \n    # 2. Create notification_preferences table\n    op.create_table(\n        'notification_preferences',\n        Column('id', Integer, primary_key=True),\n        Column('inspector_id', Integer, ForeignKey('inspectors.id'), nullable=False),\n        \n        # Notification type preferences\n        Column('event_created', Boolean, nullable=False, server_default='true'),\n        Column('event_updated', Boolean, nullable=False, server_default='true'),\n        Column('event_deleted', Boolean, nullable=False, server_default='true'),\n        Column('event_status_changed', Boolean, nullable=False, server_default='true'),\n        Column('inspection_created', Boolean, nullable=False, server_default='true'),\n        Column('inspection_completed', Boolean, nullable=False, server_default='true'),\n        Column('calibration_due', Boolean, nullable=False, server_default='true'),\n        Column('calibration_overdue', Boolean, nullable=False, server_default='true'),\n        Column('rbi_change', Boolean, nullable=False, server_default='true'),\n        Column('psv_update', Boolean, nullable=False, server_default='true'),\n        Column('system_alert', Boolean, nullable=False, server_default='true'),\n        Column('task_complete', Boolean, nullable=False, server_default='true'),\n        \n        # Delivery preferences\n        Column('web_notifications', Boolean, nullable=False, server_default='true'),\n        Column('email_notifications', Boolean, nullable=False, server_default='false'),\n        Column('push_notifications', Boolean, nullable=False, server_default='false'),\n        \n        # Timing preferences\n        Column('calibration_reminder_days', Integer, nullable=False, server_default='30'),\n        Column('daily_summary', Boolean, nullable=False, server_default='true'),\n        Column('summary_time', String(10), nullable=False, server_default='09:00'),\n        \n        # Sound settings\n        Column('sound_enabled', Boolean, nullable=False, server_default='true'),\n        Column('sound_volume', String(10), nullable=False, server_default='medium'),\n        \n        # Timestamps\n        Column('created_at', DateTime, nullable=False, server_default=func.now()),\n        Column('updated_at', DateTime, nullable=False, server_default=func.now()),\n    )\n    \n    # Create indexes for notification_preferences\n    op.create_index('ix_notification_preferences_inspector_id', 'notification_preferences', ['inspector_id'])\n    \n    # Ensure unique preference record per inspector\n    op.create_unique_constraint('uq_notification_preferences_inspector', 'notification_preferences', ['inspector_id'])\n    \n    print(\"✅ Notification system tables created successfully\")\n\n\ndef downgrade():\n    \"\"\"Downgrade the database by removing notification system tables.\"\"\"\n    \n    # Drop indexes first\n    op.drop_index('ix_notification_preferences_inspector_id', 'notification_preferences')\n    op.drop_index('ix_notifications_priority', 'notifications')\n    op.drop_index('ix_notifications_created_at', 'notifications')\n    op.drop_index('ix_notifications_type', 'notifications')\n    op.drop_index('ix_notifications_status', 'notifications')\n    op.drop_index('ix_notifications_recipient_id', 'notifications')\n    \n    # Drop constraint\n    op.drop_constraint('uq_notification_preferences_inspector', 'notification_preferences')\n    \n    # Drop tables\n    op.drop_table('notification_preferences')\n    op.drop_table('notifications')\n    \n    print(\"✅ Notification system tables removed successfully\")