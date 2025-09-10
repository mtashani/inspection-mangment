"""Equipment data service for RBI calculations"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from app.domains.rbi.models.core import (
    EquipmentData, 
    EquipmentType, 
    ServiceType
)


class OperatingConditions:
    """Operating conditions data structure"""
    
    def __init__(
        self,
        operating_pressure: float,
        operating_temperature: float,
        flow_rate: Optional[float] = None,
        ph_level: Optional[float] = None,
        h2s_content: Optional[float] = None,
        co2_content: Optional[float] = None,
        water_content: Optional[float] = None
    ):
        self.operating_pressure = operating_pressure
        self.operating_temperature = operating_temperature
        self.flow_rate = flow_rate
        self.ph_level = ph_level
        self.h2s_content = h2s_content
        self.co2_content = co2_content
        self.water_content = water_content
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "operating_pressure": self.operating_pressure,
            "operating_temperature": self.operating_temperature,
            "flow_rate": self.flow_rate,
            "ph_level": self.ph_level,
            "h2s_content": self.h2s_content,
            "co2_content": self.co2_content,
            "water_content": self.water_content
        }


class DesignParameters:
    """Design parameters data structure"""
    
    def __init__(
        self,
        design_pressure: float,
        design_temperature: float,
        material: str,
        wall_thickness: float,
        diameter: Optional[float] = None,
        length: Optional[float] = None,
        volume: Optional[float] = None,
        design_code: Optional[str] = None,
        corrosion_allowance: Optional[float] = None
    ):
        self.design_pressure = design_pressure
        self.design_temperature = design_temperature
        self.material = material
        self.wall_thickness = wall_thickness
        self.diameter = diameter
        self.length = length
        self.volume = volume
        self.design_code = design_code
        self.corrosion_allowance = corrosion_allowance
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "design_pressure": self.design_pressure,
            "design_temperature": self.design_temperature,
            "material": self.material,
            "wall_thickness": self.wall_thickness,
            "diameter": self.diameter,
            "length": self.length,
            "volume": self.volume,
            "design_code": self.design_code,
            "corrosion_allowance": self.corrosion_allowance
        }


class EquipmentDataService:
    """Service for retrieving equipment master data"""
    
    def __init__(self):
        """Initialize equipment data service"""
        # In a real implementation, this would connect to equipment database
        self._equipment_cache: Dict[str, EquipmentData] = {}
        self._operating_conditions_cache: Dict[str, OperatingConditions] = {}
        self._design_parameters_cache: Dict[str, DesignParameters] = {}
        
        # Initialize with some sample data for testing
        self._initialize_sample_data()
    
    def get_equipment_master_data(self, equipment_id: str) -> Optional[EquipmentData]:
        """Get equipment master data by ID"""
        if equipment_id in self._equipment_cache:
            return self._equipment_cache[equipment_id]
        
        # In real implementation, this would query the equipment database
        # For now, return None if not found in cache
        return None
    
    def get_operating_conditions(self, equipment_id: str) -> Optional[OperatingConditions]:
        """Get current operating conditions for equipment"""
        if equipment_id in self._operating_conditions_cache:
            return self._operating_conditions_cache[equipment_id]
        
        # In real implementation, this would query process data systems
        return None
    
    def get_design_parameters(self, equipment_id: str) -> Optional[DesignParameters]:
        """Get design parameters for equipment"""
        if equipment_id in self._design_parameters_cache:
            return self._design_parameters_cache[equipment_id]
        
        # In real implementation, this would query engineering database
        return None
    
    def add_equipment(self, equipment_data: EquipmentData) -> None:
        """Add equipment to the system"""
        self._equipment_cache[equipment_data.equipment_id] = equipment_data
    
    def add_operating_conditions(self, equipment_id: str, conditions: OperatingConditions) -> None:
        """Add operating conditions for equipment"""
        self._operating_conditions_cache[equipment_id] = conditions
    
    def add_design_parameters(self, equipment_id: str, parameters: DesignParameters) -> None:
        """Add design parameters for equipment"""
        self._design_parameters_cache[equipment_id] = parameters
    
    def get_equipment_list(self, equipment_type: Optional[EquipmentType] = None) -> List[str]:
        """Get list of equipment IDs, optionally filtered by type"""
        if equipment_type is None:
            return list(self._equipment_cache.keys())
        
        return [
            eq_id for eq_id, eq_data in self._equipment_cache.items()
            if eq_data.equipment_type == equipment_type
        ]
    
    def get_equipment_by_service(self, service_type: ServiceType) -> List[str]:
        """Get equipment IDs by service type"""
        return [
            eq_id for eq_id, eq_data in self._equipment_cache.items()
            if eq_data.service_type == service_type
        ]
    
    def get_equipment_summary(self, equipment_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive equipment summary"""
        equipment = self.get_equipment_master_data(equipment_id)
        if not equipment:
            return None
        
        operating_conditions = self.get_operating_conditions(equipment_id)
        design_parameters = self.get_design_parameters(equipment_id)
        
        summary = {
            "equipment_id": equipment.equipment_id,
            "equipment_type": equipment.equipment_type.value,
            "service_type": equipment.service_type.value,
            "age_years": equipment.age_years,
            "criticality_level": equipment.criticality_level,
            "location": equipment.location,
            "installation_date": equipment.installation_date.isoformat(),
            "operating_conditions": operating_conditions.to_dict() if operating_conditions else None,
            "design_parameters": design_parameters.to_dict() if design_parameters else None
        }
        
        return summary
    
    def validate_equipment_data(self, equipment_id: str) -> Dict[str, List[str]]:
        """Validate equipment data completeness"""
        validation_results = {
            "missing_master_data": [],
            "missing_operating_conditions": [],
            "missing_design_parameters": [],
            "data_quality_issues": []
        }
        
        # Check master data
        equipment = self.get_equipment_master_data(equipment_id)
        if not equipment:
            validation_results["missing_master_data"].append("Equipment master data not found")
            return validation_results
        
        # Check operating conditions
        operating_conditions = self.get_operating_conditions(equipment_id)
        if not operating_conditions:
            validation_results["missing_operating_conditions"].append("Operating conditions not available")
        else:
            if operating_conditions.operating_pressure <= 0:
                validation_results["data_quality_issues"].append("Invalid operating pressure")
            if operating_conditions.operating_temperature < -273:  # Below absolute zero
                validation_results["data_quality_issues"].append("Invalid operating temperature")
        
        # Check design parameters
        design_parameters = self.get_design_parameters(equipment_id)
        if not design_parameters:
            validation_results["missing_design_parameters"].append("Design parameters not available")
        else:
            if design_parameters.design_pressure <= 0:
                validation_results["data_quality_issues"].append("Invalid design pressure")
            if design_parameters.wall_thickness <= 0:
                validation_results["data_quality_issues"].append("Invalid wall thickness")
        
        # Check data consistency
        if operating_conditions and design_parameters:
            if operating_conditions.operating_pressure > design_parameters.design_pressure * 1.1:
                validation_results["data_quality_issues"].append(
                    "Operating pressure exceeds design pressure"
                )
            if operating_conditions.operating_temperature > design_parameters.design_temperature + 50:
                validation_results["data_quality_issues"].append(
                    "Operating temperature significantly exceeds design temperature"
                )
        
        return validation_results
    
    def get_equipment_statistics(self) -> Dict[str, Any]:
        """Get statistics about equipment in the system"""
        total_equipment = len(self._equipment_cache)
        
        # Count by equipment type
        type_counts = {}
        for equipment in self._equipment_cache.values():
            eq_type = equipment.equipment_type.value
            type_counts[eq_type] = type_counts.get(eq_type, 0) + 1
        
        # Count by service type
        service_counts = {}
        for equipment in self._equipment_cache.values():
            service_type = equipment.service_type.value
            service_counts[service_type] = service_counts.get(service_type, 0) + 1
        
        # Count by criticality
        criticality_counts = {}
        for equipment in self._equipment_cache.values():
            criticality = equipment.criticality_level
            criticality_counts[criticality] = criticality_counts.get(criticality, 0) + 1
        
        # Calculate age distribution
        current_year = datetime.now().year
        age_ranges = {"0-5": 0, "5-10": 0, "10-15": 0, "15-25": 0, "25+": 0}
        
        for equipment in self._equipment_cache.values():
            age = equipment.age_years
            if age < 5:
                age_ranges["0-5"] += 1
            elif age < 10:
                age_ranges["5-10"] += 1
            elif age < 15:
                age_ranges["10-15"] += 1
            elif age < 25:
                age_ranges["15-25"] += 1
            else:
                age_ranges["25+"] += 1
        
        return {
            "total_equipment": total_equipment,
            "equipment_by_type": type_counts,
            "equipment_by_service": service_counts,
            "equipment_by_criticality": criticality_counts,
            "age_distribution": age_ranges,
            "data_completeness": {
                "with_operating_conditions": len(self._operating_conditions_cache),
                "with_design_parameters": len(self._design_parameters_cache)
            }
        }
    
    def search_equipment(self, search_criteria: Dict[str, Any]) -> List[str]:
        """Search equipment based on criteria"""
        results = []
        
        for eq_id, equipment in self._equipment_cache.items():
            match = True
            
            # Check equipment type
            if "equipment_type" in search_criteria:
                if equipment.equipment_type != search_criteria["equipment_type"]:
                    match = False
                    continue
            
            # Check service type
            if "service_type" in search_criteria:
                if equipment.service_type != search_criteria["service_type"]:
                    match = False
                    continue
            
            # Check criticality level
            if "criticality_level" in search_criteria:
                if equipment.criticality_level != search_criteria["criticality_level"]:
                    match = False
                    continue
            
            # Check age range
            if "min_age" in search_criteria:
                if equipment.age_years < search_criteria["min_age"]:
                    match = False
                    continue
            
            if "max_age" in search_criteria:
                if equipment.age_years > search_criteria["max_age"]:
                    match = False
                    continue
            
            # Check location
            if "location" in search_criteria:
                if equipment.location != search_criteria["location"]:
                    match = False
                    continue
            
            if match:
                results.append(eq_id)
        
        return results
    
    def _initialize_sample_data(self) -> None:
        """Initialize with sample data for testing"""
        # Sample equipment data
        sample_equipment = [
            EquipmentData(
                equipment_id="V-101",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime(2010, 1, 15),
                design_pressure=25.0,
                design_temperature=150.0,
                material="CS",
                criticality_level="High",
                coating_type="Epoxy",
                location="open_area",
                inventory_size=50.0
            ),
            EquipmentData(
                equipment_id="E-201",
                equipment_type=EquipmentType.HEAT_EXCHANGER,
                service_type=ServiceType.SWEET_GAS,
                installation_date=datetime(2015, 6, 10),
                design_pressure=15.0,
                design_temperature=120.0,
                material="SS316",
                criticality_level="Medium",
                location="safe",
                inventory_size=25.0
            ),
            EquipmentData(
                equipment_id="P-301",
                equipment_type=EquipmentType.PUMP,
                service_type=ServiceType.AMINE,
                installation_date=datetime(2018, 3, 20),
                design_pressure=10.0,
                design_temperature=80.0,
                material="CS",
                criticality_level="Low",
                location="open_area",
                inventory_size=5.0
            )
        ]
        
        for equipment in sample_equipment:
            self.add_equipment(equipment)
        
        # Sample operating conditions
        self.add_operating_conditions("V-101", OperatingConditions(
            operating_pressure=22.0,
            operating_temperature=140.0,
            flow_rate=1000.0,
            ph_level=6.5,
            h2s_content=5000.0,  # ppm
            co2_content=2.0,     # %
            water_content=100.0  # ppm
        ))
        
        self.add_operating_conditions("E-201", OperatingConditions(
            operating_pressure=12.0,
            operating_temperature=110.0,
            flow_rate=800.0,
            ph_level=7.0
        ))
        
        self.add_operating_conditions("P-301", OperatingConditions(
            operating_pressure=8.0,
            operating_temperature=75.0,
            flow_rate=500.0,
            ph_level=8.5
        ))
        
        # Sample design parameters
        self.add_design_parameters("V-101", DesignParameters(
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            wall_thickness=12.0,
            diameter=2.5,
            length=6.0,
            volume=50.0,
            design_code="ASME VIII",
            corrosion_allowance=3.0
        ))
        
        self.add_design_parameters("E-201", DesignParameters(
            design_pressure=15.0,
            design_temperature=120.0,
            material="SS316",
            wall_thickness=8.0,
            diameter=1.5,
            length=4.0,
            volume=25.0,
            design_code="ASME VIII",
            corrosion_allowance=1.5
        ))
        
        self.add_design_parameters("P-301", DesignParameters(
            design_pressure=10.0,
            design_temperature=80.0,
            material="CS",
            wall_thickness=6.0,
            design_code="API 610",
            corrosion_allowance=1.0
        ))