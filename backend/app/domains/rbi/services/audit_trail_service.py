"""Audit Trail Service - Complete audit logging and historical tracking for RBI system"""

import json
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import hashlib

from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    RBILevel,
    RiskLevel
)


class AuditEventType(str, Enum):
    """Types of audit events"""
    CALCULATION_EXECUTED = "calculation_executed"
    CONFIGURATION_CHANGED = "configuration_changed"
    DATA_UPDATED = "data_updated"
    SYSTEM_ADJUSTMENT = "system_adjustment"
    USER_ACTION = "user_action"
    BATCH_OPERATION = "batch_operation"
    ERROR_OCCURRED = "error_occurred"
    FALLBACK_TRIGGERED = "fallback_triggered"


class AuditSeverity(str, Enum):
    """Severity levels for audit events"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    """Individual audit event record"""
    event_id: str
    timestamp: datetime
    event_type: AuditEventType
    severity: AuditSeverity
    user_id: Optional[str]
    equipment_id: Optional[str]
    description: str
    details: Dict[str, Any] = field(default_factory=dict)
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert audit event to dictionary"""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "user_id": self.user_id,
            "equipment_id": self.equipment_id,
            "description": self.description,
            "details": self.details,
            "before_state": self.before_state,
            "after_state": self.after_state,
            "session_id": self.session_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent
        }
    
    def to_json(self) -> str:
        """Convert audit event to JSON string"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


@dataclass
class HistoricalDataPoint:
    """Historical data point for trend analysis"""
    timestamp: datetime
    equipment_id: str
    risk_level: RiskLevel
    pof_score: float
    cof_scores: Dict[str, float]
    confidence_score: float
    calculation_level: RBILevel
    inspection_interval_months: int
    data_quality_score: float
    fallback_occurred: bool
    calculation_id: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "timestamp": self.timestamp.isoformat(),
            "equipment_id": self.equipment_id,
            "risk_level": self.risk_level.value,
            "pof_score": self.pof_score,
            "cof_scores": self.cof_scores,
            "confidence_score": self.confidence_score,
            "calculation_level": self.calculation_level.value,
            "inspection_interval_months": self.inspection_interval_months,
            "data_quality_score": self.data_quality_score,
            "fallback_occurred": self.fallback_occurred,
            "calculation_id": self.calculation_id
        }


@dataclass
class TrendAnalysis:
    """Trend analysis results"""
    equipment_id: str
    analysis_period: Dict[str, datetime]
    data_points_count: int
    risk_trend: str  # "increasing", "decreasing", "stable"
    confidence_trend: str
    key_changes: List[Dict[str, Any]]
    recommendations: List[str]
    statistical_summary: Dict[str, Any]


class AuditTrailService:
    """Service for audit logging and historical tracking"""
    
    def __init__(self):
        """Initialize audit trail service"""
        self.logger = logging.getLogger(__name__)
        self._audit_events: List[AuditEvent] = []  # In-memory storage (would be database in production)
        self._historical_data: List[HistoricalDataPoint] = []
        self._session_cache: Dict[str, Any] = {}
    
    def log_calculation_event(
        self,
        calculation_result: RBICalculationResult,
        equipment_data: Optional[EquipmentData] = None,
        extracted_data: Optional[ExtractedRBIData] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> str:
        """Log RBI calculation execution event"""
        
        event_id = self._generate_event_id()
        
        # Determine severity based on calculation outcome
        severity = AuditSeverity.INFO
        if calculation_result.fallback_occurred:
            severity = AuditSeverity.WARNING
        if calculation_result.risk_level == RiskLevel.VERY_HIGH:
            severity = AuditSeverity.CRITICAL
        elif calculation_result.risk_level == RiskLevel.HIGH:
            severity = AuditSeverity.WARNING
        
        # Create detailed event description
        description = (
            f"RBI calculation executed for equipment {calculation_result.equipment_id} "
            f"using {calculation_result.calculation_level.value} methodology"
        )
        
        if calculation_result.fallback_occurred:
            description += f" (fallback from {calculation_result.requested_level.value})"
        
        # Prepare event details
        details = {
            "calculation_level": calculation_result.calculation_level.value,
            "requested_level": calculation_result.requested_level.value if calculation_result.requested_level else None,
            "risk_level": calculation_result.risk_level.value,
            "pof_score": calculation_result.pof_score,
            "cof_scores": calculation_result.cof_scores,
            "confidence_score": calculation_result.confidence_score,
            "data_quality_score": calculation_result.data_quality_score,
            "inspection_interval_months": calculation_result.inspection_interval_months,
            "fallback_occurred": calculation_result.fallback_occurred,
            "missing_data": calculation_result.missing_data or [],
            "estimated_parameters": calculation_result.estimated_parameters or [],
            "calculation_timestamp": calculation_result.calculation_timestamp.isoformat() if calculation_result.calculation_timestamp else None
        }
        
        # Add equipment context if available
        if equipment_data:
            details["equipment_context"] = {
                "equipment_type": equipment_data.equipment_type.value,
                "service_type": equipment_data.service_type.value,
                "age_years": equipment_data.age_years,
                "criticality_level": equipment_data.criticality_level
            }
        
        # Add data context if available
        if extracted_data:
            details["data_context"] = {
                "thickness_measurements_count": len(extracted_data.thickness_measurements),
                "corrosion_rate_available": extracted_data.corrosion_rate is not None,
                "inspection_quality": extracted_data.inspection_quality,
                "damage_mechanisms_count": len(extracted_data.damage_mechanisms)
            }
        
        # Create audit event
        event = AuditEvent(
            event_id=event_id,
            timestamp=datetime.now(),
            event_type=AuditEventType.FALLBACK_TRIGGERED if calculation_result.fallback_occurred else AuditEventType.CALCULATION_EXECUTED,
            severity=severity,
            user_id=user_id,
            equipment_id=calculation_result.equipment_id,
            description=description,
            details=details,
            session_id=session_id
        )
        
        # Store audit event
        self._audit_events.append(event)
        
        # Store historical data point
        self._store_historical_data_point(calculation_result)
        
        self.logger.info(f"Audit event logged: {event_id} - {description}")
        
        return event_id
    
    def log_configuration_change(
        self,
        configuration_type: str,
        change_description: str,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> str:
        """Log configuration change event"""
        
        event_id = self._generate_event_id()
        
        description = f"Configuration changed: {configuration_type} - {change_description}"
        
        details = {
            "configuration_type": configuration_type,
            "change_type": self._determine_change_type(before_state, after_state),
            "affected_components": self._identify_affected_components(configuration_type)
        }
        
        event = AuditEvent(
            event_id=event_id,
            timestamp=datetime.now(),
            event_type=AuditEventType.CONFIGURATION_CHANGED,
            severity=AuditSeverity.WARNING,  # Configuration changes are important
            user_id=user_id,
            equipment_id=None,
            description=description,
            details=details,
            before_state=before_state,
            after_state=after_state,
            session_id=session_id
        )
        
        self._audit_events.append(event)
        
        self.logger.warning(f"Configuration change logged: {event_id} - {description}")
        
        return event_id
    
    def log_data_update(
        self,
        equipment_id: str,
        data_type: str,
        update_description: str,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> str:
        """Log data update event"""
        
        event_id = self._generate_event_id()
        
        description = f"Data updated for {equipment_id}: {data_type} - {update_description}"
        
        details = {
            "data_type": data_type,
            "update_type": self._determine_change_type(before_state, after_state),
            "data_integrity_check": self._verify_data_integrity(before_state, after_state)
        }
        
        event = AuditEvent(
            event_id=event_id,
            timestamp=datetime.now(),
            event_type=AuditEventType.DATA_UPDATED,
            severity=AuditSeverity.INFO,
            user_id=user_id,
            equipment_id=equipment_id,
            description=description,
            details=details,
            before_state=before_state,
            after_state=after_state,
            session_id=session_id
        )
        
        self._audit_events.append(event)
        
        self.logger.info(f"Data update logged: {event_id} - {description}")
        
        return event_id
    
    def log_batch_operation(
        self,
        operation_type: str,
        equipment_count: int,
        success_count: int,
        failure_count: int,
        operation_details: Dict[str, Any],
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> str:
        """Log batch operation event"""
        
        event_id = self._generate_event_id()
        
        description = (
            f"Batch {operation_type} completed: {success_count}/{equipment_count} successful, "
            f"{failure_count} failed"
        )
        
        severity = AuditSeverity.INFO
        if failure_count > 0:
            severity = AuditSeverity.WARNING
        if failure_count > success_count:
            severity = AuditSeverity.ERROR
        
        details = {
            "operation_type": operation_type,
            "total_equipment": equipment_count,
            "successful_operations": success_count,
            "failed_operations": failure_count,
            "success_rate": (success_count / equipment_count * 100) if equipment_count > 0 else 0,
            **operation_details
        }
        
        event = AuditEvent(
            event_id=event_id,
            timestamp=datetime.now(),
            event_type=AuditEventType.BATCH_OPERATION,
            severity=severity,
            user_id=user_id,
            equipment_id=None,
            description=description,
            details=details,
            session_id=session_id
        )
        
        self._audit_events.append(event)
        
        self.logger.info(f"Batch operation logged: {event_id} - {description}")
        
        return event_id
    
    def log_error_event(
        self,
        error_type: str,
        error_message: str,
        equipment_id: Optional[str] = None,
        error_details: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> str:
        """Log error event"""
        
        event_id = self._generate_event_id()
        
        description = f"Error occurred: {error_type} - {error_message}"
        
        details = {
            "error_type": error_type,
            "error_message": error_message,
            "error_details": error_details or {},
            "recovery_actions": self._suggest_recovery_actions(error_type)
        }
        
        event = AuditEvent(
            event_id=event_id,
            timestamp=datetime.now(),
            event_type=AuditEventType.ERROR_OCCURRED,
            severity=AuditSeverity.ERROR,
            user_id=user_id,
            equipment_id=equipment_id,
            description=description,
            details=details,
            session_id=session_id
        )
        
        self._audit_events.append(event)
        
        self.logger.error(f"Error event logged: {event_id} - {description}")
        
        return event_id
    
    def get_audit_trail(
        self,
        equipment_id: Optional[str] = None,
        event_type: Optional[AuditEventType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_id: Optional[str] = None,
        limit: int = 100
    ) -> List[AuditEvent]:
        """Retrieve audit trail with filtering options"""
        
        filtered_events = self._audit_events.copy()
        
        # Apply filters
        if equipment_id:
            filtered_events = [e for e in filtered_events if e.equipment_id == equipment_id]
        
        if event_type:
            filtered_events = [e for e in filtered_events if e.event_type == event_type]
        
        if start_date:
            filtered_events = [e for e in filtered_events if e.timestamp >= start_date]
        
        if end_date:
            filtered_events = [e for e in filtered_events if e.timestamp <= end_date]
        
        if user_id:
            filtered_events = [e for e in filtered_events if e.user_id == user_id]
        
        # Sort by timestamp (newest first) and limit
        filtered_events.sort(key=lambda x: x.timestamp, reverse=True)
        
        return filtered_events[:limit]
    
    def get_historical_data(
        self,
        equipment_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[HistoricalDataPoint]:
        """Retrieve historical data for equipment"""
        
        filtered_data = [
            dp for dp in self._historical_data 
            if dp.equipment_id == equipment_id
        ]
        
        if start_date:
            filtered_data = [dp for dp in filtered_data if dp.timestamp >= start_date]
        
        if end_date:
            filtered_data = [dp for dp in filtered_data if dp.timestamp <= end_date]
        
        # Sort by timestamp
        filtered_data.sort(key=lambda x: x.timestamp)
        
        return filtered_data
    
    def generate_trend_analysis(
        self,
        equipment_id: str,
        analysis_period_days: int = 365
    ) -> TrendAnalysis:
        """Generate trend analysis for equipment"""
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=analysis_period_days)
        
        historical_data = self.get_historical_data(equipment_id, start_date, end_date)
        
        if len(historical_data) < 2:
            return TrendAnalysis(
                equipment_id=equipment_id,
                analysis_period={"start": start_date, "end": end_date},
                data_points_count=len(historical_data),
                risk_trend="insufficient_data",
                confidence_trend="insufficient_data",
                key_changes=[],
                recommendations=["Collect more historical data for trend analysis"],
                statistical_summary={}
            )
        
        # Analyze trends
        risk_trend = self._analyze_risk_trend(historical_data)
        confidence_trend = self._analyze_confidence_trend(historical_data)
        key_changes = self._identify_key_changes(historical_data)
        recommendations = self._generate_trend_recommendations(historical_data, risk_trend, confidence_trend)
        statistical_summary = self._calculate_statistical_summary(historical_data)
        
        return TrendAnalysis(
            equipment_id=equipment_id,
            analysis_period={"start": start_date, "end": end_date},
            data_points_count=len(historical_data),
            risk_trend=risk_trend,
            confidence_trend=confidence_trend,
            key_changes=key_changes,
            recommendations=recommendations,
            statistical_summary=statistical_summary
        )
    
    def get_audit_summary(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate audit trail summary"""
        
        events = self.get_audit_trail(start_date=start_date, end_date=end_date, limit=10000)
        
        # Count events by type
        event_type_counts = {}
        severity_counts = {}
        equipment_counts = {}
        user_counts = {}
        
        for event in events:
            event_type_counts[event.event_type.value] = event_type_counts.get(event.event_type.value, 0) + 1
            severity_counts[event.severity.value] = severity_counts.get(event.severity.value, 0) + 1
            
            if event.equipment_id:
                equipment_counts[event.equipment_id] = equipment_counts.get(event.equipment_id, 0) + 1
            
            if event.user_id:
                user_counts[event.user_id] = user_counts.get(event.user_id, 0) + 1
        
        # Calculate time range
        if events:
            time_range = {
                "earliest": min(e.timestamp for e in events),
                "latest": max(e.timestamp for e in events)
            }
        else:
            time_range = {"earliest": None, "latest": None}
        
        return {
            "total_events": len(events),
            "time_range": time_range,
            "event_type_distribution": event_type_counts,
            "severity_distribution": severity_counts,
            "top_equipment": dict(sorted(equipment_counts.items(), key=lambda x: x[1], reverse=True)[:10]),
            "active_users": list(user_counts.keys()),
            "critical_events_count": severity_counts.get("critical", 0),
            "error_events_count": severity_counts.get("error", 0),
            "warning_events_count": severity_counts.get("warning", 0)
        }
    
    def verify_audit_integrity(self) -> Dict[str, Any]:
        """Verify audit trail integrity"""
        
        integrity_report = {
            "total_events": len(self._audit_events),
            "integrity_checks": {
                "event_id_uniqueness": True,
                "timestamp_consistency": True,
                "required_fields_present": True,
                "data_consistency": True
            },
            "issues_found": [],
            "recommendations": []
        }
        
        # Check event ID uniqueness
        event_ids = [e.event_id for e in self._audit_events]
        if len(event_ids) != len(set(event_ids)):
            integrity_report["integrity_checks"]["event_id_uniqueness"] = False
            integrity_report["issues_found"].append("Duplicate event IDs found")
        
        # Check timestamp consistency
        timestamps = [e.timestamp for e in self._audit_events]
        if timestamps != sorted(timestamps):
            integrity_report["integrity_checks"]["timestamp_consistency"] = False
            integrity_report["issues_found"].append("Timestamp ordering inconsistency")
        
        # Check required fields
        for event in self._audit_events:
            if not all([event.event_id, event.timestamp, event.event_type, event.description]):
                integrity_report["integrity_checks"]["required_fields_present"] = False
                integrity_report["issues_found"].append(f"Missing required fields in event {event.event_id}")
                break
        
        # Generate recommendations
        if integrity_report["issues_found"]:
            integrity_report["recommendations"].append("Review and fix identified integrity issues")
        else:
            integrity_report["recommendations"].append("Audit trail integrity is maintained")
        
        return integrity_report    

    # Helper methods for audit trail service
    
    def _generate_event_id(self) -> str:
        """Generate unique event ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        hash_input = f"{timestamp}_{len(self._audit_events)}"
        return f"AUD_{hashlib.md5(hash_input.encode()).hexdigest()[:8].upper()}"
    
    def _store_historical_data_point(self, calculation_result: RBICalculationResult):
        """Store historical data point for trend analysis"""
        
        data_point = HistoricalDataPoint(
            timestamp=datetime.now(),
            equipment_id=calculation_result.equipment_id,
            risk_level=calculation_result.risk_level,
            pof_score=calculation_result.pof_score,
            cof_scores=calculation_result.cof_scores or {},
            confidence_score=calculation_result.confidence_score,
            calculation_level=calculation_result.calculation_level,
            inspection_interval_months=calculation_result.inspection_interval_months,
            data_quality_score=calculation_result.data_quality_score,
            fallback_occurred=calculation_result.fallback_occurred,
            calculation_id=f"CALC_{calculation_result.equipment_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )
        
        self._historical_data.append(data_point)
    
    def _determine_change_type(self, before_state: Optional[Dict], after_state: Optional[Dict]) -> str:
        """Determine type of change between states"""
        
        if before_state is None and after_state is not None:
            return "creation"
        elif before_state is not None and after_state is None:
            return "deletion"
        elif before_state is not None and after_state is not None:
            return "modification"
        else:
            return "unknown"
    
    def _identify_affected_components(self, configuration_type: str) -> List[str]:
        """Identify components affected by configuration change"""
        
        component_mapping = {
            "scoring_tables": ["Level2Calculator", "RiskMatrix"],
            "risk_matrix": ["RiskAssessment", "IntervalCalculation"],
            "calculation_parameters": ["AllCalculators", "FallbackManager"],
            "data_quality_thresholds": ["DataQualityAssessor", "LevelManager"],
            "system_settings": ["AllComponents"]
        }
        
        return component_mapping.get(configuration_type, ["Unknown"])
    
    def _verify_data_integrity(self, before_state: Optional[Dict], after_state: Optional[Dict]) -> Dict[str, Any]:
        """Verify data integrity of state changes"""
        
        integrity_check = {
            "passed": True,
            "issues": [],
            "checksum_before": None,
            "checksum_after": None
        }
        
        if before_state:
            integrity_check["checksum_before"] = hashlib.md5(
                json.dumps(before_state, sort_keys=True).encode()
            ).hexdigest()
        
        if after_state:
            integrity_check["checksum_after"] = hashlib.md5(
                json.dumps(after_state, sort_keys=True).encode()
            ).hexdigest()
        
        # Add specific integrity checks based on data type
        if before_state and after_state:
            # Check for required fields preservation
            if "equipment_id" in before_state and "equipment_id" not in after_state:
                integrity_check["passed"] = False
                integrity_check["issues"].append("Critical field 'equipment_id' removed")
        
        return integrity_check
    
    def _suggest_recovery_actions(self, error_type: str) -> List[str]:
        """Suggest recovery actions for different error types"""
        
        recovery_actions = {
            "calculation_error": [
                "Verify input data quality",
                "Check configuration parameters",
                "Retry with fallback level"
            ],
            "data_error": [
                "Validate data sources",
                "Check data format and completeness",
                "Review data collection procedures"
            ],
            "configuration_error": [
                "Verify configuration syntax",
                "Check parameter ranges",
                "Restore from backup if needed"
            ],
            "system_error": [
                "Check system resources",
                "Review error logs",
                "Contact system administrator"
            ]
        }
        
        return recovery_actions.get(error_type, ["Review error details and contact support"])
    
    def _analyze_risk_trend(self, historical_data: List[HistoricalDataPoint]) -> str:
        """Analyze risk level trend over time"""
        
        if len(historical_data) < 2:
            return "insufficient_data"
        
        # Convert risk levels to numeric values for trend analysis
        risk_values = []
        risk_mapping = {
            RiskLevel.LOW: 1,
            RiskLevel.MEDIUM: 2,
            RiskLevel.HIGH: 3,
            RiskLevel.VERY_HIGH: 4
        }
        
        for dp in historical_data:
            risk_values.append(risk_mapping.get(dp.risk_level, 2))
        
        # Simple trend analysis
        recent_avg = sum(risk_values[-3:]) / min(3, len(risk_values))
        early_avg = sum(risk_values[:3]) / min(3, len(risk_values))
        
        if recent_avg > early_avg + 0.5:
            return "increasing"
        elif recent_avg < early_avg - 0.5:
            return "decreasing"
        else:
            return "stable"
    
    def _analyze_confidence_trend(self, historical_data: List[HistoricalDataPoint]) -> str:
        """Analyze confidence score trend over time"""
        
        if len(historical_data) < 2:
            return "insufficient_data"
        
        confidence_scores = [dp.confidence_score for dp in historical_data]
        
        recent_avg = sum(confidence_scores[-3:]) / min(3, len(confidence_scores))
        early_avg = sum(confidence_scores[:3]) / min(3, len(confidence_scores))
        
        if recent_avg > early_avg + 0.1:
            return "improving"
        elif recent_avg < early_avg - 0.1:
            return "declining"
        else:
            return "stable"
    
    def _identify_key_changes(self, historical_data: List[HistoricalDataPoint]) -> List[Dict[str, Any]]:
        """Identify key changes in historical data"""
        
        key_changes = []
        
        if len(historical_data) < 2:
            return key_changes
        
        for i in range(1, len(historical_data)):
            current = historical_data[i]
            previous = historical_data[i-1]
            
            # Check for risk level changes
            if current.risk_level != previous.risk_level:
                key_changes.append({
                    "timestamp": current.timestamp,
                    "change_type": "risk_level_change",
                    "description": f"Risk level changed from {previous.risk_level.value} to {current.risk_level.value}",
                    "impact": "high" if abs(self._risk_to_numeric(current.risk_level) - self._risk_to_numeric(previous.risk_level)) > 1 else "medium"
                })
            
            # Check for significant confidence changes
            confidence_change = abs(current.confidence_score - previous.confidence_score)
            if confidence_change > 0.2:
                key_changes.append({
                    "timestamp": current.timestamp,
                    "change_type": "confidence_change",
                    "description": f"Confidence score changed by {confidence_change:.2f}",
                    "impact": "high" if confidence_change > 0.4 else "medium"
                })
            
            # Check for fallback occurrences
            if current.fallback_occurred and not previous.fallback_occurred:
                key_changes.append({
                    "timestamp": current.timestamp,
                    "change_type": "fallback_triggered",
                    "description": "Calculation fallback was triggered",
                    "impact": "medium"
                })
        
        return key_changes
    
    def _generate_trend_recommendations(
        self, 
        historical_data: List[HistoricalDataPoint], 
        risk_trend: str, 
        confidence_trend: str
    ) -> List[str]:
        """Generate recommendations based on trend analysis"""
        
        recommendations = []
        
        # Risk trend recommendations
        if risk_trend == "increasing":
            recommendations.append("Risk levels are increasing - consider more frequent inspections")
            recommendations.append("Review maintenance procedures and effectiveness")
            recommendations.append("Investigate root causes of deteriorating conditions")
        elif risk_trend == "decreasing":
            recommendations.append("Risk levels are improving - current maintenance strategy is effective")
            recommendations.append("Consider optimizing inspection intervals based on improved conditions")
        
        # Confidence trend recommendations
        if confidence_trend == "declining":
            recommendations.append("Data quality is declining - improve data collection procedures")
            recommendations.append("Consider additional inspection techniques for better data")
            recommendations.append("Review and update measurement protocols")
        elif confidence_trend == "improving":
            recommendations.append("Data quality is improving - maintain current data collection standards")
        
        # Fallback frequency recommendations
        fallback_count = sum(1 for dp in historical_data if dp.fallback_occurred)
        fallback_rate = fallback_count / len(historical_data) if historical_data else 0
        
        if fallback_rate > 0.3:
            recommendations.append("High fallback rate detected - improve data completeness")
            recommendations.append("Consider upgrading to higher-level calculation methods")
        
        # General recommendations
        if len(historical_data) < 5:
            recommendations.append("Collect more historical data for better trend analysis")
        
        if not recommendations:
            recommendations.append("Continue current monitoring and maintenance practices")
        
        return recommendations
    
    def _calculate_statistical_summary(self, historical_data: List[HistoricalDataPoint]) -> Dict[str, Any]:
        """Calculate statistical summary of historical data"""
        
        if not historical_data:
            return {}
        
        # Risk level statistics
        risk_values = [self._risk_to_numeric(dp.risk_level) for dp in historical_data]
        confidence_scores = [dp.confidence_score for dp in historical_data]
        pof_scores = [dp.pof_score for dp in historical_data]
        data_quality_scores = [dp.data_quality_score for dp in historical_data]
        
        return {
            "risk_statistics": {
                "mean": sum(risk_values) / len(risk_values),
                "min": min(risk_values),
                "max": max(risk_values),
                "std_dev": self._calculate_std_dev(risk_values)
            },
            "confidence_statistics": {
                "mean": sum(confidence_scores) / len(confidence_scores),
                "min": min(confidence_scores),
                "max": max(confidence_scores),
                "std_dev": self._calculate_std_dev(confidence_scores)
            },
            "pof_statistics": {
                "mean": sum(pof_scores) / len(pof_scores),
                "min": min(pof_scores),
                "max": max(pof_scores),
                "std_dev": self._calculate_std_dev(pof_scores)
            },
            "data_quality_statistics": {
                "mean": sum(data_quality_scores) / len(data_quality_scores),
                "min": min(data_quality_scores),
                "max": max(data_quality_scores),
                "std_dev": self._calculate_std_dev(data_quality_scores)
            },
            "fallback_rate": sum(1 for dp in historical_data if dp.fallback_occurred) / len(historical_data),
            "calculation_level_distribution": self._calculate_level_distribution(historical_data)
        }
    
    def _risk_to_numeric(self, risk_level: RiskLevel) -> int:
        """Convert risk level to numeric value"""
        mapping = {
            RiskLevel.LOW: 1,
            RiskLevel.MEDIUM: 2,
            RiskLevel.HIGH: 3,
            RiskLevel.VERY_HIGH: 4
        }
        return mapping.get(risk_level, 2)
    
    def _calculate_std_dev(self, values: List[float]) -> float:
        """Calculate standard deviation"""
        if len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return variance ** 0.5
    
    def _calculate_level_distribution(self, historical_data: List[HistoricalDataPoint]) -> Dict[str, float]:
        """Calculate distribution of calculation levels"""
        
        level_counts = {}
        for dp in historical_data:
            level = dp.calculation_level.value
            level_counts[level] = level_counts.get(level, 0) + 1
        
        total = len(historical_data)
        return {level: count / total for level, count in level_counts.items()}
    
    def _risk_to_numeric(self, risk_level: RiskLevel) -> int:
        """Convert risk level to numeric value"""
        mapping = {
            RiskLevel.LOW: 1,
            RiskLevel.MEDIUM: 2,
            RiskLevel.HIGH: 3,
            RiskLevel.VERY_HIGH: 4
        }
        return mapping.get(risk_level, 2)
    
    def _generate_trend_recommendations(
        self, 
        historical_data: List[HistoricalDataPoint],
        risk_trend: str,
        confidence_trend: str
    ) -> List[str]:
        """Generate recommendations based on trend analysis"""
        
        recommendations = []
        
        # Risk trend recommendations
        if risk_trend == "increasing":
            recommendations.append("Risk is increasing - consider more frequent inspections")
            recommendations.append("Review and address root causes of increasing risk")
        elif risk_trend == "decreasing":
            recommendations.append("Risk is decreasing - current maintenance strategy is effective")
        
        # Confidence trend recommendations
        if confidence_trend == "declining":
            recommendations.append("Calculation confidence is declining - improve data quality")
            recommendations.append("Consider upgrading to higher-level calculation methods")
        elif confidence_trend == "improving":
            recommendations.append("Calculation confidence is improving - maintain current data practices")
        
        # Fallback frequency recommendations
        fallback_count = sum(1 for dp in historical_data if dp.fallback_occurred)
        fallback_rate = fallback_count / len(historical_data)
        
        if fallback_rate > 0.3:
            recommendations.append("High fallback rate detected - prioritize data collection improvements")
        
        # Data quality recommendations
        avg_data_quality = sum(dp.data_quality_score for dp in historical_data) / len(historical_data)
        if avg_data_quality < 0.7:
            recommendations.append("Average data quality is below optimal - implement data quality improvements")
        
        return recommendations or ["Continue current monitoring and maintenance practices"]
    
    def _calculate_statistical_summary(self, historical_data: List[HistoricalDataPoint]) -> Dict[str, Any]:
        """Calculate statistical summary of historical data"""
        
        if not historical_data:
            return {}
        
        # Risk level distribution
        risk_distribution = {}
        for dp in historical_data:
            risk_level = dp.risk_level.value
            risk_distribution[risk_level] = risk_distribution.get(risk_level, 0) + 1
        
        # Confidence statistics
        confidence_scores = [dp.confidence_score for dp in historical_data]
        confidence_stats = {
            "mean": sum(confidence_scores) / len(confidence_scores),
            "min": min(confidence_scores),
            "max": max(confidence_scores),
            "std_dev": self._calculate_std_dev(confidence_scores)
        }
        
        # PoF statistics
        pof_scores = [dp.pof_score for dp in historical_data]
        pof_stats = {
            "mean": sum(pof_scores) / len(pof_scores),
            "min": min(pof_scores),
            "max": max(pof_scores),
            "std_dev": self._calculate_std_dev(pof_scores)
        }
        
        # Calculation level distribution
        level_distribution = {}
        for dp in historical_data:
            level = dp.calculation_level.value
            level_distribution[level] = level_distribution.get(level, 0) + 1
        
        # Fallback statistics
        fallback_count = sum(1 for dp in historical_data if dp.fallback_occurred)
        fallback_rate = fallback_count / len(historical_data)
        
        return {
            "data_points": len(historical_data),
            "time_span_days": (historical_data[-1].timestamp - historical_data[0].timestamp).days,
            "risk_distribution": risk_distribution,
            "confidence_statistics": confidence_stats,
            "pof_statistics": pof_stats,
            "calculation_level_distribution": level_distribution,
            "fallback_statistics": {
                "total_fallbacks": fallback_count,
                "fallback_rate": round(fallback_rate * 100, 1)
            }
        }
    
    def _calculate_std_dev(self, values: List[float]) -> float:
        """Calculate standard deviation"""
        if len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return variance ** 0.5
    
    def export_audit_trail(
        self,
        format_type: str = "json",
        equipment_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> str:
        """Export audit trail in specified format"""
        
        events = self.get_audit_trail(
            equipment_id=equipment_id,
            start_date=start_date,
            end_date=end_date,
            limit=10000
        )
        
        if format_type.lower() == "json":
            return json.dumps([event.to_dict() for event in events], indent=2, ensure_ascii=False)
        
        elif format_type.lower() == "csv":
            # Simple CSV export
            csv_lines = ["timestamp,event_type,severity,equipment_id,description,user_id"]
            for event in events:
                csv_lines.append(
                    f"{event.timestamp.isoformat()},{event.event_type.value},"
                    f"{event.severity.value},{event.equipment_id or ''},"
                    f"\"{event.description}\",{event.user_id or ''}"
                )
            return "\n".join(csv_lines)
        
        else:
            raise ValueError(f"Unsupported export format: {format_type}")
    
    def cleanup_old_events(self, retention_days: int = 365) -> int:
        """Clean up old audit events beyond retention period"""
        
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        original_count = len(self._audit_events)
        self._audit_events = [
            event for event in self._audit_events 
            if event.timestamp > cutoff_date
        ]
        
        # Also cleanup historical data
        original_historical_count = len(self._historical_data)
        self._historical_data = [
            dp for dp in self._historical_data 
            if dp.timestamp > cutoff_date
        ]
        
        removed_events = original_count - len(self._audit_events)
        removed_historical = original_historical_count - len(self._historical_data)
        
        if removed_events > 0 or removed_historical > 0:
            self.logger.info(
                f"Cleaned up {removed_events} audit events and {removed_historical} historical data points "
                f"older than {retention_days} days"
            )
        
        return removed_events + removed_historical