"""Risk matrix configuration service"""

from typing import Dict, List, Tuple, Optional
from app.domains.rbi.models.config import RiskMatrixConfig
from app.domains.rbi.models.core import RiskLevel


class RiskMatrixService:
    """Service for managing RBI risk matrix configuration"""
    
    def __init__(self, config: Optional[RiskMatrixConfig] = None):
        """Initialize with optional configuration"""
        self.config = config or RiskMatrixConfig()
    
    def get_risk_level(self, pof_level: str, cof_level: str) -> RiskLevel:
        """Get risk level from PoF and CoF levels"""
        return self.config.get_risk_level(pof_level, cof_level)
    
    def get_inspection_interval(self, risk_level: RiskLevel) -> int:
        """Get inspection interval in months for risk level"""
        return self.config.inspection_intervals.get(risk_level, 24)
    
    def set_risk_mapping(self, pof_level: str, cof_level: str, risk_level: RiskLevel) -> None:
        """Set risk level mapping for PoF and CoF combination"""
        self.config.matrix[(pof_level, cof_level)] = risk_level
    
    def set_inspection_interval(self, risk_level: RiskLevel, interval_months: int) -> None:
        """Set inspection interval for risk level"""
        if interval_months <= 0:
            raise ValueError("Inspection interval must be positive")
        self.config.inspection_intervals[risk_level] = interval_months
    
    def set_fallback_safety_factor(self, fallback_scenario: str, factor: float) -> None:
        """Set safety factor for fallback scenario"""
        if factor <= 0:
            raise ValueError("Safety factor must be positive")
        self.config.fallback_safety_factors[fallback_scenario] = factor
    
    def get_fallback_safety_factor(self, fallback_scenario: str) -> float:
        """Get safety factor for fallback scenario"""
        return self.config.fallback_safety_factors.get(fallback_scenario, 1.0)
    
    def calculate_adjusted_interval(self, base_interval: int, fallback_scenario: Optional[str] = None) -> int:
        """Calculate adjusted inspection interval with safety factors"""
        if fallback_scenario:
            safety_factor = self.get_fallback_safety_factor(fallback_scenario)
            adjusted_interval = int(base_interval / safety_factor)
            return max(adjusted_interval, 3)  # Minimum 3 months
        return base_interval
    
    def get_risk_matrix_as_dict(self) -> Dict[str, Dict[str, str]]:
        """Get risk matrix as nested dictionary for display"""
        matrix_dict = {}
        
        pof_levels = ["Low", "Medium", "High", "Very High"]
        cof_levels = ["Low", "Medium", "High"]
        
        for pof in pof_levels:
            matrix_dict[pof] = {}
            for cof in cof_levels:
                risk_level = self.get_risk_level(pof, cof)
                matrix_dict[pof][cof] = risk_level.value
        
        return matrix_dict
    
    def validate_matrix_completeness(self) -> List[str]:
        """Validate that risk matrix is complete"""
        errors = []
        
        pof_levels = ["Low", "Medium", "High", "Very High"]
        cof_levels = ["Low", "Medium", "High"]
        
        for pof in pof_levels:
            for cof in cof_levels:
                if (pof, cof) not in self.config.matrix:
                    errors.append(f"Missing risk mapping for PoF: {pof}, CoF: {cof}")
        
        # Validate inspection intervals
        for risk_level in RiskLevel:
            if risk_level not in self.config.inspection_intervals:
                errors.append(f"Missing inspection interval for risk level: {risk_level.value}")
        
        return errors
    
    def validate_interval_consistency(self) -> List[str]:
        """Validate that inspection intervals are logically consistent"""
        errors = []
        intervals = self.config.inspection_intervals
        
        # Check that higher risk levels have shorter intervals
        if RiskLevel.LOW in intervals and RiskLevel.MEDIUM in intervals:
            if intervals[RiskLevel.LOW] <= intervals[RiskLevel.MEDIUM]:
                errors.append("Low risk interval should be longer than Medium risk interval")
        
        if RiskLevel.MEDIUM in intervals and RiskLevel.HIGH in intervals:
            if intervals[RiskLevel.MEDIUM] <= intervals[RiskLevel.HIGH]:
                errors.append("Medium risk interval should be longer than High risk interval")
        
        if RiskLevel.HIGH in intervals and RiskLevel.VERY_HIGH in intervals:
            if intervals[RiskLevel.HIGH] <= intervals[RiskLevel.VERY_HIGH]:
                errors.append("High risk interval should be longer than Very High risk interval")
        
        # Check reasonable ranges
        for risk_level, interval in intervals.items():
            if interval < 1:
                errors.append(f"Interval for {risk_level.value} is too short (< 1 month)")
            elif interval > 120:  # 10 years
                errors.append(f"Interval for {risk_level.value} is too long (> 10 years)")
        
        return errors
    
    def get_risk_distribution(self) -> Dict[RiskLevel, int]:
        """Get distribution of risk levels in matrix"""
        distribution = {level: 0 for level in RiskLevel}
        
        for risk_level in self.config.matrix.values():
            distribution[risk_level] += 1
        
        return distribution
    
    def suggest_matrix_adjustments(self) -> List[str]:
        """Suggest adjustments to risk matrix based on distribution"""
        suggestions = []
        distribution = self.get_risk_distribution()
        total_combinations = sum(distribution.values())
        
        if total_combinations == 0:
            return ["Risk matrix is empty"]
        
        # Check for skewed distributions
        very_high_percentage = (distribution[RiskLevel.VERY_HIGH] / total_combinations) * 100
        if very_high_percentage > 30:
            suggestions.append("Consider reducing Very High risk assignments (>30% of matrix)")
        
        low_percentage = (distribution[RiskLevel.LOW] / total_combinations) * 100
        if low_percentage > 50:
            suggestions.append("Matrix may be too conservative with many Low risk assignments")
        
        if distribution[RiskLevel.VERY_HIGH] == 0:
            suggestions.append("Consider if any combinations should be Very High risk")
        
        return suggestions
    
    def create_conservative_matrix(self) -> None:
        """Create a conservative risk matrix"""
        # More conservative mappings
        conservative_mappings = {
            ("Low", "Low"): RiskLevel.LOW,
            ("Low", "Medium"): RiskLevel.MEDIUM,
            ("Low", "High"): RiskLevel.HIGH,
            ("Medium", "Low"): RiskLevel.MEDIUM,
            ("Medium", "Medium"): RiskLevel.HIGH,
            ("Medium", "High"): RiskLevel.VERY_HIGH,
            ("High", "Low"): RiskLevel.HIGH,
            ("High", "Medium"): RiskLevel.VERY_HIGH,
            ("High", "High"): RiskLevel.VERY_HIGH,
            ("Very High", "Low"): RiskLevel.VERY_HIGH,
            ("Very High", "Medium"): RiskLevel.VERY_HIGH,
            ("Very High", "High"): RiskLevel.VERY_HIGH
        }
        
        self.config.matrix = conservative_mappings
        
        # Conservative intervals (shorter)
        self.config.inspection_intervals = {
            RiskLevel.LOW: 24,
            RiskLevel.MEDIUM: 18,
            RiskLevel.HIGH: 9,
            RiskLevel.VERY_HIGH: 3
        }
    
    def create_balanced_matrix(self) -> None:
        """Create a balanced risk matrix (default)"""
        # This is already the default, but explicitly set
        balanced_mappings = {
            ("Low", "Low"): RiskLevel.LOW,
            ("Low", "Medium"): RiskLevel.LOW,
            ("Low", "High"): RiskLevel.MEDIUM,
            ("Medium", "Low"): RiskLevel.LOW,
            ("Medium", "Medium"): RiskLevel.MEDIUM,
            ("Medium", "High"): RiskLevel.HIGH,
            ("High", "Low"): RiskLevel.MEDIUM,
            ("High", "Medium"): RiskLevel.HIGH,
            ("High", "High"): RiskLevel.VERY_HIGH,
            ("Very High", "Low"): RiskLevel.HIGH,
            ("Very High", "Medium"): RiskLevel.VERY_HIGH,
            ("Very High", "High"): RiskLevel.VERY_HIGH
        }
        
        self.config.matrix = balanced_mappings
        
        # Balanced intervals
        self.config.inspection_intervals = {
            RiskLevel.LOW: 36,
            RiskLevel.MEDIUM: 24,
            RiskLevel.HIGH: 12,
            RiskLevel.VERY_HIGH: 6
        }
    
    def create_aggressive_matrix(self) -> None:
        """Create an aggressive (less conservative) risk matrix"""
        aggressive_mappings = {
            ("Low", "Low"): RiskLevel.LOW,
            ("Low", "Medium"): RiskLevel.LOW,
            ("Low", "High"): RiskLevel.LOW,
            ("Medium", "Low"): RiskLevel.LOW,
            ("Medium", "Medium"): RiskLevel.LOW,
            ("Medium", "High"): RiskLevel.MEDIUM,
            ("High", "Low"): RiskLevel.LOW,
            ("High", "Medium"): RiskLevel.MEDIUM,
            ("High", "High"): RiskLevel.HIGH,
            ("Very High", "Low"): RiskLevel.MEDIUM,
            ("Very High", "Medium"): RiskLevel.HIGH,
            ("Very High", "High"): RiskLevel.VERY_HIGH
        }
        
        self.config.matrix = aggressive_mappings
        
        # Longer intervals
        self.config.inspection_intervals = {
            RiskLevel.LOW: 48,
            RiskLevel.MEDIUM: 36,
            RiskLevel.HIGH: 18,
            RiskLevel.VERY_HIGH: 12
        }
    
    def export_configuration(self) -> Dict:
        """Export risk matrix configuration"""
        return {
            "matrix": {
                f"{pof},{cof}": risk_level.value
                for (pof, cof), risk_level in self.config.matrix.items()
            },
            "inspection_intervals": {
                risk_level.value: interval
                for risk_level, interval in self.config.inspection_intervals.items()
            },
            "fallback_safety_factors": self.config.fallback_safety_factors.copy()
        }
    
    def import_configuration(self, config_dict: Dict) -> None:
        """Import risk matrix configuration"""
        # Import matrix
        if "matrix" in config_dict:
            self.config.matrix = {}
            for key, risk_level_str in config_dict["matrix"].items():
                pof, cof = key.split(",")
                risk_level = RiskLevel(risk_level_str)
                self.config.matrix[(pof, cof)] = risk_level
        
        # Import inspection intervals
        if "inspection_intervals" in config_dict:
            self.config.inspection_intervals = {}
            for risk_level_str, interval in config_dict["inspection_intervals"].items():
                risk_level = RiskLevel(risk_level_str)
                self.config.inspection_intervals[risk_level] = interval
        
        # Import fallback safety factors
        if "fallback_safety_factors" in config_dict:
            self.config.fallback_safety_factors = config_dict["fallback_safety_factors"].copy()
    
    def get_matrix_statistics(self) -> Dict:
        """Get statistics about the risk matrix"""
        distribution = self.get_risk_distribution()
        total = sum(distribution.values())
        
        return {
            "total_combinations": total,
            "risk_distribution": {
                level.value: {
                    "count": count,
                    "percentage": (count / total * 100) if total > 0 else 0
                }
                for level, count in distribution.items()
            },
            "average_interval": sum(self.config.inspection_intervals.values()) / len(self.config.inspection_intervals),
            "interval_range": {
                "min": min(self.config.inspection_intervals.values()),
                "max": max(self.config.inspection_intervals.values())
            }
        }