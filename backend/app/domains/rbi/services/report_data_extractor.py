"""Report data extraction service for RBI calculations"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import statistics
from app.domains.rbi.models.core import (
    ExtractedRBIData,
    ThicknessMeasurement,
    InspectionFinding
)


@dataclass
class InspectionReport:
    """Inspection report data structure"""
    report_id: str
    equipment_id: str
    inspection_date: datetime
    inspector: str
    report_type: str
    findings: List[Dict[str, Any]]
    thickness_data: List[Dict[str, Any]]
    general_observations: str
    recommendations: List[str]
    next_inspection_due: Optional[datetime] = None


@dataclass
class TrendAnalysis:
    """Trend analysis results"""
    parameter: str
    trend_direction: str  # "increasing", "decreasing", "stable"
    trend_rate: float
    confidence: float
    data_points: int
    time_span_years: float
    r_squared: Optional[float] = None


class ReportDataExtractor:
    """Service for extracting RBI parameters from inspection reports"""
    
    def __init__(self):
        """Initialize report data extractor"""
        # In real implementation, this would connect to report database
        self._reports_cache: Dict[str, List[InspectionReport]] = {}
        
        # Initialize with sample data for testing
        self._initialize_sample_reports()
    
    def extract_rbi_parameters(
        self, 
        equipment_id: str, 
        report_history: Optional[List[InspectionReport]] = None
    ) -> ExtractedRBIData:
        """Extract RBI parameters from inspection reports"""
        
        if report_history is None:
            report_history = self._reports_cache.get(equipment_id, [])
        
        if not report_history:
            # Return empty data if no reports available
            return ExtractedRBIData(equipment_id=equipment_id)
        
        # Sort reports by date (newest first)
        sorted_reports = sorted(report_history, key=lambda r: r.inspection_date, reverse=True)
        latest_report = sorted_reports[0]
        
        # Extract thickness measurements
        thickness_measurements = self._extract_thickness_measurements(report_history)
        
        # Calculate corrosion rate from thickness trends
        corrosion_rate = self._calculate_corrosion_rate(thickness_measurements)
        
        # Extract coating condition from latest report
        coating_condition = self._extract_coating_condition(latest_report)
        
        # Extract damage mechanisms
        damage_mechanisms = self._extract_damage_mechanisms(report_history)
        
        # Extract inspection findings
        inspection_findings = self._extract_inspection_findings(report_history)
        
        # Assess inspection quality
        inspection_quality = self._assess_inspection_quality(report_history)
        
        return ExtractedRBIData(
            equipment_id=equipment_id,
            thickness_measurements=thickness_measurements,
            corrosion_rate=corrosion_rate,
            coating_condition=coating_condition,
            damage_mechanisms=damage_mechanisms,
            inspection_findings=inspection_findings,
            last_inspection_date=latest_report.inspection_date,
            inspection_quality=inspection_quality
        )
    
    def _extract_thickness_measurements(
        self, 
        report_history: List[InspectionReport]
    ) -> List[ThicknessMeasurement]:
        """Extract thickness measurements from reports"""
        measurements = []
        
        for report in report_history:
            for thickness_data in report.thickness_data:
                try:
                    measurement = ThicknessMeasurement(
                        location=thickness_data.get("location", "Unknown"),
                        thickness=float(thickness_data.get("thickness", 0)),
                        measurement_date=report.inspection_date,
                        minimum_required=float(thickness_data.get("minimum_required", 10.0)),
                        measurement_method=thickness_data.get("method", "UT"),
                        inspector=report.inspector
                    )
                    measurements.append(measurement)
                except (ValueError, TypeError):
                    # Skip invalid measurements
                    continue
        
        return measurements
    
    def _calculate_corrosion_rate(
        self, 
        thickness_measurements: List[ThicknessMeasurement]
    ) -> Optional[float]:
        """Calculate corrosion rate from thickness measurements"""
        if len(thickness_measurements) < 2:
            return None
        
        # Group measurements by location
        location_measurements = {}
        for measurement in thickness_measurements:
            if measurement.location not in location_measurements:
                location_measurements[measurement.location] = []
            location_measurements[measurement.location].append(measurement)
        
        corrosion_rates = []
        
        for location, measurements in location_measurements.items():
            if len(measurements) < 2:
                continue
            
            # Sort by date
            measurements.sort(key=lambda m: m.measurement_date)
            
            # Calculate rate for this location
            oldest = measurements[0]
            newest = measurements[-1]
            
            time_diff_years = (newest.measurement_date - oldest.measurement_date).days / 365.25
            if time_diff_years <= 0:
                continue
            
            thickness_loss = oldest.thickness - newest.thickness
            if thickness_loss <= 0:
                continue  # No corrosion detected
            
            rate = thickness_loss / time_diff_years
            corrosion_rates.append(rate)
        
        if not corrosion_rates:
            return None
        
        # Return average corrosion rate
        return statistics.mean(corrosion_rates)
    
    def _extract_coating_condition(self, report: InspectionReport) -> Optional[str]:
        """Extract coating condition from report"""
        # Look for coating-related findings
        coating_keywords = {
            "excellent": ["excellent coating", "good coating", "intact coating"],
            "moderate": ["moderate coating", "fair coating", "some coating damage"],
            "none": ["no coating", "coating failed", "bare metal", "coating removed"]
        }
        
        report_text = report.general_observations.lower()
        
        for condition, keywords in coating_keywords.items():
            if any(keyword in report_text for keyword in keywords):
                return condition
        
        # Check findings for coating information
        for finding in report.findings:
            finding_text = finding.get("description", "").lower()
            for condition, keywords in coating_keywords.items():
                if any(keyword in finding_text for keyword in keywords):
                    return condition
        
        return None
    
    def _extract_damage_mechanisms(self, report_history: List[InspectionReport]) -> List[str]:
        """Extract active damage mechanisms from reports"""
        damage_mechanisms = set()
        
        # Common damage mechanism keywords
        mechanism_keywords = {
            "General Corrosion": ["general corrosion", "uniform corrosion", "overall thinning"],
            "Pitting": ["pitting", "pit corrosion", "localized corrosion"],
            "Crevice Corrosion": ["crevice corrosion", "crevice attack"],
            "Stress Corrosion Cracking": ["scc", "stress corrosion", "cracking"],
            "Erosion": ["erosion", "erosion corrosion", "flow induced"],
            "Fatigue": ["fatigue", "cyclic loading", "fatigue crack"],
            "Hydrogen Damage": ["hydrogen", "blistering", "hydrogen attack"],
            "Sulfide Stress Cracking": ["ssc", "sulfide stress", "h2s cracking"],
            "Microbiologically Influenced Corrosion": ["mic", "microbiological", "bacterial"]
        }
        
        for report in report_history:
            # Check general observations
            observations_text = report.general_observations.lower()
            for mechanism, keywords in mechanism_keywords.items():
                if any(keyword in observations_text for keyword in keywords):
                    damage_mechanisms.add(mechanism)
            
            # Check individual findings
            for finding in report.findings:
                finding_text = finding.get("description", "").lower()
                finding_type = finding.get("type", "").lower()
                
                for mechanism, keywords in mechanism_keywords.items():
                    if any(keyword in finding_text or keyword in finding_type for keyword in keywords):
                        damage_mechanisms.add(mechanism)
        
        return list(damage_mechanisms)
    
    def _extract_inspection_findings(
        self, 
        report_history: List[InspectionReport]
    ) -> List[InspectionFinding]:
        """Extract inspection findings from reports"""
        findings = []
        
        for report in report_history:
            for finding_data in report.findings:
                try:
                    finding = InspectionFinding(
                        finding_type=finding_data.get("type", "General"),
                        severity=finding_data.get("severity", "Medium"),
                        description=finding_data.get("description", ""),
                        location=finding_data.get("location"),
                        recommendation=finding_data.get("recommendation"),
                        finding_date=report.inspection_date
                    )
                    findings.append(finding)
                except ValueError:
                    # Skip invalid findings
                    continue
        
        return findings
    
    def _assess_inspection_quality(self, report_history: List[InspectionReport]) -> str:
        """Assess overall inspection quality"""
        if not report_history:
            return "poor"
        
        quality_score = 0
        total_reports = len(report_history)
        
        for report in report_history:
            # Score based on completeness
            if report.thickness_data:
                quality_score += 2
            if report.findings:
                quality_score += 2
            if report.general_observations:
                quality_score += 1
            if report.recommendations:
                quality_score += 1
        
        average_score = quality_score / total_reports
        
        if average_score >= 5:
            return "good"
        elif average_score >= 3:
            return "average"
        else:
            return "poor"
    
    def calculate_historical_trends(
        self, 
        equipment_id: str, 
        parameter: str = "thickness"
    ) -> List[TrendAnalysis]:
        """Calculate historical trends for specified parameter"""
        report_history = self._reports_cache.get(equipment_id, [])
        if not report_history:
            return []
        
        if parameter == "thickness":
            return self._analyze_thickness_trends(report_history)
        elif parameter == "corrosion_rate":
            return self._analyze_corrosion_rate_trends(report_history)
        else:
            return []
    
    def _analyze_thickness_trends(self, report_history: List[InspectionReport]) -> List[TrendAnalysis]:
        """Analyze thickness measurement trends"""
        # Extract all thickness measurements
        all_measurements = self._extract_thickness_measurements(report_history)
        
        # Group by location
        location_measurements = {}
        for measurement in all_measurements:
            if measurement.location not in location_measurements:
                location_measurements[measurement.location] = []
            location_measurements[measurement.location].append(measurement)
        
        trends = []
        
        for location, measurements in location_measurements.items():
            if len(measurements) < 3:  # Need at least 3 points for trend
                continue
            
            # Sort by date
            measurements.sort(key=lambda m: m.measurement_date)
            
            # Calculate trend
            x_values = [(m.measurement_date - measurements[0].measurement_date).days / 365.25 
                       for m in measurements]
            y_values = [m.thickness for m in measurements]
            
            if len(set(y_values)) == 1:  # All values are the same
                trend_direction = "stable"
                trend_rate = 0.0
                confidence = 1.0
            else:
                # Simple linear regression
                n = len(measurements)
                sum_x = sum(x_values)
                sum_y = sum(y_values)
                sum_xy = sum(x * y for x, y in zip(x_values, y_values))
                sum_x2 = sum(x * x for x in x_values)
                
                if n * sum_x2 - sum_x * sum_x == 0:
                    continue  # Avoid division by zero
                
                slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
                
                # Determine trend direction
                if abs(slope) < 0.1:  # mm/year threshold
                    trend_direction = "stable"
                elif slope < 0:
                    trend_direction = "decreasing"  # Thickness decreasing (corrosion)
                else:
                    trend_direction = "increasing"  # Thickness increasing (unlikely)
                
                trend_rate = abs(slope)
                
                # Calculate R-squared for confidence
                y_mean = sum_y / n
                ss_tot = sum((y - y_mean) ** 2 for y in y_values)
                intercept = (sum_y - slope * sum_x) / n
                ss_res = sum((y - (slope * x + intercept)) ** 2 
                           for x, y in zip(x_values, y_values))
                
                r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
                confidence = max(0, min(1, r_squared))
            
            time_span = (measurements[-1].measurement_date - measurements[0].measurement_date).days / 365.25
            
            trend = TrendAnalysis(
                parameter=f"thickness_{location}",
                trend_direction=trend_direction,
                trend_rate=trend_rate,
                confidence=confidence,
                data_points=len(measurements),
                time_span_years=time_span,
                r_squared=r_squared if 'r_squared' in locals() else None
            )
            
            trends.append(trend)
        
        return trends
    
    def _analyze_corrosion_rate_trends(self, report_history: List[InspectionReport]) -> List[TrendAnalysis]:
        """Analyze corrosion rate trends over time"""
        # This would require multiple corrosion rate calculations over time
        # For now, return empty list as it requires more complex analysis
        return []
    
    def add_inspection_report(self, report: InspectionReport) -> None:
        """Add inspection report to the system"""
        if report.equipment_id not in self._reports_cache:
            self._reports_cache[report.equipment_id] = []
        
        self._reports_cache[report.equipment_id].append(report)
        
        # Sort by date (newest first)
        self._reports_cache[report.equipment_id].sort(
            key=lambda r: r.inspection_date, reverse=True
        )
    
    def get_report_history(self, equipment_id: str) -> List[InspectionReport]:
        """Get inspection report history for equipment"""
        return self._reports_cache.get(equipment_id, [])
    
    def get_latest_report(self, equipment_id: str) -> Optional[InspectionReport]:
        """Get latest inspection report for equipment"""
        reports = self._reports_cache.get(equipment_id, [])
        if reports:
            return max(reports, key=lambda r: r.inspection_date)
        return None
    
    def _initialize_sample_reports(self) -> None:
        """Initialize with sample inspection reports"""
        # Sample reports for V-101
        v101_reports = [
            InspectionReport(
                report_id="RPT-V101-2024-001",
                equipment_id="V-101",
                inspection_date=datetime(2024, 6, 15),
                inspector="John Smith",
                report_type="Comprehensive",
                findings=[
                    {
                        "type": "General Corrosion",
                        "severity": "Medium",
                        "description": "Uniform corrosion observed on shell surface",
                        "location": "Shell_External",
                        "recommendation": "Continue monitoring, apply protective coating"
                    },
                    {
                        "type": "Pitting",
                        "severity": "Low",
                        "description": "Minor pitting observed near nozzle",
                        "location": "Nozzle_N1",
                        "recommendation": "Monitor during next inspection"
                    }
                ],
                thickness_data=[
                    {"location": "Shell_Top", "thickness": 12.5, "minimum_required": 10.0, "method": "UT"},
                    {"location": "Shell_Bottom", "thickness": 11.8, "minimum_required": 10.0, "method": "UT"},
                    {"location": "Head", "thickness": 13.2, "minimum_required": 10.0, "method": "UT"}
                ],
                general_observations="Equipment in fair condition with moderate coating damage. Some general corrosion evident.",
                recommendations=["Apply protective coating", "Increase inspection frequency"]
            ),
            InspectionReport(
                report_id="RPT-V101-2022-001",
                equipment_id="V-101",
                inspection_date=datetime(2022, 6, 10),
                inspector="Jane Doe",
                report_type="Routine",
                findings=[
                    {
                        "type": "General Corrosion",
                        "severity": "Low",
                        "description": "Light corrosion on external surfaces",
                        "location": "Shell_External",
                        "recommendation": "Continue monitoring"
                    }
                ],
                thickness_data=[
                    {"location": "Shell_Top", "thickness": 13.1, "minimum_required": 10.0, "method": "UT"},
                    {"location": "Shell_Bottom", "thickness": 12.4, "minimum_required": 10.0, "method": "UT"},
                    {"location": "Head", "thickness": 13.8, "minimum_required": 10.0, "method": "UT"}
                ],
                general_observations="Equipment in good condition with excellent coating integrity.",
                recommendations=["Continue routine monitoring"]
            ),
            InspectionReport(
                report_id="RPT-V101-2020-001",
                equipment_id="V-101",
                inspection_date=datetime(2020, 5, 20),
                inspector="Bob Wilson",
                report_type="Comprehensive",
                findings=[],
                thickness_data=[
                    {"location": "Shell_Top", "thickness": 13.8, "minimum_required": 10.0, "method": "UT"},
                    {"location": "Shell_Bottom", "thickness": 13.0, "minimum_required": 10.0, "method": "UT"},
                    {"location": "Head", "thickness": 14.2, "minimum_required": 10.0, "method": "UT"}
                ],
                general_observations="Equipment in excellent condition with intact coating.",
                recommendations=["Continue routine inspection schedule"]
            )
        ]
        
        for report in v101_reports:
            self.add_inspection_report(report)
        
        # Sample reports for E-201
        e201_reports = [
            InspectionReport(
                report_id="RPT-E201-2024-001",
                equipment_id="E-201",
                inspection_date=datetime(2024, 7, 10),
                inspector="Alice Johnson",
                report_type="Routine",
                findings=[
                    {
                        "type": "Erosion",
                        "severity": "Low",
                        "description": "Minor erosion on tube inlet",
                        "location": "Tube_Inlet",
                        "recommendation": "Monitor flow rates"
                    }
                ],
                thickness_data=[
                    {"location": "Shell", "thickness": 7.8, "minimum_required": 6.0, "method": "UT"},
                    {"location": "Tubes", "thickness": 2.1, "minimum_required": 1.5, "method": "UT"}
                ],
                general_observations="Heat exchanger in good condition with minor erosion.",
                recommendations=["Monitor flow conditions"]
            )
        ]
        
        for report in e201_reports:
            self.add_inspection_report(report)