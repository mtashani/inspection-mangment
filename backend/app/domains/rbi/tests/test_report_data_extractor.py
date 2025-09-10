"""Tests for report data extractor service"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.services.report_data_extractor import (
    ReportDataExtractor,
    InspectionReport,
    TrendAnalysis
)


class TestReportDataExtractor:
    """Test ReportDataExtractor"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.extractor = ReportDataExtractor()
    
    def test_extract_rbi_parameters_with_sample_data(self):
        """Test extracting RBI parameters from sample data"""
        extracted_data = self.extractor.extract_rbi_parameters("V-101")
        
        assert extracted_data.equipment_id == "V-101"
        assert extracted_data.corrosion_rate is not None
        assert extracted_data.corrosion_rate > 0  # Should detect corrosion
        assert len(extracted_data.thickness_measurements) > 0
        assert len(extracted_data.damage_mechanisms) > 0
        assert "General Corrosion" in extracted_data.damage_mechanisms
        assert extracted_data.coating_condition == "moderate"
        assert extracted_data.inspection_quality in ["good", "average", "poor"]
    
    def test_extract_rbi_parameters_no_reports(self):
        """Test extracting RBI parameters with no reports"""
        extracted_data = self.extractor.extract_rbi_parameters("NON-EXISTENT")
        
        assert extracted_data.equipment_id == "NON-EXISTENT"
        assert extracted_data.corrosion_rate is None
        assert len(extracted_data.thickness_measurements) == 0
        assert len(extracted_data.damage_mechanisms) == 0
        assert extracted_data.coating_condition is None
        assert extracted_data.last_inspection_date is None
    
    def test_calculate_corrosion_rate(self):
        """Test corrosion rate calculation"""
        # Create test thickness measurements with known corrosion
        from app.domains.rbi.models.core import ThicknessMeasurement
        
        measurements = [
            ThicknessMeasurement(
                location="Test_Location",
                thickness=15.0,
                measurement_date=datetime(2020, 1, 1),
                minimum_required=10.0
            ),
            ThicknessMeasurement(
                location="Test_Location",
                thickness=14.0,
                measurement_date=datetime(2022, 1, 1),  # 2 years later
                minimum_required=10.0
            ),
            ThicknessMeasurement(
                location="Test_Location",
                thickness=13.0,
                measurement_date=datetime(2024, 1, 1),  # 4 years total
                minimum_required=10.0
            )
        ]
        
        corrosion_rate = self.extractor._calculate_corrosion_rate(measurements)
        
        # Should be approximately 0.5 mm/year (2mm loss over 4 years)
        assert corrosion_rate is not None
        assert 0.4 <= corrosion_rate <= 0.6
    
    def test_calculate_corrosion_rate_insufficient_data(self):
        """Test corrosion rate calculation with insufficient data"""
        from app.domains.rbi.models.core import ThicknessMeasurement
        
        # Only one measurement
        measurements = [
            ThicknessMeasurement(
                location="Test_Location",
                thickness=15.0,
                measurement_date=datetime(2020, 1, 1),
                minimum_required=10.0
            )
        ]
        
        corrosion_rate = self.extractor._calculate_corrosion_rate(measurements)
        assert corrosion_rate is None
    
    def test_extract_coating_condition(self):
        """Test coating condition extraction"""
        # Test excellent coating
        report_excellent = InspectionReport(
            report_id="TEST-001",
            equipment_id="TEST",
            inspection_date=datetime.now(),
            inspector="Test Inspector",
            report_type="Test",
            findings=[],
            thickness_data=[],
            general_observations="Equipment has excellent coating condition",
            recommendations=[]
        )
        
        condition = self.extractor._extract_coating_condition(report_excellent)
        assert condition == "excellent"
        
        # Test no coating
        report_none = InspectionReport(
            report_id="TEST-002",
            equipment_id="TEST",
            inspection_date=datetime.now(),
            inspector="Test Inspector",
            report_type="Test",
            findings=[],
            thickness_data=[],
            general_observations="Coating failed and bare metal exposed",
            recommendations=[]
        )
        
        condition = self.extractor._extract_coating_condition(report_none)
        assert condition == "none"
    
    def test_extract_damage_mechanisms(self):
        """Test damage mechanism extraction"""
        reports = [
            InspectionReport(
                report_id="TEST-001",
                equipment_id="TEST",
                inspection_date=datetime.now(),
                inspector="Test Inspector",
                report_type="Test",
                findings=[
                    {
                        "type": "Corrosion",
                        "description": "General corrosion observed on surface",
                        "severity": "Medium"
                    },
                    {
                        "type": "Pitting",
                        "description": "Localized pitting corrosion detected",
                        "severity": "Low"
                    }
                ],
                thickness_data=[],
                general_observations="Evidence of stress corrosion cracking",
                recommendations=[]
            )
        ]
        
        mechanisms = self.extractor._extract_damage_mechanisms(reports)
        
        assert "General Corrosion" in mechanisms
        assert "Pitting" in mechanisms
        assert "Stress Corrosion Cracking" in mechanisms
    
    def test_assess_inspection_quality(self):
        """Test inspection quality assessment"""
        # High quality report
        good_reports = [
            InspectionReport(
                report_id="GOOD-001",
                equipment_id="TEST",
                inspection_date=datetime.now(),
                inspector="Test Inspector",
                report_type="Comprehensive",
                findings=[{"type": "Test", "severity": "Low", "description": "Test finding"}],
                thickness_data=[{"location": "Test", "thickness": 10.0}],
                general_observations="Detailed observations",
                recommendations=["Test recommendation"]
            )
        ]
        
        quality = self.extractor._assess_inspection_quality(good_reports)
        assert quality == "good"
        
        # Poor quality report
        poor_reports = [
            InspectionReport(
                report_id="POOR-001",
                equipment_id="TEST",
                inspection_date=datetime.now(),
                inspector="Test Inspector",
                report_type="Basic",
                findings=[],
                thickness_data=[],
                general_observations="",
                recommendations=[]
            )
        ]
        
        quality = self.extractor._assess_inspection_quality(poor_reports)
        assert quality == "poor"
    
    def test_add_inspection_report(self):
        """Test adding inspection report"""
        new_report = InspectionReport(
            report_id="NEW-001",
            equipment_id="NEW-EQUIPMENT",
            inspection_date=datetime.now(),
            inspector="Test Inspector",
            report_type="Test",
            findings=[],
            thickness_data=[],
            general_observations="Test report",
            recommendations=[]
        )
        
        self.extractor.add_inspection_report(new_report)
        
        # Verify it was added
        reports = self.extractor.get_report_history("NEW-EQUIPMENT")
        assert len(reports) == 1
        assert reports[0].report_id == "NEW-001"
    
    def test_get_latest_report(self):
        """Test getting latest report"""
        # Add multiple reports with different dates
        equipment_id = "MULTI-REPORT-TEST"
        
        older_report = InspectionReport(
            report_id="OLD-001",
            equipment_id=equipment_id,
            inspection_date=datetime(2020, 1, 1),
            inspector="Test Inspector",
            report_type="Test",
            findings=[],
            thickness_data=[],
            general_observations="Older report",
            recommendations=[]
        )
        
        newer_report = InspectionReport(
            report_id="NEW-001",
            equipment_id=equipment_id,
            inspection_date=datetime(2024, 1, 1),
            inspector="Test Inspector",
            report_type="Test",
            findings=[],
            thickness_data=[],
            general_observations="Newer report",
            recommendations=[]
        )
        
        self.extractor.add_inspection_report(older_report)
        self.extractor.add_inspection_report(newer_report)
        
        latest = self.extractor.get_latest_report(equipment_id)
        assert latest is not None
        assert latest.report_id == "NEW-001"
    
    def test_calculate_historical_trends(self):
        """Test historical trend calculation"""
        trends = self.extractor.calculate_historical_trends("V-101", "thickness")
        
        # Should have trends for different locations
        assert len(trends) > 0
        
        for trend in trends:
            assert isinstance(trend, TrendAnalysis)
            assert trend.parameter.startswith("thickness_")
            assert trend.trend_direction in ["increasing", "decreasing", "stable"]
            assert trend.confidence >= 0
            assert trend.data_points >= 0
            assert trend.time_span_years >= 0
    
    def test_thickness_trend_analysis(self):
        """Test thickness trend analysis with known data"""
        # Create test reports with declining thickness
        test_equipment_id = "TREND-TEST"
        
        reports = []
        base_thickness = 15.0
        
        for i in range(5):  # 5 reports over 4 years
            date = datetime(2020 + i, 1, 1)
            thickness = base_thickness - (i * 0.5)  # 0.5mm loss per year
            
            report = InspectionReport(
                report_id=f"TREND-{i+1:03d}",
                equipment_id=test_equipment_id,
                inspection_date=date,
                inspector="Trend Tester",
                report_type="Trend Test",
                findings=[],
                thickness_data=[
                    {"location": "Test_Location", "thickness": thickness, "minimum_required": 10.0}
                ],
                general_observations="Trend test report",
                recommendations=[]
            )
            
            self.extractor.add_inspection_report(report)
        
        trends = self.extractor.calculate_historical_trends(test_equipment_id, "thickness")
        
        assert len(trends) == 1
        trend = trends[0]
        
        assert trend.trend_direction == "decreasing"
        assert 0.4 <= trend.trend_rate <= 0.6  # Should be around 0.5 mm/year
        assert trend.confidence > 0.8  # Should be high confidence for linear data
        assert trend.data_points == 5
    
    def test_extract_with_custom_reports(self):
        """Test extraction with custom report data"""
        custom_reports = [
            InspectionReport(
                report_id="CUSTOM-001",
                equipment_id="CUSTOM-TEST",
                inspection_date=datetime(2024, 1, 1),
                inspector="Custom Tester",
                report_type="Custom",
                findings=[
                    {
                        "type": "Erosion",
                        "severity": "High",
                        "description": "Severe erosion damage",
                        "location": "Inlet"
                    }
                ],
                thickness_data=[
                    {"location": "Shell", "thickness": 8.0, "minimum_required": 6.0}
                ],
                general_observations="Equipment shows signs of erosion and no coating protection",
                recommendations=["Immediate repair required"]
            )
        ]
        
        extracted = self.extractor.extract_rbi_parameters("CUSTOM-TEST", custom_reports)
        
        assert extracted.equipment_id == "CUSTOM-TEST"
        assert len(extracted.thickness_measurements) == 1
        assert extracted.thickness_measurements[0].thickness == 8.0
        assert "Erosion" in extracted.damage_mechanisms
        assert extracted.coating_condition == "none"
        assert len(extracted.inspection_findings) == 1
        assert extracted.inspection_findings[0].severity == "High"
    
    def test_empty_report_handling(self):
        """Test handling of empty or incomplete reports"""
        incomplete_report = InspectionReport(
            report_id="INCOMPLETE-001",
            equipment_id="INCOMPLETE-TEST",
            inspection_date=datetime.now(),
            inspector="",
            report_type="",
            findings=[],
            thickness_data=[],
            general_observations="",
            recommendations=[]
        )
        
        self.extractor.add_inspection_report(incomplete_report)
        extracted = self.extractor.extract_rbi_parameters("INCOMPLETE-TEST")
        
        # Should handle gracefully
        assert extracted.equipment_id == "INCOMPLETE-TEST"
        assert extracted.corrosion_rate is None
        assert len(extracted.thickness_measurements) == 0
        assert extracted.inspection_quality == "poor"
    
    def test_invalid_thickness_data_handling(self):
        """Test handling of invalid thickness data"""
        invalid_report = InspectionReport(
            report_id="INVALID-001",
            equipment_id="INVALID-TEST",
            inspection_date=datetime.now(),
            inspector="Test",
            report_type="Test",
            findings=[],
            thickness_data=[
                {"location": "Test", "thickness": "invalid", "minimum_required": 10.0},
                {"location": "Test2", "thickness": -5.0, "minimum_required": 10.0},
                {"location": "Test3", "thickness": 12.0, "minimum_required": 10.0}  # Valid
            ],
            general_observations="Test with invalid data",
            recommendations=[]
        )
        
        self.extractor.add_inspection_report(invalid_report)
        extracted = self.extractor.extract_rbi_parameters("INVALID-TEST")
        
        # Should only include valid measurements
        assert len(extracted.thickness_measurements) == 1
        assert extracted.thickness_measurements[0].thickness == 12.0