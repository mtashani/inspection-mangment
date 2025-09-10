import pytest
from datetime import date, datetime
from app.domains.daily_report.models.report import DailyReport

class TestDailyReport:
    """Test cases for simplified DailyReport model"""
    
    def test_create_daily_report_with_required_fields(self):
        """Test creating daily report with required fields"""
        daily_report = DailyReport(
            inspection_id=1,
            report_date=date(2024, 3, 15),
            description="Daily progress report for pressure vessel inspection. Completed visual inspection of external surfaces."
        )
        
        assert daily_report.inspection_id == 1
        assert daily_report.report_date == date(2024, 3, 15)
        assert daily_report.description == "Daily progress report for pressure vessel inspection. Completed visual inspection of external surfaces."
        assert daily_report.inspectors is None  # Default None
    
    def test_daily_report_with_attachments(self):
        """Test creating daily report with attachments"""
        daily_report = DailyReport(
            inspection_id=2,
            report_date=date(2024, 3, 16),
            description="Inspection progress with photo documentation.",
            attachments=[
                "/uploads/photos/vessel_001.jpg",
                "/uploads/photos/vessel_002.jpg",
                "/uploads/documents/measurement_log.pdf"
            ]
        )
        
        assert len(daily_report.attachments) == 3
        assert "/uploads/photos/vessel_001.jpg" in daily_report.attachments
        assert "/uploads/photos/vessel_002.jpg" in daily_report.attachments
        assert "/uploads/documents/measurement_log.pdf" in daily_report.attachments
    
    def test_daily_report_timestamps(self):
        """Test that daily report has proper timestamp fields"""
        daily_report = DailyReport(
            inspection_id=3,
            report_date=date(2024, 3, 17),
            description="Test report for timestamp validation."
        )
        
        # Timestamps should be set automatically
        assert daily_report.created_at is not None
        assert daily_report.updated_at is not None
        assert isinstance(daily_report.created_at, datetime)
        assert isinstance(daily_report.updated_at, datetime)
    
    def test_daily_report_different_dates(self):
        """Test daily reports with different dates"""
        dates = [
            date(2024, 1, 1),
            date(2024, 6, 15),
            date(2024, 12, 31)
        ]
        
        for i, report_date in enumerate(dates):
            daily_report = DailyReport(
                inspection_id=i + 1,
                report_date=report_date,
                description=f"Report for {report_date.strftime('%Y-%m-%d')}"
            )
            
            assert daily_report.report_date == report_date
            assert str(report_date) in daily_report.description
    
    def test_daily_report_long_description(self):
        """Test daily report with detailed description"""
        long_description = """
        Daily inspection report for Heat Exchanger HE-001:
        
        Morning Activities:
        - Completed external visual inspection
        - Checked all flanges and connections
        - Verified pressure gauge readings
        
        Afternoon Activities:
        - Performed thickness measurements at 12 locations
        - Documented all readings in measurement log
        - Took photographs of critical areas
        
        Findings:
        - All measurements within acceptable limits
        - Minor corrosion noted on support bracket (non-critical)
        - Pressure readings normal
        
        Next Day Plan:
        - Continue with internal inspection
        - Prepare for NDT testing
        """
        
        daily_report = DailyReport(
            inspection_id=4,
            report_date=date(2024, 4, 1),
            description=long_description.strip()
        )
        
        assert "Heat Exchanger HE-001" in daily_report.description
        assert "thickness measurements" in daily_report.description
        assert "NDT testing" in daily_report.description
    
    def test_daily_report_multiple_inspections(self):
        """Test daily reports for different inspections"""
        inspection_ids = [101, 102, 103, 104, 105]
        
        for inspection_id in inspection_ids:
            daily_report = DailyReport(
                inspection_id=inspection_id,
                report_date=date(2024, 5, 1),
                description=f"Daily report for inspection {inspection_id}"
            )
            
            assert daily_report.inspection_id == inspection_id
    
    def test_daily_report_with_inspectors_text(self):
        """Test daily report with inspectors as text"""
        daily_report = DailyReport(
            inspection_id=8,
            report_date=date(2024, 3, 20),
            description="Daily report with inspector team",
            inspectors="احمد رضایی، محمد احمدی، علی محمدی"
        )
        
        assert daily_report.inspectors == "احمد رضایی، محمد احمدی، علی محمدی"
        assert "احمد رضایی" in daily_report.inspectors
        assert "محمد احمدی" in daily_report.inspectors
        assert "علی محمدی" in daily_report.inspectors
    
    def test_daily_report_single_inspector(self):
        """Test daily report with single inspector"""
        daily_report = DailyReport(
            inspection_id=9,
            report_date=date(2024, 3, 21),
            description="Daily report with single inspector",
            inspectors="سرپرست بازرسی - حسن کریمی"
        )
        
        assert daily_report.inspectors == "سرپرست بازرسی - حسن کریمی"
    
    def test_daily_report_without_inspectors(self):
        """Test daily report without inspectors specified"""
        daily_report = DailyReport(
            inspection_id=10,
            report_date=date(2024, 3, 22),
            description="Daily report without inspectors"
        )
        
        assert daily_report.inspectors is None

