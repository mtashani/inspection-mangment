"""Tests for FinalReport model"""

import pytest
import sys
import os
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../'))

from app.domains.report.models.final_report import FinalReport
from app.domains.report.models.enums import ReportStatus


class TestFinalReportModel:
    """Test cases for FinalReport model"""
    
    def test_final_report_creation(self):
        """Test basic final report creation"""
        report = FinalReport(
            inspection_id=1,
            template_id=1,
            created_by=123,
            report_serial_number="RPT-2025-001"
        )
        
        assert report.inspection_id == 1
        assert report.template_id == 1
        assert report.created_by == 123
        assert report.report_serial_number == "RPT-2025-001"
        assert report.id is None  # Not set until saved
    
    def test_final_report_default_values(self):
        """Test default values for final report"""
        report = FinalReport(
            inspection_id=1,
            template_id=1
        )
        
        assert report.inspection_id == 1
        assert report.template_id == 1
        assert report.created_by is None
        assert report.report_serial_number is None
        assert report.status == ReportStatus.DRAFT
        assert isinstance(report.created_at, datetime)
        assert isinstance(report.updated_at, datetime)
    
    def test_final_report_status_enum(self):
        """Test report status enumeration"""
        # Test all valid status values
        valid_statuses = [
            ReportStatus.DRAFT,
            ReportStatus.SUBMITTED,
            ReportStatus.APPROVED,
            ReportStatus.REJECTED
        ]
        
        for status in valid_statuses:
            report = FinalReport(
                inspection_id=1,
                template_id=1,
                status=status
            )
            assert report.status == status
    
    def test_final_report_workflow_progression(self):
        """Test typical report status workflow"""
        report = FinalReport(
            inspection_id=1,
            template_id=1
        )
        
        # Start as draft
        assert report.status == ReportStatus.DRAFT
        
        # Submit for review
        report.status = ReportStatus.SUBMITTED
        assert report.status == ReportStatus.SUBMITTED
        
        # Approve
        report.status = ReportStatus.APPROVED
        assert report.status == ReportStatus.APPROVED
    
    def test_final_report_foreign_keys(self):
        """Test foreign key relationships"""
        report = FinalReport(
            inspection_id=456,
            template_id=789,
            created_by=101
        )
        
        assert report.inspection_id == 456
        assert report.template_id == 789
        assert report.created_by == 101
    
    def test_final_report_serial_number_generation(self):
        """Test report serial number handling"""
        # Test with custom serial number
        report1 = FinalReport(
            inspection_id=1,
            template_id=1,
            report_serial_number="CUSTOM-001"
        )
        assert report1.report_serial_number == "CUSTOM-001"
        
        # Test without serial number (should be None by default)
        report2 = FinalReport(
            inspection_id=1,
            template_id=1
        )
        assert report2.report_serial_number is None
    
    def test_final_report_timestamps(self):
        """Test timestamp handling"""
        report = FinalReport(
            inspection_id=1,
            template_id=1
        )
        
        # Check that timestamps are set
        assert report.created_at is not None
        assert report.updated_at is not None
        assert isinstance(report.created_at, datetime)
        assert isinstance(report.updated_at, datetime)
        
        # Initially, created_at and updated_at should be very close
        time_diff = abs((report.updated_at - report.created_at).total_seconds())
        assert time_diff < 1  # Less than 1 second difference
    
    def test_final_report_metadata_fields(self):
        """Test report metadata fields"""
        report = FinalReport(
            inspection_id=1,
            template_id=1,
            created_by=999,
            report_serial_number="META-TEST-001",
            status=ReportStatus.SUBMITTED
        )
        
        # Verify all metadata is properly stored
        assert report.inspection_id == 1
        assert report.template_id == 1
        assert report.created_by == 999
        assert report.report_serial_number == "META-TEST-001"
        assert report.status == ReportStatus.SUBMITTED
    
    def test_final_report_optional_user_tracking(self):
        """Test optional user tracking"""
        # Report without user tracking
        report1 = FinalReport(
            inspection_id=1,
            template_id=1
        )
        assert report1.created_by is None
        
        # Report with user tracking
        report2 = FinalReport(
            inspection_id=1,
            template_id=1,
            created_by=555
        )
        assert report2.created_by == 555
    
    def test_final_report_multiple_reports_per_inspection(self):
        """Test multiple reports for same inspection"""
        # Create multiple reports for the same inspection
        reports = []
        inspection_id = 100
        
        for i in range(3):
            report = FinalReport(
                inspection_id=inspection_id,
                template_id=i + 1,  # Different templates
                report_serial_number=f"RPT-{inspection_id}-{i + 1}"
            )
            reports.append(report)
        
        # Verify all reports belong to same inspection
        for report in reports:
            assert report.inspection_id == inspection_id
        
        # Verify they have different templates and serial numbers
        assert reports[0].template_id == 1
        assert reports[1].template_id == 2
        assert reports[2].template_id == 3
        
        assert reports[0].report_serial_number == "RPT-100-1"
        assert reports[1].report_serial_number == "RPT-100-2"
        assert reports[2].report_serial_number == "RPT-100-3"