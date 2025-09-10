"""Pattern Recognition Engine - Identify equipment families and service-specific degradation patterns"""

import json
import logging
from typing import Dict, List, Optional, Any, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, Counter
import statistics
import math

from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType,
    InspectionFinding
)
from app.domains.rbi.services.prediction_tracker import PredictionRecord, PredictionTracker


class PatternType(str, Enum):
    """Types of patterns that can be recognized"""
    EQUIPMENT_FAMILY = "equipment_family"
    SERVICE_DEGRADATION = "service_degradation"
    OPERATIONAL_PATTERN = "operational_pattern"
    FAILURE_MODE = "failure_mode"
    MAINTENANCE_PATTERN = "maintenance_pattern"


class PatternConfidence(str, Enum):
    """Confidence levels for pattern recognition"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INSUFFICIENT_DATA = "insufficient_data"


@dataclass
class EquipmentFamily:
    """Equipment family definition based on similar characteristics"""
    family_id: str
    family_name: str
    equipment_type: EquipmentType
    service_types: Set[ServiceType]
    common_characteristics: Dict[str, Any]
    member_equipment: Set[str] = field(default_factory=set)
    degradation_patterns: List[str] = field(default_factory=list)
    typical_risk_profile: Dict[str, float] = field(default_factory=dict)
    recommended_parameters: Dict[str, Any] = field(default_factory=dict)
    confidence_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "family_id": self.family_id,
            "family_name": self.family_name,
            "equipment_type": self.equipment_type.value,
            "service_types": [st.value for st in self.service_types],
            "common_characteristics": self.common_characteristics,
            "member_equipment": list(self.member_equipment),
            "degradation_patterns": self.degradation_patterns,
            "typical_risk_profile": self.typical_risk_profile,
            "recommended_parameters": self.recommended_parameters,
            "confidence_score": self.confidence_score
        }


@dataclass
class DegradationPattern:
    """Service-specific degradation pattern"""
    pattern_id: str
    pattern_name: str
    service_type: ServiceType
    equipment_types: Set[EquipmentType]
    degradation_characteristics: Dict[str, Any]
    risk_factors: List[str]
    typical_timeline: Dict[str, float]  # Age vs degradation rate
    environmental_factors: List[str]
    mitigation_strategies: List[str]
    confidence_score: float = 0.0
    supporting_evidence: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "pattern_id": self.pattern_id,
            "pattern_name": self.pattern_name,
            "service_type": self.service_type.value,
            "equipment_types": [et.value for et in self.equipment_types],
            "degradation_characteristics": self.degradation_characteristics,
            "risk_factors": self.risk_factors,
            "typical_timeline": self.typical_timeline,
            "environmental_factors": self.environmental_factors,
            "mitigation_strategies": self.mitigation_strategies,
            "confidence_score": self.confidence_score,
            "supporting_evidence": self.supporting_evidence
        }


@dataclass
class PatternMatch:
    """Result of pattern matching for specific equipment"""
    equipment_id: str
    pattern_type: PatternType
    pattern_id: str
    match_confidence: PatternConfidence
    similarity_score: float
    matching_attributes: List[str]
    deviations: List[str]
    recommendations: List[str]
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class PatternAnalysisResult:
    """Comprehensive pattern analysis result"""
    equipment_id: str
    analysis_date: datetime
    identified_families: List[PatternMatch]
    degradation_patterns: List[PatternMatch]
    operational_patterns: List[PatternMatch]
    anomalies: List[str]
    confidence_assessment: Dict[str, float]
    parameter_recommendations: Dict[str, Any]
    risk_adjustments: Dict[str, float]


class PatternRecognitionEngine:
    """Engine for identifying equipment families and degradation patterns"""
    
    def __init__(self, prediction_tracker: Optional[PredictionTracker] = None):
        """Initialize pattern recognition engine"""
        self.logger = logging.getLogger(__name__)
        self.prediction_tracker = prediction_tracker
        
        # Pattern storage
        self._equipment_families: Dict[str, EquipmentFamily] = {}
        self._degradation_patterns: Dict[str, DegradationPattern] = {}
        self._equipment_patterns: Dict[str, List[PatternMatch]] = defaultdict(list)
        
        # Learning data
        self._historical_data: List[Dict[str, Any]] = []
        self._pattern_performance: Dict[str, Dict[str, float]] = defaultdict(dict)
        
        # Initialize with basic patterns
        self._initialize_base_patterns()
    
    def analyze_equipment_patterns(
        self,
        equipment_data: EquipmentData,
        historical_calculations: List[RBICalculationResult],
        inspection_history: Optional[List[ExtractedRBIData]] = None
    ) -> PatternAnalysisResult:
        """Analyze patterns for specific equipment"""
        
        # Identify equipment families
        family_matches = self._identify_equipment_families(
            equipment_data, historical_calculations, inspection_history
        )
        
        # Identify degradation patterns
        degradation_matches = self._identify_degradation_patterns(
            equipment_data, historical_calculations, inspection_history
        )
        
        # Identify operational patterns
        operational_matches = self._identify_operational_patterns(
            equipment_data, historical_calculations
        )
        
        # Detect anomalies
        anomalies = self._detect_anomalies(
            equipment_data, historical_calculations, family_matches
        )
        
        # Generate confidence assessment
        confidence_assessment = self._assess_pattern_confidence(
            family_matches, degradation_matches, operational_matches
        )
        
        # Generate parameter recommendations
        parameter_recommendations = self._generate_parameter_recommendations(
            family_matches, degradation_matches, equipment_data
        )
        
        # Calculate risk adjustments
        risk_adjustments = self._calculate_risk_adjustments(
            family_matches, degradation_matches, equipment_data
        )
        
        # Store pattern matches for equipment
        all_matches = family_matches + degradation_matches + operational_matches
        self._equipment_patterns[equipment_data.equipment_id] = all_matches
        
        return PatternAnalysisResult(
            equipment_id=equipment_data.equipment_id,
            analysis_date=datetime.now(),
            identified_families=family_matches,
            degradation_patterns=degradation_matches,
            operational_patterns=operational_matches,
            anomalies=anomalies,
            confidence_assessment=confidence_assessment,
            parameter_recommendations=parameter_recommendations,
            risk_adjustments=risk_adjustments
        )
    
    def learn_from_historical_data(
        self,
        equipment_data_list: List[EquipmentData],
        calculation_history: Dict[str, List[RBICalculationResult]],
        inspection_history: Optional[Dict[str, List[ExtractedRBIData]]] = None
    ) -> Dict[str, Any]:
        """Learn patterns from historical data"""
        
        learning_results = {
            "new_families_discovered": 0,
            "new_patterns_identified": 0,
            "existing_patterns_refined": 0,
            "confidence_improvements": 0,
            "learning_summary": {}
        }
        
        # Collect all historical data
        all_data = []
        for equipment in equipment_data_list:
            eq_id = equipment.equipment_id
            calculations = calculation_history.get(eq_id, [])
            inspections = inspection_history.get(eq_id, []) if inspection_history else []
            
            if calculations:  # Only process equipment with calculation history
                all_data.append({
                    "equipment": equipment,
                    "calculations": calculations,
                    "inspections": inspections
                })
        
        # Learn equipment families
        family_results = self._learn_equipment_families(all_data)
        learning_results["new_families_discovered"] = family_results["new_families"]
        learning_results["existing_patterns_refined"] += family_results["refined_families"]
        
        # Learn degradation patterns
        degradation_results = self._learn_degradation_patterns(all_data)
        learning_results["new_patterns_identified"] = degradation_results["new_patterns"]
        learning_results["existing_patterns_refined"] += degradation_results["refined_patterns"]
        
        # Update pattern performance metrics
        performance_results = self._update_pattern_performance(all_data)
        learning_results["confidence_improvements"] = performance_results["improved_patterns"]
        
        # Generate learning summary
        learning_results["learning_summary"] = {
            "total_equipment_analyzed": len(all_data),
            "total_families": len(self._equipment_families),
            "total_degradation_patterns": len(self._degradation_patterns),
            "average_family_confidence": self._calculate_average_confidence("families"),
            "average_pattern_confidence": self._calculate_average_confidence("patterns")
        }
        
        self.logger.info(f"Pattern learning completed: {learning_results['learning_summary']}")
        
        return learning_results
    
    def get_equipment_family_recommendations(
        self,
        equipment_data: EquipmentData
    ) -> List[Dict[str, Any]]:
        """Get family-based recommendations for equipment"""
        
        recommendations = []
        
        # Find matching families
        for family in self._equipment_families.values():
            if (equipment_data.equipment_type == family.equipment_type and
                equipment_data.service_type in family.service_types):
                
                similarity = self._calculate_family_similarity(equipment_data, family)
                
                if similarity > 0.6:  # Threshold for meaningful similarity
                    recommendations.append({
                        "family_id": family.family_id,
                        "family_name": family.family_name,
                        "similarity_score": similarity,
                        "recommended_parameters": family.recommended_parameters,
                        "typical_risk_profile": family.typical_risk_profile,
                        "degradation_patterns": family.degradation_patterns,
                        "confidence": family.confidence_score
                    })
        
        # Sort by similarity score
        recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def get_service_degradation_insights(
        self,
        service_type: ServiceType,
        equipment_type: Optional[EquipmentType] = None
    ) -> Dict[str, Any]:
        """Get degradation insights for specific service type"""
        
        relevant_patterns = []
        
        for pattern in self._degradation_patterns.values():
            if pattern.service_type == service_type:
                if equipment_type is None or equipment_type in pattern.equipment_types:
                    relevant_patterns.append(pattern)
        
        if not relevant_patterns:
            return {
                "service_type": service_type.value,
                "equipment_type": equipment_type.value if equipment_type else "all",
                "patterns_found": 0,
                "insights": ["No specific degradation patterns identified for this service type"],
                "recommendations": ["Collect more historical data for pattern identification"]
            }
        
        # Aggregate insights
        all_risk_factors = []
        all_environmental_factors = []
        all_mitigation_strategies = []
        timeline_data = {}
        
        for pattern in relevant_patterns:
            all_risk_factors.extend(pattern.risk_factors)
            all_environmental_factors.extend(pattern.environmental_factors)
            all_mitigation_strategies.extend(pattern.mitigation_strategies)
            
            # Aggregate timeline data
            for age, rate in pattern.typical_timeline.items():
                if age not in timeline_data:
                    timeline_data[age] = []
                timeline_data[age].append(rate)
        
        # Calculate average timeline
        average_timeline = {}
        for age, rates in timeline_data.items():
            average_timeline[age] = statistics.mean(rates)
        
        return {
            "service_type": service_type.value,
            "equipment_type": equipment_type.value if equipment_type else "all",
            "patterns_found": len(relevant_patterns),
            "common_risk_factors": list(Counter(all_risk_factors).most_common(5)),
            "environmental_factors": list(set(all_environmental_factors)),
            "mitigation_strategies": list(set(all_mitigation_strategies)),
            "typical_degradation_timeline": average_timeline,
            "average_confidence": statistics.mean([p.confidence_score for p in relevant_patterns]),
            "insights": self._generate_service_insights(relevant_patterns),
            "recommendations": self._generate_service_recommendations(relevant_patterns)
        }
    
    def update_pattern_from_feedback(
        self,
        equipment_id: str,
        pattern_id: str,
        feedback_data: Dict[str, Any],
        accuracy_score: float
    ) -> bool:
        """Update pattern based on prediction feedback"""
        
        # Find the pattern
        pattern = None
        pattern_type = None
        
        if pattern_id in self._equipment_families:
            pattern = self._equipment_families[pattern_id]
            pattern_type = "family"
        elif pattern_id in self._degradation_patterns:
            pattern = self._degradation_patterns[pattern_id]
            pattern_type = "degradation"
        
        if not pattern:
            self.logger.warning(f"Pattern {pattern_id} not found for update")
            return False
        
        # Update pattern performance
        if pattern_id not in self._pattern_performance:
            self._pattern_performance[pattern_id] = {}
        
        self._pattern_performance[pattern_id][equipment_id] = accuracy_score
        
        # Update pattern confidence based on feedback
        all_scores = list(self._pattern_performance[pattern_id].values())
        if len(all_scores) >= 3:  # Minimum data for confidence update
            new_confidence = statistics.mean(all_scores)
            pattern.confidence_score = (pattern.confidence_score + new_confidence) / 2
        
        # Update pattern characteristics based on feedback
        if pattern_type == "family" and "recommended_parameters" in feedback_data:
            self._update_family_parameters(pattern, feedback_data["recommended_parameters"])
        elif pattern_type == "degradation" and "degradation_characteristics" in feedback_data:
            self._update_degradation_characteristics(pattern, feedback_data["degradation_characteristics"])
        
        self.logger.info(f"Updated pattern {pattern_id} with feedback from {equipment_id}")
        
        return True
    
    def export_patterns(self, format_type: str = "json") -> str:
        """Export learned patterns"""
        
        export_data = {
            "export_date": datetime.now().isoformat(),
            "equipment_families": {
                family_id: family.to_dict() 
                for family_id, family in self._equipment_families.items()
            },
            "degradation_patterns": {
                pattern_id: pattern.to_dict() 
                for pattern_id, pattern in self._degradation_patterns.items()
            },
            "pattern_performance": dict(self._pattern_performance),
            "statistics": {
                "total_families": len(self._equipment_families),
                "total_degradation_patterns": len(self._degradation_patterns),
                "average_family_confidence": self._calculate_average_confidence("families"),
                "average_pattern_confidence": self._calculate_average_confidence("patterns")
            }
        }
        
        if format_type.lower() == "json":
            return json.dumps(export_data, indent=2, ensure_ascii=False)
        else:
            raise ValueError(f"Unsupported export format: {format_type}")
    
    def import_patterns(self, pattern_data: str, format_type: str = "json") -> Dict[str, int]:
        """Import patterns from external data"""
        
        if format_type.lower() != "json":
            raise ValueError(f"Unsupported import format: {format_type}")
        
        try:
            data = json.loads(pattern_data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON data: {e}")
        
        import_results = {
            "families_imported": 0,
            "patterns_imported": 0,
            "families_updated": 0,
            "patterns_updated": 0
        }
        
        # Import equipment families
        if "equipment_families" in data:
            for family_id, family_data in data["equipment_families"].items():
                if family_id in self._equipment_families:
                    # Update existing family
                    self._update_family_from_import(family_id, family_data)
                    import_results["families_updated"] += 1
                else:
                    # Create new family
                    self._create_family_from_import(family_id, family_data)
                    import_results["families_imported"] += 1
        
        # Import degradation patterns
        if "degradation_patterns" in data:
            for pattern_id, pattern_data in data["degradation_patterns"].items():
                if pattern_id in self._degradation_patterns:
                    # Update existing pattern
                    self._update_pattern_from_import(pattern_id, pattern_data)
                    import_results["patterns_updated"] += 1
                else:
                    # Create new pattern
                    self._create_pattern_from_import(pattern_id, pattern_data)
                    import_results["patterns_imported"] += 1
        
        # Import performance data
        if "pattern_performance" in data:
            for pattern_id, performance_data in data["pattern_performance"].items():
                self._pattern_performance[pattern_id].update(performance_data)
        
        self.logger.info(f"Pattern import completed: {import_results}")
        
        return import_results
    
    def get_pattern_statistics(self) -> Dict[str, Any]:
        """Get comprehensive pattern statistics"""
        
        return {
            "families": {
                "total_count": len(self._equipment_families),
                "by_equipment_type": self._count_families_by_equipment_type(),
                "average_confidence": self._calculate_average_confidence("families"),
                "high_confidence_count": self._count_high_confidence_patterns("families")
            },
            "degradation_patterns": {
                "total_count": len(self._degradation_patterns),
                "by_service_type": self._count_patterns_by_service_type(),
                "average_confidence": self._calculate_average_confidence("patterns"),
                "high_confidence_count": self._count_high_confidence_patterns("patterns")
            },
            "equipment_coverage": {
                "total_equipment_with_patterns": len(self._equipment_patterns),
                "average_patterns_per_equipment": self._calculate_average_patterns_per_equipment()
            },
            "performance_metrics": {
                "patterns_with_performance_data": len(self._pattern_performance),
                "average_pattern_accuracy": self._calculate_average_pattern_accuracy()
            }
        }    

    # Helper methods for pattern recognition
    
    def _initialize_base_patterns(self):
        """Initialize basic equipment families and degradation patterns"""
        
        # Initialize basic equipment families
        self._create_base_equipment_families()
        
        # Initialize basic degradation patterns
        self._create_base_degradation_patterns()
    
    def _create_base_equipment_families(self):
        """Create basic equipment families based on common industry knowledge"""
        
        # Pressure Vessel Family - Sour Gas Service
        sour_gas_vessels = EquipmentFamily(
            family_id="PV_SOUR_GAS",
            family_name="Pressure Vessels - Sour Gas Service",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_types={ServiceType.SOUR_GAS, ServiceType.H2S},
            common_characteristics={
                "high_pressure": True,
                "corrosive_service": True,
                "material_grade": "high_alloy",
                "inspection_frequency": "high"
            },
            degradation_patterns=["sulfide_stress_cracking", "general_corrosion", "pitting"],
            typical_risk_profile={
                "safety": 0.8,
                "environmental": 0.9,
                "economic": 0.7
            },
            recommended_parameters={
                "corrosion_allowance": 6.0,
                "inspection_interval_months": 12,
                "material_factor": 1.2
            },
            confidence_score=0.8
        )
        self._equipment_families["PV_SOUR_GAS"] = sour_gas_vessels
        
        # Tank Family - Water Service
        water_tanks = EquipmentFamily(
            family_id="TANK_WATER",
            family_name="Storage Tanks - Water Service",
            equipment_type=EquipmentType.TANK,
            service_types={ServiceType.WATER},
            common_characteristics={
                "low_pressure": True,
                "mild_service": True,
                "material_grade": "carbon_steel",
                "inspection_frequency": "medium"
            },
            degradation_patterns=["external_corrosion", "bottom_corrosion"],
            typical_risk_profile={
                "safety": 0.3,
                "environmental": 0.4,
                "economic": 0.5
            },
            recommended_parameters={
                "corrosion_allowance": 3.0,
                "inspection_interval_months": 36,
                "material_factor": 1.0
            },
            confidence_score=0.7
        )
        self._equipment_families["TANK_WATER"] = water_tanks
        
        # Pump Family - NGL Service
        ngl_pumps = EquipmentFamily(
            family_id="PUMP_NGL",
            family_name="Pumps - NGL Service",
            equipment_type=EquipmentType.PUMP,
            service_types={ServiceType.NGL},
            common_characteristics={
                "rotating_equipment": True,
                "hydrocarbon_service": True,
                "material_grade": "carbon_steel",
                "inspection_frequency": "high"
            },
            degradation_patterns=["erosion_corrosion", "cavitation", "seal_degradation"],
            typical_risk_profile={
                "safety": 0.6,
                "environmental": 0.7,
                "economic": 0.8
            },
            recommended_parameters={
                "vibration_monitoring": True,
                "inspection_interval_months": 18,
                "seal_replacement_frequency": 12
            },
            confidence_score=0.75
        )
        self._equipment_families["PUMP_NGL"] = ngl_pumps
    
    def _create_base_degradation_patterns(self):
        """Create basic degradation patterns"""
        
        # Sulfide Stress Cracking Pattern
        ssc_pattern = DegradationPattern(
            pattern_id="SULFIDE_STRESS_CRACKING",
            pattern_name="Sulfide Stress Cracking",
            service_type=ServiceType.SOUR_GAS,
            equipment_types={EquipmentType.PRESSURE_VESSEL, EquipmentType.PIPING},
            degradation_characteristics={
                "mechanism": "stress_corrosion_cracking",
                "affected_areas": ["welds", "high_stress_zones"],
                "detection_methods": ["UT", "TOFD", "visual"],
                "progression_rate": "rapid_once_initiated"
            },
            risk_factors=[
                "H2S concentration > 50 ppm",
                "high tensile stress",
                "susceptible material",
                "temperature > 60°C"
            ],
            typical_timeline={
                "0-5": 0.1,    # Years 0-5: low degradation rate
                "5-10": 0.3,   # Years 5-10: moderate rate
                "10-15": 0.7,  # Years 10-15: high rate
                "15+": 0.9     # Years 15+: very high rate
            },
            environmental_factors=[
                "H2S partial pressure",
                "temperature",
                "pH level",
                "chloride content"
            ],
            mitigation_strategies=[
                "material upgrade to NACE MR0175",
                "stress relief heat treatment",
                "cathodic protection",
                "chemical inhibition"
            ],
            confidence_score=0.85
        )
        self._degradation_patterns["SULFIDE_STRESS_CRACKING"] = ssc_pattern
        
        # General Corrosion Pattern
        general_corrosion = DegradationPattern(
            pattern_id="GENERAL_CORROSION",
            pattern_name="General Corrosion",
            service_type=ServiceType.NGL,
            equipment_types={EquipmentType.TANK, EquipmentType.PIPING, EquipmentType.PRESSURE_VESSEL},
            degradation_characteristics={
                "mechanism": "uniform_metal_loss",
                "affected_areas": ["internal_surfaces", "external_surfaces"],
                "detection_methods": ["UT_thickness", "visual"],
                "progression_rate": "steady_linear"
            },
            risk_factors=[
                "oxygen content",
                "water content",
                "temperature",
                "flow velocity"
            ],
            typical_timeline={
                "0-5": 0.2,
                "5-10": 0.4,
                "10-15": 0.6,
                "15-20": 0.8,
                "20+": 0.9
            },
            environmental_factors=[
                "humidity",
                "temperature cycling",
                "chemical composition",
                "flow conditions"
            ],
            mitigation_strategies=[
                "corrosion inhibitors",
                "protective coatings",
                "material upgrade",
                "environmental control"
            ],
            confidence_score=0.9
        )
        self._degradation_patterns["GENERAL_CORROSION"] = general_corrosion
    
    def _identify_equipment_families(
        self,
        equipment_data: EquipmentData,
        historical_calculations: List[RBICalculationResult],
        inspection_history: Optional[List[ExtractedRBIData]]
    ) -> List[PatternMatch]:
        """Identify matching equipment families"""
        
        matches = []
        
        for family_id, family in self._equipment_families.items():
            # Check basic compatibility
            if (equipment_data.equipment_type == family.equipment_type and
                equipment_data.service_type in family.service_types):
                
                # Calculate detailed similarity
                similarity = self._calculate_family_similarity(equipment_data, family)
                
                # Determine confidence level
                if similarity >= 0.8:
                    confidence = PatternConfidence.HIGH
                elif similarity >= 0.6:
                    confidence = PatternConfidence.MEDIUM
                elif similarity >= 0.4:
                    confidence = PatternConfidence.LOW
                else:
                    continue  # Skip low similarity matches
                
                # Identify matching attributes
                matching_attrs = self._identify_matching_attributes(equipment_data, family)
                
                # Identify deviations
                deviations = self._identify_family_deviations(equipment_data, family)
                
                # Generate recommendations
                recommendations = self._generate_family_recommendations(family, deviations)
                
                match = PatternMatch(
                    equipment_id=equipment_data.equipment_id,
                    pattern_type=PatternType.EQUIPMENT_FAMILY,
                    pattern_id=family_id,
                    match_confidence=confidence,
                    similarity_score=similarity,
                    matching_attributes=matching_attrs,
                    deviations=deviations,
                    recommendations=recommendations
                )
                
                matches.append(match)
        
        # Sort by similarity score
        matches.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return matches
    
    def _identify_degradation_patterns(
        self,
        equipment_data: EquipmentData,
        historical_calculations: List[RBICalculationResult],
        inspection_history: Optional[List[ExtractedRBIData]]
    ) -> List[PatternMatch]:
        """Identify applicable degradation patterns"""
        
        matches = []
        
        for pattern_id, pattern in self._degradation_patterns.items():
            # Check service type compatibility
            if equipment_data.service_type == pattern.service_type:
                # Check equipment type compatibility
                if equipment_data.equipment_type in pattern.equipment_types:
                    
                    # Calculate pattern applicability
                    applicability = self._calculate_pattern_applicability(
                        equipment_data, pattern, historical_calculations, inspection_history
                    )
                    
                    if applicability >= 0.3:  # Minimum threshold
                        # Determine confidence
                        if applicability >= 0.7:
                            confidence = PatternConfidence.HIGH
                        elif applicability >= 0.5:
                            confidence = PatternConfidence.MEDIUM
                        else:
                            confidence = PatternConfidence.LOW
                        
                        # Generate recommendations
                        recommendations = self._generate_degradation_recommendations(
                            pattern, equipment_data
                        )
                        
                        match = PatternMatch(
                            equipment_id=equipment_data.equipment_id,
                            pattern_type=PatternType.SERVICE_DEGRADATION,
                            pattern_id=pattern_id,
                            match_confidence=confidence,
                            similarity_score=applicability,
                            matching_attributes=self._get_pattern_risk_factors(pattern),
                            deviations=[],
                            recommendations=recommendations
                        )
                        
                        matches.append(match)
        
        # Sort by applicability score
        matches.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return matches
    
    def _identify_operational_patterns(
        self,
        equipment_data: EquipmentData,
        historical_calculations: List[RBICalculationResult]
    ) -> List[PatternMatch]:
        """Identify operational patterns from historical data"""
        
        matches = []
        
        if len(historical_calculations) < 3:
            return matches  # Need minimum data for pattern identification
        
        # Analyze risk level trends
        risk_trend = self._analyze_risk_trend(historical_calculations)
        if risk_trend["pattern_strength"] > 0.6:
            match = PatternMatch(
                equipment_id=equipment_data.equipment_id,
                pattern_type=PatternType.OPERATIONAL_PATTERN,
                pattern_id=f"RISK_TREND_{risk_trend['direction'].upper()}",
                match_confidence=PatternConfidence.MEDIUM,
                similarity_score=risk_trend["pattern_strength"],
                matching_attributes=[f"Risk trend: {risk_trend['direction']}"],
                deviations=[],
                recommendations=self._generate_trend_recommendations(risk_trend)
            )
            matches.append(match)
        
        # Analyze confidence patterns
        confidence_pattern = self._analyze_confidence_pattern(historical_calculations)
        if confidence_pattern["pattern_strength"] > 0.6:
            match = PatternMatch(
                equipment_id=equipment_data.equipment_id,
                pattern_type=PatternType.OPERATIONAL_PATTERN,
                pattern_id=f"CONFIDENCE_PATTERN_{confidence_pattern['type'].upper()}",
                match_confidence=PatternConfidence.MEDIUM,
                similarity_score=confidence_pattern["pattern_strength"],
                matching_attributes=[f"Confidence pattern: {confidence_pattern['type']}"],
                deviations=[],
                recommendations=self._generate_confidence_recommendations(confidence_pattern)
            )
            matches.append(match)
        
        return matches
    
    def _detect_anomalies(
        self,
        equipment_data: EquipmentData,
        historical_calculations: List[RBICalculationResult],
        family_matches: List[PatternMatch]
    ) -> List[str]:
        """Detect anomalies in equipment behavior"""
        
        anomalies = []
        
        # Check for unusual risk level variations
        if len(historical_calculations) >= 3:
            risk_levels = [calc.risk_level for calc in historical_calculations]
            risk_values = [self._risk_to_numeric(level) for level in risk_levels]
            
            if len(set(risk_values)) > 1:  # Has variation
                std_dev = statistics.stdev(risk_values)
                if std_dev > 1.0:  # High variation
                    anomalies.append("Unusual risk level variation detected")
        
        # Check for confidence score anomalies
        if historical_calculations:
            confidence_scores = [calc.confidence_score for calc in historical_calculations]
            avg_confidence = statistics.mean(confidence_scores)
            
            if avg_confidence < 0.5:
                anomalies.append("Consistently low confidence scores")
            
            # Check for sudden confidence drops
            for i in range(1, len(confidence_scores)):
                if confidence_scores[i] < confidence_scores[i-1] - 0.3:
                    anomalies.append("Sudden confidence score drop detected")
                    break
        
        # Check for family pattern deviations
        if family_matches:
            best_match = family_matches[0]
            if best_match.similarity_score < 0.6:
                anomalies.append("Equipment doesn't fit well into any known family pattern")
        
        # Check for age-related anomalies
        equipment_age = equipment_data.age_years
        if equipment_age > 25:
            anomalies.append("Equipment age exceeds typical service life")
        elif equipment_age < 1:
            anomalies.append("Very new equipment - limited historical data")
        
        return anomalies
    
    def _calculate_family_similarity(
        self,
        equipment_data: EquipmentData,
        family: EquipmentFamily
    ) -> float:
        """Calculate similarity between equipment and family"""
        
        similarity_factors = []
        
        # Basic type compatibility (already checked, so full score)
        similarity_factors.append(1.0)
        
        # Service type compatibility
        if equipment_data.service_type in family.service_types:
            similarity_factors.append(1.0)
        else:
            similarity_factors.append(0.0)
        
        # Pressure compatibility
        if "high_pressure" in family.common_characteristics:
            if equipment_data.design_pressure > 20:  # High pressure threshold
                similarity_factors.append(1.0 if family.common_characteristics["high_pressure"] else 0.5)
            else:
                similarity_factors.append(0.5 if family.common_characteristics["high_pressure"] else 1.0)
        
        # Criticality compatibility
        criticality_match = 0.5  # Default
        if equipment_data.criticality_level.lower() == "high" and "inspection_frequency" in family.common_characteristics:
            if family.common_characteristics["inspection_frequency"] == "high":
                criticality_match = 1.0
        elif equipment_data.criticality_level.lower() == "low" and "inspection_frequency" in family.common_characteristics:
            if family.common_characteristics["inspection_frequency"] == "low":
                criticality_match = 1.0
        
        similarity_factors.append(criticality_match)
        
        # Calculate weighted average
        return statistics.mean(similarity_factors)
    
    def _calculate_pattern_applicability(
        self,
        equipment_data: EquipmentData,
        pattern: DegradationPattern,
        historical_calculations: List[RBICalculationResult],
        inspection_history: Optional[List[ExtractedRBIData]]
    ) -> float:
        """Calculate how applicable a degradation pattern is to equipment"""
        
        applicability_factors = []
        
        # Service type match (already checked, so full score)
        applicability_factors.append(1.0)
        
        # Equipment type match
        if equipment_data.equipment_type in pattern.equipment_types:
            applicability_factors.append(1.0)
        else:
            applicability_factors.append(0.0)
        
        # Age factor
        age = equipment_data.age_years
        age_factor = 0.5  # Default
        
        if "typical_timeline" in pattern.__dict__ and pattern.typical_timeline:
            # Find appropriate age range
            for age_range, degradation_rate in pattern.typical_timeline.items():
                if "-" in age_range:
                    start_age, end_age = map(int, age_range.split("-"))
                    if start_age <= age <= end_age:
                        age_factor = degradation_rate
                        break
                elif age_range.endswith("+"):
                    min_age = int(age_range[:-1])
                    if age >= min_age:
                        age_factor = degradation_rate
        
        applicability_factors.append(age_factor)
        
        # Historical evidence factor
        if historical_calculations:
            # Check if historical data supports this pattern
            risk_levels = [calc.risk_level for calc in historical_calculations]
            avg_risk = statistics.mean([self._risk_to_numeric(level) for level in risk_levels])
            
            # Higher risk suggests more applicable degradation patterns
            risk_factor = min(avg_risk / 4.0, 1.0)  # Normalize to 0-1
            applicability_factors.append(risk_factor)
        
        # Inspection evidence factor
        if inspection_history:
            evidence_factor = 0.5
            for inspection in inspection_history:
                if inspection.damage_mechanisms:
                    # Check if any damage mechanisms match pattern characteristics
                    pattern_mechanisms = pattern.degradation_characteristics.get("mechanism", "").lower()
                    for mechanism in inspection.damage_mechanisms:
                        if mechanism.lower() in pattern_mechanisms:
                            evidence_factor = 1.0
                            break
            applicability_factors.append(evidence_factor)
        
        return statistics.mean(applicability_factors)
    
    def _learn_equipment_families(self, all_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Learn new equipment families from data"""
        
        results = {"new_families": 0, "refined_families": 0}
        
        # Group equipment by type and service
        equipment_groups = defaultdict(list)
        
        for data_item in all_data:
            equipment = data_item["equipment"]
            key = (equipment.equipment_type, equipment.service_type)
            equipment_groups[key].append(data_item)
        
        # Analyze each group for family patterns
        for (eq_type, service_type), group_data in equipment_groups.items():
            if len(group_data) >= 3:  # Minimum for family identification
                
                # Check if family already exists
                existing_family = None
                for family in self._equipment_families.values():
                    if (family.equipment_type == eq_type and 
                        service_type in family.service_types):
                        existing_family = family
                        break
                
                if existing_family:
                    # Refine existing family
                    self._refine_equipment_family(existing_family, group_data)
                    results["refined_families"] += 1
                else:
                    # Create new family
                    new_family = self._create_equipment_family_from_data(
                        eq_type, service_type, group_data
                    )
                    if new_family:
                        self._equipment_families[new_family.family_id] = new_family
                        results["new_families"] += 1
        
        return results
    
    def _learn_degradation_patterns(self, all_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Learn degradation patterns from data"""
        
        results = {"new_patterns": 0, "refined_patterns": 0}
        
        # Group by service type for pattern analysis
        service_groups = defaultdict(list)
        
        for data_item in all_data:
            equipment = data_item["equipment"]
            service_groups[equipment.service_type].append(data_item)
        
        # Analyze degradation patterns for each service type
        for service_type, group_data in service_groups.items():
            if len(group_data) >= 5:  # Minimum for pattern identification
                
                # Analyze common degradation characteristics
                pattern_characteristics = self._analyze_degradation_characteristics(group_data)
                
                if pattern_characteristics["confidence"] > 0.6:
                    # Check if pattern already exists
                    existing_pattern = None
                    for pattern in self._degradation_patterns.values():
                        if pattern.service_type == service_type:
                            existing_pattern = pattern
                            break
                    
                    if existing_pattern:
                        # Refine existing pattern
                        self._refine_degradation_pattern(existing_pattern, pattern_characteristics)
                        results["refined_patterns"] += 1
                    else:
                        # Create new pattern
                        new_pattern = self._create_degradation_pattern_from_data(
                            service_type, pattern_characteristics
                        )
                        if new_pattern:
                            self._degradation_patterns[new_pattern.pattern_id] = new_pattern
                            results["new_patterns"] += 1
        
        return results
    
    def _risk_to_numeric(self, risk_level: RiskLevel) -> int:
        """Convert risk level to numeric value"""
        mapping = {
            RiskLevel.LOW: 1,
            RiskLevel.MEDIUM: 2,
            RiskLevel.HIGH: 3,
            RiskLevel.VERY_HIGH: 4
        }
        return mapping.get(risk_level, 2)
    
    def _calculate_average_confidence(self, pattern_type: str) -> float:
        """Calculate average confidence for pattern type"""
        
        if pattern_type == "families":
            if not self._equipment_families:
                return 0.0
            return statistics.mean([f.confidence_score for f in self._equipment_families.values()])
        elif pattern_type == "patterns":
            if not self._degradation_patterns:
                return 0.0
            return statistics.mean([p.confidence_score for p in self._degradation_patterns.values()])
        else:
            return 0.0
    
    # Additional helper methods would continue here...
    # (Due to length constraints, I'll add the remaining methods in the next part)
    
    def _generate_family_recommendations(self, family: EquipmentFamily, deviations: List[str]) -> List[str]:
        """Generate recommendations based on family match"""
        recommendations = []
        
        if family.recommended_parameters:
            recommendations.append(f"Consider using family-specific parameters: {list(family.recommended_parameters.keys())}")
        
        if deviations:
            recommendations.append(f"Address deviations: {', '.join(deviations[:3])}")
        
        if family.degradation_patterns:
            recommendations.append(f"Monitor for typical degradation patterns: {', '.join(family.degradation_patterns[:2])}")
        
        return recommendations
    
    def _generate_degradation_recommendations(self, pattern: DegradationPattern, equipment_data: EquipmentData) -> List[str]:
        """Generate recommendations based on degradation pattern"""
        recommendations = []
        
        # Age-based recommendations
        age = equipment_data.age_years
        if age > 15:
            recommendations.append("Equipment age suggests increased monitoring frequency")
        
        # Pattern-specific recommendations
        if pattern.mitigation_strategies:
            recommendations.extend(pattern.mitigation_strategies[:2])
        
        return recommendations
    
    def _identify_matching_attributes(self, equipment_data: EquipmentData, family: EquipmentFamily) -> List[str]:
        """Identify matching attributes between equipment and family"""
        matches = []
        
        matches.append(f"Equipment type: {equipment_data.equipment_type.value}")
        matches.append(f"Service type: {equipment_data.service_type.value}")
        
        if equipment_data.design_pressure > 20 and family.common_characteristics.get("high_pressure"):
            matches.append("High pressure service")
        
        return matches
    
    def _identify_family_deviations(self, equipment_data: EquipmentData, family: EquipmentFamily) -> List[str]:
        """Identify deviations from family pattern"""
        deviations = []
        
        # This would be expanded with more sophisticated deviation detection
        if equipment_data.age_years > 20:
            deviations.append("Equipment age exceeds family average")
        
        return deviations  
  
    def _analyze_risk_trend(self, historical_calculations: List[RBICalculationResult]) -> Dict[str, Any]:
        """Analyze risk level trends in historical data"""
        
        if len(historical_calculations) < 3:
            return {"pattern_strength": 0.0, "direction": "unknown"}
        
        # Sort by timestamp
        sorted_calcs = sorted(historical_calculations, key=lambda x: x.calculation_timestamp)
        
        # Convert risk levels to numeric values
        risk_values = [self._risk_to_numeric(calc.risk_level) for calc in sorted_calcs]
        
        # Calculate trend
        n = len(risk_values)
        x_values = list(range(n))
        
        # Simple linear regression
        x_mean = statistics.mean(x_values)
        y_mean = statistics.mean(risk_values)
        
        numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, risk_values))
        denominator = sum((x - x_mean) ** 2 for x in x_values)
        
        if denominator == 0:
            slope = 0
        else:
            slope = numerator / denominator
        
        # Determine direction and strength
        if slope > 0.1:
            direction = "increasing"
        elif slope < -0.1:
            direction = "decreasing"
        else:
            direction = "stable"
        
        pattern_strength = min(abs(slope), 1.0)
        
        return {
            "pattern_strength": pattern_strength,
            "direction": direction,
            "slope": slope,
            "data_points": n
        }
    
    def _analyze_confidence_pattern(self, historical_calculations: List[RBICalculationResult]) -> Dict[str, Any]:
        """Analyze confidence score patterns"""
        
        if len(historical_calculations) < 3:
            return {"pattern_strength": 0.0, "type": "unknown"}
        
        confidence_scores = [calc.confidence_score for calc in historical_calculations]
        
        # Calculate trend
        mean_confidence = statistics.mean(confidence_scores)
        std_confidence = statistics.stdev(confidence_scores) if len(confidence_scores) > 1 else 0
        
        # Determine pattern type
        if std_confidence < 0.1:
            pattern_type = "stable"
            strength = 0.8
        elif mean_confidence > 0.8:
            pattern_type = "high_confidence"
            strength = 0.7
        elif mean_confidence < 0.5:
            pattern_type = "low_confidence"
            strength = 0.7
        else:
            pattern_type = "variable"
            strength = 0.5
        
        return {
            "pattern_strength": strength,
            "type": pattern_type,
            "mean_confidence": mean_confidence,
            "std_confidence": std_confidence
        }
    
    def _generate_trend_recommendations(self, risk_trend: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on risk trends"""
        
        recommendations = []
        
        if risk_trend["direction"] == "increasing":
            recommendations.append("Risk is increasing - consider more frequent inspections")
            recommendations.append("Investigate root causes of deteriorating conditions")
        elif risk_trend["direction"] == "decreasing":
            recommendations.append("Risk is decreasing - current maintenance strategy is effective")
        else:
            recommendations.append("Risk levels are stable - maintain current monitoring")
        
        return recommendations
    
    def _generate_confidence_recommendations(self, confidence_pattern: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on confidence patterns"""
        
        recommendations = []
        
        if confidence_pattern["type"] == "low_confidence":
            recommendations.append("Low confidence scores - improve data collection quality")
            recommendations.append("Consider upgrading inspection techniques")
        elif confidence_pattern["type"] == "variable":
            recommendations.append("Variable confidence - standardize data collection procedures")
        else:
            recommendations.append("Maintain current data collection standards")
        
        return recommendations
    
    def _get_pattern_risk_factors(self, pattern: DegradationPattern) -> List[str]:
        """Get risk factors from degradation pattern"""
        return pattern.risk_factors[:3]  # Return top 3 risk factors
    
    def _assess_pattern_confidence(
        self,
        family_matches: List[PatternMatch],
        degradation_matches: List[PatternMatch],
        operational_matches: List[PatternMatch]
    ) -> Dict[str, float]:
        """Assess overall confidence in pattern matches"""
        
        confidence_assessment = {}
        
        # Family pattern confidence
        if family_matches:
            family_confidences = [match.similarity_score for match in family_matches]
            confidence_assessment["family_patterns"] = statistics.mean(family_confidences)
        else:
            confidence_assessment["family_patterns"] = 0.0
        
        # Degradation pattern confidence
        if degradation_matches:
            degradation_confidences = [match.similarity_score for match in degradation_matches]
            confidence_assessment["degradation_patterns"] = statistics.mean(degradation_confidences)
        else:
            confidence_assessment["degradation_patterns"] = 0.0
        
        # Operational pattern confidence
        if operational_matches:
            operational_confidences = [match.similarity_score for match in operational_matches]
            confidence_assessment["operational_patterns"] = statistics.mean(operational_confidences)
        else:
            confidence_assessment["operational_patterns"] = 0.0
        
        # Overall confidence
        all_confidences = [v for v in confidence_assessment.values() if v > 0]
        if all_confidences:
            confidence_assessment["overall"] = statistics.mean(all_confidences)
        else:
            confidence_assessment["overall"] = 0.0
        
        return confidence_assessment
    
    def _generate_parameter_recommendations(
        self,
        family_matches: List[PatternMatch],
        degradation_matches: List[PatternMatch],
        equipment_data: EquipmentData
    ) -> Dict[str, Any]:
        """Generate parameter recommendations based on patterns"""
        
        recommendations = {}
        
        # Family-based recommendations
        if family_matches:
            best_family_match = family_matches[0]
            family = self._equipment_families.get(best_family_match.pattern_id)
            if family and family.recommended_parameters:
                recommendations.update(family.recommended_parameters)
        
        # Degradation pattern adjustments
        if degradation_matches:
            for match in degradation_matches[:2]:  # Top 2 patterns
                pattern = self._degradation_patterns.get(match.pattern_id)
                if pattern:
                    # Adjust inspection intervals based on pattern
                    if "inspection_interval_months" in recommendations:
                        # Reduce interval for high-risk patterns
                        if match.similarity_score > 0.7:
                            recommendations["inspection_interval_months"] *= 0.8
        
        # Age-based adjustments
        if equipment_data.age_years > 15:
            if "inspection_interval_months" in recommendations:
                recommendations["inspection_interval_months"] *= 0.9
        
        return recommendations
    
    def _calculate_risk_adjustments(
        self,
        family_matches: List[PatternMatch],
        degradation_matches: List[PatternMatch],
        equipment_data: EquipmentData
    ) -> Dict[str, float]:
        """Calculate risk adjustments based on patterns"""
        
        adjustments = {
            "pof_adjustment": 1.0,
            "cof_adjustment": 1.0,
            "confidence_adjustment": 1.0
        }
        
        # Family-based adjustments
        if family_matches:
            best_match = family_matches[0]
            if best_match.similarity_score > 0.8:
                # High similarity - increase confidence
                adjustments["confidence_adjustment"] = 1.1
            elif best_match.similarity_score < 0.5:
                # Low similarity - decrease confidence
                adjustments["confidence_adjustment"] = 0.9
        
        # Degradation pattern adjustments
        high_risk_patterns = [
            match for match in degradation_matches 
            if match.similarity_score > 0.7
        ]
        
        if high_risk_patterns:
            # Increase PoF for high-risk degradation patterns
            adjustments["pof_adjustment"] = 1.0 + (len(high_risk_patterns) * 0.1)
        
        # Age-based adjustments
        if equipment_data.age_years > 20:
            adjustments["pof_adjustment"] *= 1.2
        elif equipment_data.age_years < 5:
            adjustments["pof_adjustment"] *= 0.8
        
        return adjustments
    
    def _update_pattern_performance(self, all_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Update pattern performance metrics"""
        
        results = {"improved_patterns": 0}
        
        # This would integrate with prediction tracker to get accuracy feedback
        if self.prediction_tracker:
            # Get recent prediction accuracy data
            for data_item in all_data:
                equipment_id = data_item["equipment"].equipment_id
                
                # Get equipment accuracy assessment
                assessment = self.prediction_tracker.get_equipment_accuracy(equipment_id)
                
                if assessment.verified_predictions > 0:
                    # Update pattern performance based on accuracy
                    overall_accuracy = assessment.accuracy_metrics.get("overall_accuracy", 0.0)
                    
                    # Update family patterns
                    for pattern_match in self._equipment_patterns.get(equipment_id, []):
                        if pattern_match.pattern_type == PatternType.EQUIPMENT_FAMILY:
                            pattern_id = pattern_match.pattern_id
                            if pattern_id in self._pattern_performance:
                                old_performance = self._pattern_performance[pattern_id].get(equipment_id, 0.0)
                                if overall_accuracy > old_performance:
                                    self._pattern_performance[pattern_id][equipment_id] = overall_accuracy
                                    results["improved_patterns"] += 1
        
        return results
    
    def _generate_service_insights(self, patterns: List[DegradationPattern]) -> List[str]:
        """Generate insights from service degradation patterns"""
        
        insights = []
        
        if len(patterns) > 1:
            insights.append(f"Multiple degradation patterns identified ({len(patterns)} patterns)")
        
        # Analyze common risk factors
        all_risk_factors = []
        for pattern in patterns:
            all_risk_factors.extend(pattern.risk_factors)
        
        common_factors = Counter(all_risk_factors).most_common(3)
        if common_factors:
            insights.append(f"Most common risk factors: {', '.join([f[0] for f in common_factors])}")
        
        # Analyze confidence levels
        avg_confidence = statistics.mean([p.confidence_score for p in patterns])
        if avg_confidence > 0.8:
            insights.append("High confidence in degradation pattern identification")
        elif avg_confidence < 0.6:
            insights.append("Moderate confidence - patterns may need refinement")
        
        return insights
    
    def _generate_service_recommendations(self, patterns: List[DegradationPattern]) -> List[str]:
        """Generate recommendations from service patterns"""
        
        recommendations = []
        
        # Collect all mitigation strategies
        all_strategies = []
        for pattern in patterns:
            all_strategies.extend(pattern.mitigation_strategies)
        
        # Get most common strategies
        common_strategies = Counter(all_strategies).most_common(3)
        for strategy, count in common_strategies:
            recommendations.append(f"Consider {strategy} (applicable to {count} patterns)")
        
        return recommendations
    
    def _count_families_by_equipment_type(self) -> Dict[str, int]:
        """Count families by equipment type"""
        counts = defaultdict(int)
        for family in self._equipment_families.values():
            counts[family.equipment_type.value] += 1
        return dict(counts)
    
    def _count_patterns_by_service_type(self) -> Dict[str, int]:
        """Count patterns by service type"""
        counts = defaultdict(int)
        for pattern in self._degradation_patterns.values():
            counts[pattern.service_type.value] += 1
        return dict(counts)
    
    def _count_high_confidence_patterns(self, pattern_type: str) -> int:
        """Count high confidence patterns"""
        if pattern_type == "families":
            return sum(1 for f in self._equipment_families.values() if f.confidence_score > 0.8)
        elif pattern_type == "patterns":
            return sum(1 for p in self._degradation_patterns.values() if p.confidence_score > 0.8)
        return 0
    
    def _calculate_average_patterns_per_equipment(self) -> float:
        """Calculate average patterns per equipment"""
        if not self._equipment_patterns:
            return 0.0
        
        total_patterns = sum(len(patterns) for patterns in self._equipment_patterns.values())
        return total_patterns / len(self._equipment_patterns)
    
    def _calculate_average_pattern_accuracy(self) -> float:
        """Calculate average pattern accuracy"""
        if not self._pattern_performance:
            return 0.0
        
        all_accuracies = []
        for pattern_accuracies in self._pattern_performance.values():
            all_accuracies.extend(pattern_accuracies.values())
        
        return statistics.mean(all_accuracies) if all_accuracies else 0.0
    
    # Placeholder methods for complex operations (would be fully implemented)
    def _refine_equipment_family(self, family: EquipmentFamily, group_data: List[Dict[str, Any]]):
        """Refine existing equipment family with new data"""
        # Update confidence score based on new evidence
        family.confidence_score = min(family.confidence_score + 0.05, 1.0)
        
        # Add new equipment to family
        for data_item in group_data:
            family.member_equipment.add(data_item["equipment"].equipment_id)
    
    def _create_equipment_family_from_data(
        self, 
        eq_type: EquipmentType, 
        service_type: ServiceType, 
        group_data: List[Dict[str, Any]]
    ) -> Optional[EquipmentFamily]:
        """Create new equipment family from data"""
        
        if len(group_data) < 3:
            return None
        
        family_id = f"{eq_type.value.upper()}_{service_type.value.upper()}_LEARNED"
        
        # Analyze common characteristics
        common_chars = self._analyze_common_characteristics(group_data)
        
        return EquipmentFamily(
            family_id=family_id,
            family_name=f"Learned Family: {eq_type.value} - {service_type.value}",
            equipment_type=eq_type,
            service_types={service_type},
            common_characteristics=common_chars,
            member_equipment={item["equipment"].equipment_id for item in group_data},
            confidence_score=0.6  # Initial confidence for learned families
        )
    
    def _analyze_common_characteristics(self, group_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze common characteristics in equipment group"""
        
        characteristics = {}
        
        # Analyze pressure ranges
        pressures = [item["equipment"].design_pressure for item in group_data]
        avg_pressure = statistics.mean(pressures)
        characteristics["average_pressure"] = avg_pressure
        characteristics["high_pressure"] = avg_pressure > 20
        
        # Analyze ages
        ages = [item["equipment"].age_years for item in group_data]
        characteristics["average_age"] = statistics.mean(ages)
        
        return characteristics
    
    def _analyze_degradation_characteristics(self, group_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze degradation characteristics in service group"""
        
        characteristics = {
            "confidence": 0.5,
            "common_mechanisms": [],
            "risk_factors": [],
            "timeline": {}
        }
        
        # This would be a complex analysis of historical calculation data
        # For now, return basic structure
        
        return characteristics
    
    def _refine_degradation_pattern(self, pattern: DegradationPattern, characteristics: Dict[str, Any]):
        """Refine existing degradation pattern"""
        pattern.confidence_score = min(pattern.confidence_score + 0.05, 1.0)
    
    def _create_degradation_pattern_from_data(
        self, 
        service_type: ServiceType, 
        characteristics: Dict[str, Any]
    ) -> Optional[DegradationPattern]:
        """Create new degradation pattern from data"""
        
        if characteristics["confidence"] < 0.6:
            return None
        
        pattern_id = f"{service_type.value.upper()}_LEARNED_PATTERN"
        
        return DegradationPattern(
            pattern_id=pattern_id,
            pattern_name=f"Learned Pattern: {service_type.value}",
            service_type=service_type,
            equipment_types=set(),  # Would be populated from analysis
            degradation_characteristics=characteristics,
            risk_factors=characteristics.get("risk_factors", []),
            typical_timeline=characteristics.get("timeline", {}),
            environmental_factors=[],
            mitigation_strategies=[],
            confidence_score=characteristics["confidence"]
        )
    
    # Import/Export helper methods
    def _update_family_from_import(self, family_id: str, family_data: Dict[str, Any]):
        """Update existing family from import data"""
        family = self._equipment_families[family_id]
        family.confidence_score = max(family.confidence_score, family_data.get("confidence_score", 0.0))
        
        # Update other attributes as needed
        if "recommended_parameters" in family_data:
            family.recommended_parameters.update(family_data["recommended_parameters"])
    
    def _create_family_from_import(self, family_id: str, family_data: Dict[str, Any]):
        """Create new family from import data"""
        try:
            family = EquipmentFamily(
                family_id=family_id,
                family_name=family_data["family_name"],
                equipment_type=EquipmentType(family_data["equipment_type"]),
                service_types={ServiceType(st) for st in family_data["service_types"]},
                common_characteristics=family_data["common_characteristics"],
                member_equipment=set(family_data.get("member_equipment", [])),
                degradation_patterns=family_data.get("degradation_patterns", []),
                typical_risk_profile=family_data.get("typical_risk_profile", {}),
                recommended_parameters=family_data.get("recommended_parameters", {}),
                confidence_score=family_data.get("confidence_score", 0.0)
            )
            self._equipment_families[family_id] = family
        except (KeyError, ValueError) as e:
            self.logger.error(f"Failed to create family from import: {e}")
    
    def _update_pattern_from_import(self, pattern_id: str, pattern_data: Dict[str, Any]):
        """Update existing pattern from import data"""
        pattern = self._degradation_patterns[pattern_id]
        pattern.confidence_score = max(pattern.confidence_score, pattern_data.get("confidence_score", 0.0))
    
    def _create_pattern_from_import(self, pattern_id: str, pattern_data: Dict[str, Any]):
        """Create new pattern from import data"""
        try:
            pattern = DegradationPattern(
                pattern_id=pattern_id,
                pattern_name=pattern_data["pattern_name"],
                service_type=ServiceType(pattern_data["service_type"]),
                equipment_types={EquipmentType(et) for et in pattern_data["equipment_types"]},
                degradation_characteristics=pattern_data["degradation_characteristics"],
                risk_factors=pattern_data.get("risk_factors", []),
                typical_timeline=pattern_data.get("typical_timeline", {}),
                environmental_factors=pattern_data.get("environmental_factors", []),
                mitigation_strategies=pattern_data.get("mitigation_strategies", []),
                confidence_score=pattern_data.get("confidence_score", 0.0),
                supporting_evidence=pattern_data.get("supporting_evidence", [])
            )
            self._degradation_patterns[pattern_id] = pattern
        except (KeyError, ValueError) as e:
            self.logger.error(f"Failed to create pattern from import: {e}")
    
    def _update_family_parameters(self, family: EquipmentFamily, new_parameters: Dict[str, Any]):
        """Update family parameters based on feedback"""
        for param, value in new_parameters.items():
            if param in family.recommended_parameters:
                # Average with existing value
                old_value = family.recommended_parameters[param]
                if isinstance(old_value, (int, float)) and isinstance(value, (int, float)):
                    family.recommended_parameters[param] = (old_value + value) / 2
            else:
                family.recommended_parameters[param] = value
    
    def _update_degradation_characteristics(self, pattern: DegradationPattern, new_characteristics: Dict[str, Any]):
        """Update degradation characteristics based on feedback"""
        for char, value in new_characteristics.items():
            if char in pattern.degradation_characteristics:
                # Update existing characteristic
                pattern.degradation_characteristics[char] = value
            else:
                # Add new characteristic
                pattern.degradation_characteristics[char] = value    

    # Equipment Tag Analysis Methods for Refinery Equipment Patterns
    
    def _parse_equipment_tag(self, equipment_id: str) -> Dict[str, str]:
        """Parse refinery equipment tag to extract components
        
        Example: 101-E-401A -> {
            'unit': '101',
            'equipment_type_code': 'E', 
            'service_number': '401',
            'item_suffix': 'A'
        }
        """
        import re
        
        # Standard refinery tag pattern: XXX-Y-ZZZW
        # XXX = Unit number, Y = Equipment type, ZZZ = Service number, W = Item suffix
        pattern = r'^(\d{2,3})-([A-Z])-(\d{2,3})([A-Z]?)$'
        match = re.match(pattern, equipment_id.upper())
        
        if match:
            return {
                'unit': match.group(1),
                'equipment_type_code': match.group(2),
                'service_number': match.group(3),
                'item_suffix': match.group(4) or '',
                'base_tag': f"{match.group(1)}-{match.group(2)}-{match.group(3)}",
                'is_standard_tag': True
            }
        else:
            # Non-standard tag format
            return {
                'unit': '',
                'equipment_type_code': '',
                'service_number': '',
                'item_suffix': '',
                'base_tag': equipment_id,
                'is_standard_tag': False
            }
    
    def _find_sister_equipment(self, equipment_id: str, all_equipment_ids: List[str]) -> List[str]:
        """Find sister equipment (same service, different suffix)
        
        Example: For 101-E-401A, finds 101-E-401B, 101-E-401C, 101-E-401D
        """
        tag_info = self._parse_equipment_tag(equipment_id)
        
        if not tag_info['is_standard_tag']:
            return []
        
        base_tag = tag_info['base_tag']
        sister_equipment = []
        
        for eq_id in all_equipment_ids:
            if eq_id == equipment_id:
                continue
                
            other_tag_info = self._parse_equipment_tag(eq_id)
            if (other_tag_info['is_standard_tag'] and 
                other_tag_info['base_tag'] == base_tag):
                sister_equipment.append(eq_id)
        
        return sister_equipment
    
    def _find_parallel_equipment(self, equipment_id: str, all_equipment_ids: List[str]) -> List[str]:
        """Find parallel equipment (same type, different units)
        
        Example: For 101-E-401A, finds 101-E-101A, 101-E-201A, 101-E-301A, etc.
        """
        tag_info = self._parse_equipment_tag(equipment_id)
        
        if not tag_info['is_standard_tag']:
            return []
        
        parallel_equipment = []
        
        for eq_id in all_equipment_ids:
            if eq_id == equipment_id:
                continue
                
            other_tag_info = self._parse_equipment_tag(eq_id)
            if (other_tag_info['is_standard_tag'] and 
                other_tag_info['unit'] == tag_info['unit'] and
                other_tag_info['equipment_type_code'] == tag_info['equipment_type_code'] and
                other_tag_info['item_suffix'] == tag_info['item_suffix']):
                parallel_equipment.append(eq_id)
        
        return parallel_equipment
    
    def _create_tag_based_family(
        self, 
        equipment_data: EquipmentData,
        sister_equipment: List[str],
        parallel_equipment: List[str],
        historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Optional[EquipmentFamily]:
        """Create equipment family based on tag analysis and historical data"""
        
        tag_info = self._parse_equipment_tag(equipment_data.equipment_id)
        
        if not tag_info['is_standard_tag']:
            return None
        
        # Create family ID based on tag pattern
        family_id = f"TAG_{tag_info['unit']}_{tag_info['equipment_type_code']}_{tag_info['service_number']}"
        
        # Collect all related equipment
        all_related = [equipment_data.equipment_id] + sister_equipment + parallel_equipment
        
        # Analyze common characteristics from historical data
        common_characteristics = self._analyze_tag_based_characteristics(
            all_related, historical_data
        )
        
        # Determine typical risk profile
        typical_risk_profile = self._calculate_tag_based_risk_profile(
            all_related, historical_data
        )
        
        # Generate recommended parameters
        recommended_parameters = self._generate_tag_based_parameters(
            equipment_data, common_characteristics, typical_risk_profile
        )
        
        family = EquipmentFamily(
            family_id=family_id,
            family_name=f"Tag-based Family: {tag_info['base_tag']} Series",
            equipment_type=equipment_data.equipment_type,
            service_types={equipment_data.service_type},
            common_characteristics=common_characteristics,
            member_equipment=set(all_related),
            degradation_patterns=self._identify_tag_based_degradation_patterns(
                equipment_data, all_related, historical_data
            ),
            typical_risk_profile=typical_risk_profile,
            recommended_parameters=recommended_parameters,
            confidence_score=self._calculate_tag_based_confidence(all_related, historical_data)
        )
        
        return family
    
    def _analyze_tag_based_characteristics(
        self, 
        related_equipment: List[str], 
        historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Dict[str, Any]:
        """Analyze common characteristics from sister/parallel equipment"""
        
        characteristics = {
            'equipment_count': len(related_equipment),
            'sister_equipment_pattern': True,
            'data_availability': 'high' if len(related_equipment) > 2 else 'medium'
        }
        
        # Analyze historical risk patterns
        all_risk_levels = []
        all_confidence_scores = []
        all_intervals = []
        
        for eq_id in related_equipment:
            if eq_id in historical_data:
                for calc in historical_data[eq_id]:
                    all_risk_levels.append(self._risk_to_numeric(calc.risk_level))
                    all_confidence_scores.append(calc.confidence_score)
                    all_intervals.append(calc.inspection_interval_months)
        
        if all_risk_levels:
            characteristics.update({
                'average_risk_level': statistics.mean(all_risk_levels),
                'risk_consistency': 1.0 - (statistics.stdev(all_risk_levels) / 4.0) if len(all_risk_levels) > 1 else 1.0,
                'average_confidence': statistics.mean(all_confidence_scores),
                'typical_interval': statistics.mode(all_intervals) if all_intervals else 24
            })
        
        return characteristics
    
    def _calculate_tag_based_risk_profile(
        self, 
        related_equipment: List[str], 
        historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Dict[str, float]:
        """Calculate typical risk profile from sister equipment"""
        
        safety_scores = []
        environmental_scores = []
        economic_scores = []
        
        for eq_id in related_equipment:
            if eq_id in historical_data:
                for calc in historical_data[eq_id]:
                    if calc.cof_scores:
                        safety_scores.append(calc.cof_scores.get('safety', 0.5))
                        environmental_scores.append(calc.cof_scores.get('environmental', 0.5))
                        economic_scores.append(calc.cof_scores.get('economic', 0.5))
        
        return {
            'safety': statistics.mean(safety_scores) if safety_scores else 0.5,
            'environmental': statistics.mean(environmental_scores) if environmental_scores else 0.5,
            'economic': statistics.mean(economic_scores) if economic_scores else 0.5
        }
    
    def _generate_tag_based_parameters(
        self, 
        equipment_data: EquipmentData,
        characteristics: Dict[str, Any],
        risk_profile: Dict[str, float]
    ) -> Dict[str, Any]:
        """Generate recommended parameters based on tag analysis"""
        
        parameters = {}
        
        # Inspection interval based on sister equipment experience
        if 'typical_interval' in characteristics:
            parameters['inspection_interval_months'] = characteristics['typical_interval']
        
        # Risk consistency factor
        if 'risk_consistency' in characteristics:
            consistency = characteristics['risk_consistency']
            if consistency > 0.8:
                parameters['confidence_boost'] = 1.1  # High consistency = higher confidence
            elif consistency < 0.5:
                parameters['confidence_penalty'] = 0.9  # Low consistency = lower confidence
        
        # Sister equipment count factor
        equipment_count = characteristics.get('equipment_count', 1)
        if equipment_count > 4:
            parameters['data_richness_factor'] = 1.2  # More data = better predictions
        elif equipment_count > 2:
            parameters['data_richness_factor'] = 1.1
        
        # Service-specific adjustments
        tag_info = self._parse_equipment_tag(equipment_data.equipment_id)
        service_number = tag_info.get('service_number', '')
        
        # Heat exchangers (E) in certain services
        if tag_info.get('equipment_type_code') == 'E':
            if service_number.startswith('4'):  # Typically high-temperature service
                parameters['temperature_factor'] = 1.2
                parameters['fouling_consideration'] = True
        
        # Pumps (P) considerations
        elif tag_info.get('equipment_type_code') == 'P':
            parameters['vibration_monitoring'] = True
            parameters['seal_replacement_frequency'] = 12
        
        return parameters
    
    def _identify_tag_based_degradation_patterns(
        self, 
        equipment_data: EquipmentData,
        related_equipment: List[str],
        historical_data: Dict[str, List[RBICalculationResult]]
    ) -> List[str]:
        """Identify degradation patterns from sister equipment experience"""
        
        patterns = []
        
        # Analyze fallback occurrences in sister equipment
        fallback_count = 0
        total_calculations = 0
        
        for eq_id in related_equipment:
            if eq_id in historical_data:
                for calc in historical_data[eq_id]:
                    total_calculations += 1
                    if calc.fallback_occurred:
                        fallback_count += 1
        
        if total_calculations > 0:
            fallback_rate = fallback_count / total_calculations
            
            if fallback_rate > 0.3:
                patterns.append("data_quality_challenges")
            
            if fallback_rate > 0.5:
                patterns.append("complex_degradation_mechanisms")
        
        # Service-specific patterns
        if equipment_data.service_type == ServiceType.SOUR_GAS:
            patterns.extend(["sulfide_stress_cracking", "general_corrosion"])
        elif equipment_data.service_type == ServiceType.WATER:
            patterns.extend(["external_corrosion", "microbiological_corrosion"])
        
        # Equipment type specific patterns
        if equipment_data.equipment_type == EquipmentType.HEAT_EXCHANGER:
            patterns.extend(["tube_fouling", "thermal_fatigue"])
        elif equipment_data.equipment_type == EquipmentType.PUMP:
            patterns.extend(["erosion_corrosion", "cavitation_damage"])
        
        return list(set(patterns))  # Remove duplicates
    
    def _calculate_tag_based_confidence(
        self, 
        related_equipment: List[str], 
        historical_data: Dict[str, List[RBICalculationResult]]
    ) -> float:
        """Calculate confidence score based on sister equipment data availability"""
        
        base_confidence = 0.6  # Base confidence for tag-based families
        
        # Data availability bonus
        equipment_with_data = sum(1 for eq_id in related_equipment if eq_id in historical_data)
        data_coverage = equipment_with_data / len(related_equipment) if related_equipment else 0
        
        confidence_boost = data_coverage * 0.3  # Up to 30% boost for full data coverage
        
        # Consistency bonus
        if equipment_with_data > 1:
            all_risk_levels = []
            for eq_id in related_equipment:
                if eq_id in historical_data:
                    for calc in historical_data[eq_id]:
                        all_risk_levels.append(self._risk_to_numeric(calc.risk_level))
            
            if len(all_risk_levels) > 1:
                consistency = 1.0 - (statistics.stdev(all_risk_levels) / 4.0)
                consistency_boost = max(0, consistency - 0.5) * 0.2  # Up to 20% boost for high consistency
            else:
                consistency_boost = 0
        else:
            consistency_boost = 0
        
        final_confidence = min(1.0, base_confidence + confidence_boost + consistency_boost)
        
        return final_confidence
    
    def analyze_equipment_with_tag_intelligence(
        self,
        equipment_data: EquipmentData,
        historical_calculations: List[RBICalculationResult],
        all_equipment_data: List[EquipmentData],
        all_historical_data: Dict[str, List[RBICalculationResult]],
        inspection_history: Optional[List[ExtractedRBIData]] = None
    ) -> PatternAnalysisResult:
        """Enhanced equipment analysis using tag-based intelligence"""
        
        # Get all equipment IDs for sister/parallel equipment analysis
        all_equipment_ids = [eq.equipment_id for eq in all_equipment_data]
        
        # Find related equipment based on tags
        sister_equipment = self._find_sister_equipment(equipment_data.equipment_id, all_equipment_ids)
        parallel_equipment = self._find_parallel_equipment(equipment_data.equipment_id, all_equipment_ids)
        
        # Create or find tag-based family
        tag_based_family = self._create_tag_based_family(
            equipment_data, sister_equipment, parallel_equipment, all_historical_data
        )
        
        # Add tag-based family to temporary families for this analysis
        temp_families = self._equipment_families.copy()
        if tag_based_family:
            temp_families[tag_based_family.family_id] = tag_based_family
        
        # Perform standard analysis with enhanced families
        original_families = self._equipment_families
        self._equipment_families = temp_families
        
        try:
            # Run standard analysis
            result = self.analyze_equipment_patterns(
                equipment_data, historical_calculations, inspection_history
            )
            
            # Add tag-based insights
            if tag_based_family:
                tag_insights = self._generate_tag_based_insights(
                    equipment_data, sister_equipment, parallel_equipment, 
                    tag_based_family, all_historical_data
                )
                
                # Enhance the result with tag-based information
                result.parameter_recommendations.update(tag_insights.get('parameters', {}))
                result.risk_adjustments.update(tag_insights.get('risk_adjustments', {}))
                
                # Add tag-based anomalies
                tag_anomalies = tag_insights.get('anomalies', [])
                result.anomalies.extend(tag_anomalies)
            
            return result
            
        finally:
            # Restore original families
            self._equipment_families = original_families
    
    def _generate_tag_based_insights(
        self,
        equipment_data: EquipmentData,
        sister_equipment: List[str],
        parallel_equipment: List[str],
        tag_family: EquipmentFamily,
        all_historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Dict[str, Any]:
        """Generate insights specific to tag-based analysis"""
        
        insights = {
            'parameters': {},
            'risk_adjustments': {},
            'anomalies': []
        }
        
        # Sister equipment comparison
        if sister_equipment:
            sister_risks = []
            for eq_id in sister_equipment:
                if eq_id in all_historical_data:
                    latest_calc = max(all_historical_data[eq_id], key=lambda x: x.calculation_timestamp)
                    sister_risks.append(self._risk_to_numeric(latest_calc.risk_level))
            
            if sister_risks:
                avg_sister_risk = statistics.mean(sister_risks)
                current_risk = self._risk_to_numeric(
                    max(all_historical_data.get(equipment_data.equipment_id, []), 
                        key=lambda x: x.calculation_timestamp, 
                        default=type('obj', (object,), {'risk_level': RiskLevel.MEDIUM})()).risk_level
                )
                
                # Anomaly detection
                if abs(current_risk - avg_sister_risk) > 1.5:
                    insights['anomalies'].append(
                        f"Risk level significantly different from sister equipment "
                        f"(Current: {current_risk}, Sister avg: {avg_sister_risk:.1f})"
                    )
                
                # Risk adjustment based on sister equipment
                if avg_sister_risk > current_risk + 0.5:
                    insights['risk_adjustments']['sister_equipment_factor'] = 1.1
                elif avg_sister_risk < current_risk - 0.5:
                    insights['risk_adjustments']['sister_equipment_factor'] = 0.9
        
        # Parallel equipment insights
        if parallel_equipment:
            insights['parameters']['parallel_equipment_count'] = len(parallel_equipment)
            if len(parallel_equipment) > 3:
                insights['parameters']['maintenance_optimization'] = True
                insights['anomalies'].append(
                    f"Consider coordinated maintenance strategy for {len(parallel_equipment)} parallel units"
                )
        
        return insights 
   
    # Enhanced Tag-based Pattern Recognition with Proper Family Management
    
    def _parse_equipment_tag(self, equipment_id: str) -> Dict[str, str]:
        """Parse refinery equipment tag to extract components
        
        Example: 101-E-401A -> {
            'unit': '101',
            'equipment_type_code': 'E', 
            'service_number': '401',
            'item_suffix': 'A'
        }
        """
        import re
        
        # Standard refinery tag pattern: XXX-Y-ZZZW
        pattern = r'^(\d{2,3})-([A-Z])-(\d{2,3})([A-Z]?)$'
        match = re.match(pattern, equipment_id.upper())
        
        if match:
            return {
                'unit': match.group(1),
                'equipment_type_code': match.group(2),
                'service_number': match.group(3),
                'item_suffix': match.group(4) or '',
                'base_tag': f"{match.group(1)}-{match.group(2)}-{match.group(3)}",
                'is_standard_tag': True
            }
        else:
            return {
                'unit': '',
                'equipment_type_code': '',
                'service_number': '',
                'item_suffix': '',
                'base_tag': equipment_id,
                'is_standard_tag': False
            }
    
    def _find_sister_equipment(self, equipment_id: str, all_equipment_ids: List[str]) -> List[str]:
        """Find sister equipment (same service, different suffix)"""
        tag_info = self._parse_equipment_tag(equipment_id)
        
        if not tag_info['is_standard_tag']:
            return []
        
        base_tag = tag_info['base_tag']
        sister_equipment = []
        
        for eq_id in all_equipment_ids:
            if eq_id == equipment_id:
                continue
                
            other_tag_info = self._parse_equipment_tag(eq_id)
            if (other_tag_info['is_standard_tag'] and 
                other_tag_info['base_tag'] == base_tag):
                sister_equipment.append(eq_id)
        
        return sister_equipment
    
    def _find_parallel_equipment(self, equipment_id: str, all_equipment_ids: List[str]) -> List[str]:
        """Find parallel equipment (same type, different units)"""
        tag_info = self._parse_equipment_tag(equipment_id)
        
        if not tag_info['is_standard_tag']:
            return []
        
        parallel_equipment = []
        
        for eq_id in all_equipment_ids:
            if eq_id == equipment_id:
                continue
                
            other_tag_info = self._parse_equipment_tag(eq_id)
            if (other_tag_info['is_standard_tag'] and 
                other_tag_info['unit'] == tag_info['unit'] and
                other_tag_info['equipment_type_code'] == tag_info['equipment_type_code'] and
                other_tag_info['item_suffix'] == tag_info['item_suffix']):
                parallel_equipment.append(eq_id)
        
        return parallel_equipment
    
    def _determine_canonical_family_id(self, equipment_ids: List[str]) -> str:
        """Determine the canonical family ID for a group of equipment
        
        This prevents creating multiple families for the same group.
        Uses the lexicographically smallest base_tag as the canonical ID.
        """
        if not equipment_ids:
            return ""
        
        # Parse all tags and find unique base tags
        base_tags = set()
        for eq_id in equipment_ids:
            tag_info = self._parse_equipment_tag(eq_id)
            if tag_info['is_standard_tag']:
                base_tags.add(tag_info['base_tag'])
        
        if not base_tags:
            return ""
        
        # Use the lexicographically smallest base tag as canonical
        canonical_base_tag = min(base_tags)
        canonical_tag_info = self._parse_equipment_tag(canonical_base_tag + "A")  # Add dummy suffix for parsing
        
        return f"TAG_{canonical_tag_info['unit']}_{canonical_tag_info['equipment_type_code']}_FAMILY"
    
    def _group_related_equipment(self, all_equipment_ids: List[str]) -> Dict[str, List[str]]:
        """Group all equipment into families to prevent duplicate families
        
        This is the key method that prevents the issue you mentioned.
        """
        equipment_groups = {}
        processed_equipment = set()
        
        for eq_id in all_equipment_ids:
            if eq_id in processed_equipment:
                continue
            
            tag_info = self._parse_equipment_tag(eq_id)
            if not tag_info['is_standard_tag']:
                continue
            
            # Find all related equipment (sisters + parallels)
            sister_equipment = self._find_sister_equipment(eq_id, all_equipment_ids)
            parallel_equipment = self._find_parallel_equipment(eq_id, all_equipment_ids)
            
            # Create the complete family group
            family_members = [eq_id] + sister_equipment + parallel_equipment
            family_members = list(set(family_members))  # Remove duplicates
            
            # Determine canonical family ID
            canonical_family_id = self._determine_canonical_family_id(family_members)
            
            if canonical_family_id:
                # Check if this family already exists
                if canonical_family_id not in equipment_groups:
                    equipment_groups[canonical_family_id] = family_members
                else:
                    # Merge with existing family (shouldn't happen with proper canonical ID)
                    existing_members = set(equipment_groups[canonical_family_id])
                    new_members = set(family_members)
                    equipment_groups[canonical_family_id] = list(existing_members.union(new_members))
                
                # Mark all members as processed
                processed_equipment.update(family_members)
        
        return equipment_groups
    
    def _create_tag_based_families(
        self, 
        all_equipment_data: List[EquipmentData],
        all_historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Dict[str, EquipmentFamily]:
        """Create all tag-based families at once to prevent duplicates"""
        
        all_equipment_ids = [eq.equipment_id for eq in all_equipment_data]
        equipment_groups = self._group_related_equipment(all_equipment_ids)
        
        tag_families = {}
        
        for family_id, family_members in equipment_groups.items():
            if len(family_members) < 2:  # Skip single equipment "families"
                continue
            
            # Find a representative equipment for family characteristics
            representative_eq = None
            for eq in all_equipment_data:
                if eq.equipment_id in family_members:
                    representative_eq = eq
                    break
            
            if not representative_eq:
                continue
            
            # Create family
            family = self._create_single_tag_family(
                family_id, family_members, representative_eq, all_historical_data
            )
            
            if family:
                tag_families[family_id] = family
        
        return tag_families
    
    def _create_single_tag_family(
        self,
        family_id: str,
        family_members: List[str],
        representative_equipment: EquipmentData,
        all_historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Optional[EquipmentFamily]:
        """Create a single tag-based family"""
        
        # Analyze common characteristics
        common_characteristics = self._analyze_family_characteristics(
            family_members, all_historical_data
        )
        
        # Calculate typical risk profile
        typical_risk_profile = self._calculate_family_risk_profile(
            family_members, all_historical_data
        )
        
        # Generate recommended parameters
        recommended_parameters = self._generate_family_parameters(
            representative_equipment, common_characteristics, typical_risk_profile
        )
        
        # Determine family name
        tag_info = self._parse_equipment_tag(family_members[0])
        family_name = f"Tag Family: {tag_info['unit']}-{tag_info['equipment_type_code']}-xxx Series"
        
        family = EquipmentFamily(
            family_id=family_id,
            family_name=family_name,
            equipment_type=representative_equipment.equipment_type,
            service_types={representative_equipment.service_type},
            common_characteristics=common_characteristics,
            member_equipment=set(family_members),
            degradation_patterns=self._identify_family_degradation_patterns(
                representative_equipment, family_members, all_historical_data
            ),
            typical_risk_profile=typical_risk_profile,
            recommended_parameters=recommended_parameters,
            confidence_score=self._calculate_family_confidence(family_members, all_historical_data)
        )
        
        return family
    
    def analyze_equipment_with_tag_intelligence(
        self,
        equipment_data: EquipmentData,
        historical_calculations: List[RBICalculationResult],
        all_equipment_data: List[EquipmentData],
        all_historical_data: Dict[str, List[RBICalculationResult]],
        inspection_history: Optional[List[ExtractedRBIData]] = None
    ) -> PatternAnalysisResult:
        """Enhanced equipment analysis using tag-based intelligence
        
        This method prevents duplicate family creation by creating all families at once.
        """
        
        # Create all tag-based families at once (prevents duplicates)
        tag_families = self._create_tag_based_families(all_equipment_data, all_historical_data)
        
        # Add tag-based families to temporary families for this analysis
        temp_families = self._equipment_families.copy()
        temp_families.update(tag_families)
        
        # Perform standard analysis with enhanced families
        original_families = self._equipment_families
        self._equipment_families = temp_families
        
        try:
            # Run standard analysis
            result = self.analyze_equipment_patterns(
                equipment_data, historical_calculations, inspection_history
            )
            
            # Add tag-based insights
            tag_insights = self._generate_tag_insights(
                equipment_data, tag_families, all_historical_data
            )
            
            # Enhance the result
            if tag_insights:
                result.parameter_recommendations.update(tag_insights.get('parameters', {}))
                result.risk_adjustments.update(tag_insights.get('risk_adjustments', {}))
                result.anomalies.extend(tag_insights.get('anomalies', []))
            
            return result
            
        finally:
            # Restore original families
            self._equipment_families = original_families
    
    def _analyze_family_characteristics(
        self, 
        family_members: List[str], 
        all_historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Dict[str, Any]:
        """Analyze common characteristics from family members"""
        
        characteristics = {
            'equipment_count': len(family_members),
            'tag_based_family': True,
            'data_availability': 'high' if len(family_members) > 3 else 'medium'
        }
        
        # Analyze historical patterns
        all_risk_levels = []
        all_confidence_scores = []
        all_intervals = []
        
        for eq_id in family_members:
            if eq_id in all_historical_data:
                for calc in all_historical_data[eq_id]:
                    all_risk_levels.append(self._risk_to_numeric(calc.risk_level))
                    all_confidence_scores.append(calc.confidence_score)
                    all_intervals.append(calc.inspection_interval_months)
        
        if all_risk_levels:
            characteristics.update({
                'average_risk_level': statistics.mean(all_risk_levels),
                'risk_consistency': 1.0 - (statistics.stdev(all_risk_levels) / 4.0) if len(all_risk_levels) > 1 else 1.0,
                'average_confidence': statistics.mean(all_confidence_scores),
                'typical_interval': statistics.mode(all_intervals) if all_intervals else 24
            })
        
        return characteristics
    
    def _calculate_family_risk_profile(
        self, 
        family_members: List[str], 
        all_historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Dict[str, float]:
        """Calculate typical risk profile from family members"""
        
        safety_scores = []
        environmental_scores = []
        economic_scores = []
        
        for eq_id in family_members:
            if eq_id in all_historical_data:
                for calc in all_historical_data[eq_id]:
                    if calc.cof_scores:
                        safety_scores.append(calc.cof_scores.get('safety', 0.5))
                        environmental_scores.append(calc.cof_scores.get('environmental', 0.5))
                        economic_scores.append(calc.cof_scores.get('economic', 0.5))
        
        return {
            'safety': statistics.mean(safety_scores) if safety_scores else 0.5,
            'environmental': statistics.mean(environmental_scores) if environmental_scores else 0.5,
            'economic': statistics.mean(economic_scores) if economic_scores else 0.5
        }
    
    def _generate_family_parameters(
        self, 
        representative_equipment: EquipmentData,
        characteristics: Dict[str, Any],
        risk_profile: Dict[str, float]
    ) -> Dict[str, Any]:
        """Generate recommended parameters for the family"""
        
        parameters = {}
        
        # Base parameters from characteristics
        if 'typical_interval' in characteristics:
            parameters['inspection_interval_months'] = characteristics['typical_interval']
        
        # Family size benefits
        equipment_count = characteristics.get('equipment_count', 1)
        if equipment_count > 4:
            parameters['data_richness_factor'] = 1.2
            parameters['maintenance_coordination'] = True
        
        # Risk consistency factor
        if 'risk_consistency' in characteristics:
            consistency = characteristics['risk_consistency']
            if consistency > 0.8:
                parameters['confidence_boost'] = 1.1
        
        return parameters
    
    def _identify_family_degradation_patterns(
        self, 
        representative_equipment: EquipmentData,
        family_members: List[str],
        all_historical_data: Dict[str, List[RBICalculationResult]]
    ) -> List[str]:
        """Identify degradation patterns for the family"""
        
        patterns = []
        
        # Service-specific patterns
        if representative_equipment.service_type == ServiceType.SOUR_GAS:
            patterns.extend(["sulfide_stress_cracking", "general_corrosion"])
        elif representative_equipment.service_type == ServiceType.WATER:
            patterns.extend(["external_corrosion", "microbiological_corrosion"])
        
        # Equipment type specific patterns
        if representative_equipment.equipment_type == EquipmentType.HEAT_EXCHANGER:
            patterns.extend(["tube_fouling", "thermal_fatigue"])
        elif representative_equipment.equipment_type == EquipmentType.PUMP:
            patterns.extend(["erosion_corrosion", "cavitation_damage"])
        
        return list(set(patterns))
    
    def _calculate_family_confidence(
        self, 
        family_members: List[str], 
        all_historical_data: Dict[str, List[RBICalculationResult]]
    ) -> float:
        """Calculate confidence score for the family"""
        
        base_confidence = 0.7  # Higher base for tag-based families
        
        # Data availability bonus
        members_with_data = sum(1 for eq_id in family_members if eq_id in all_historical_data)
        data_coverage = members_with_data / len(family_members) if family_members else 0
        
        confidence_boost = data_coverage * 0.2  # Up to 20% boost
        
        # Family size bonus
        if len(family_members) > 4:
            confidence_boost += 0.1  # Additional 10% for large families
        
        return min(1.0, base_confidence + confidence_boost)
    
    def _generate_tag_insights(
        self,
        equipment_data: EquipmentData,
        tag_families: Dict[str, EquipmentFamily],
        all_historical_data: Dict[str, List[RBICalculationResult]]
    ) -> Dict[str, Any]:
        """Generate insights from tag-based analysis"""
        
        insights = {
            'parameters': {},
            'risk_adjustments': {},
            'anomalies': []
        }
        
        # Find the family this equipment belongs to
        equipment_family = None
        for family in tag_families.values():
            if equipment_data.equipment_id in family.member_equipment:
                equipment_family = family
                break
        
        if equipment_family:
            # Family-based insights
            insights['parameters']['family_size'] = len(equipment_family.member_equipment)
            
            if len(equipment_family.member_equipment) > 6:
                insights['anomalies'].append(
                    f"Large equipment family ({len(equipment_family.member_equipment)} units) - "
                    "consider coordinated maintenance strategy"
                )
        
        return insights