class TestDailyReportInspector:
    """Test cases for DailyReportInspector relationship model"""
    
    def test_create_daily_report_inspector_relationship(self):
        """Test creating daily report inspector relationship"""
        relationship = DailyReportInspector(
            daily_report_id=1,
            inspector_id=101
        )
        
        assert relationship.daily_report_id == 1
        assert relationship.inspector_id == 101
        assert relationship.role_in_report is None  # Default None
    
    def test_daily_report_inspector_with_role(self):
        """Test creating relationship with inspector role"""
        relationship = DailyReportInspector(
            daily_report_id=2,
            inspector_id=102,
            role_in_report="Lead Inspector"
        )
        
        assert relationship.daily_report_id == 2
        assert relationship.inspector_id == 102
        assert relationship.role_in_report == "Lead Inspector"
    
    def test_daily_report_inspector_different_roles(self):
        """Test different inspector roles in daily reports"""
        roles = [
            "Lead Inspector",
            "Assistant Inspector", 
            "NDT Specialist",
            "Safety Observer",
            "Documentation Specialist"
        ]
        
        for i, role in enumerate(roles):
            relationship = DailyReportInspector(
                daily_report_id=1,
                inspector_id=200 + i,
                role_in_report=role
            )
            
            assert relationship.role_in_report == role
            assert relationship.inspector_id == 200 + i
    
    def test_daily_report_inspector_timestamps(self):
        """Test that relationship has proper timestamp fields"""
        relationship = DailyReportInspector(
            daily_report_id=3,
            inspector_id=103
        )
        
        # Timestamps should be set automatically
        assert relationship.assigned_at is not None
        assert relationship.created_at is not None
        assert isinstance(relationship.assigned_at, datetime)
        assert isinstance(relationship.created_at, datetime)
    
    def test_multiple_inspectors_same_report(self):
        """Test multiple inspectors assigned to same daily report"""
        daily_report_id = 5
        inspector_ids = [301, 302, 303]
        roles = ["Lead Inspector", "Assistant", "Specialist"]
        
        relationships = []
        for inspector_id, role in zip(inspector_ids, roles):
            relationship = DailyReportInspector(
                daily_report_id=daily_report_id,
                inspector_id=inspector_id,
                role_in_report=role
            )
            relationships.append(relationship)
        
        # All relationships should have same daily_report_id
        for relationship in relationships:
            assert relationship.daily_report_id == daily_report_id
        
        # Each should have different inspector_id and role
        assert relationships[0].inspector_id == 301
        assert relationships[0].role_in_report == "Lead Inspector"
        assert relationships[1].inspector_id == 302
        assert relationships[1].role_in_report == "Assistant"
        assert relationships[2].inspector_id == 303
        assert relationships[2].role_in_report == "Specialist"

class TestDailyReportIntegration:
    """Integration test cases for DailyReport model"""
    
    def test_daily_report_attachments_json_storage(self):
        """Test that attachments are properly stored as JSON"""
        attachments = [
            "/uploads/2024/03/15/photo1.jpg",
            "/uploads/2024/03/15/photo2.jpg", 
            "/uploads/2024/03/15/measurements.xlsx",
            "/uploads/2024/03/15/report.pdf"
        ]
        
        daily_report = DailyReport(
            inspection_id=6,
            report_date=date(2024, 3, 15),
            description="Report with multiple attachments",
            attachments=attachments
        )
        
        assert len(daily_report.attachments) == 4
        for attachment in attachments:
            assert attachment in daily_report.attachments
    
    def test_daily_report_empty_attachments(self):
        """Test daily report with no attachments"""
        daily_report = DailyReport(
            inspection_id=7,
            report_date=date(2024, 3, 16),
            description="Report without attachments"
        )
        
        assert daily_report.attachments == []
        assert len(daily_report.attachments) == 0