"""Example of configuring Level 1 RBI settings"""

from datetime import datetime
from app.domains.rbi.models.config import RBIConfig, Level1Settings
from app.domains.rbi.models.core import EquipmentData, EquipmentType, ServiceType
from app.domains.rbi.services.level1_calculator import Level1Calculator
from app.domains.rbi.services.config_manager import RBIConfigManager


def demonstrate_default_settings():
    """Show default Level 1 settings"""
    print("=== Default Level 1 Settings ===")
    
    config = RBIConfig()
    calculator = Level1Calculator(config)
    
    print("Base Intervals (months):")
    for equipment_type, interval in config.level1_settings.base_intervals.items():
        print(f"  {equipment_type}: {interval}")
    
    print("\nService Modifiers:")
    for service_type, modifier in config.level1_settings.service_modifiers.items():
        print(f"  {service_type}: {modifier}")
    
    print("\nCriticality Modifiers:")
    for criticality, modifier in config.level1_settings.criticality_modifiers.items():
        print(f"  {criticality}: {modifier}")
    
    print("\nEmergency Intervals (months):")
    for equipment_type, interval in config.level1_settings.emergency_intervals.items():
        print(f"  {equipment_type}: {interval}")


def demonstrate_custom_settings():
    """Show how admin can customize Level 1 settings"""
    print("\n=== Custom Level 1 Settings ===")
    
    # Create custom Level 1 settings
    custom_level1_settings = Level1Settings(
        base_intervals={
            "pressure_vessel": 48,  # More frequent than default (60)
            "piping": 60,          # More frequent than default (72)
            "heat_exchanger": 36,  # More frequent than default (48)
            "pump": 24,            # More frequent than default (36)
            "compressor": 18,      # More frequent than default (24)
            "tank": 72             # More frequent than default (84)
        },
        service_modifiers={
            "sour_gas": 0.5,       # More conservative than default (0.6)
            "h2s": 0.4,            # More conservative than default (0.5)
            "amine": 0.6,          # More conservative than default (0.7)
            "sweet_gas": 0.9,      # More conservative than default (1.0)
            "water": 1.1,          # More conservative than default (1.2)
            "steam": 1.0,          # More conservative than default (1.1)
            "nitrogen": 1.3,       # More conservative than default (1.5)
            "condensate": 0.7,     # More conservative than default (0.8)
            "sulfur_vapor": 0.4,   # More conservative than default (0.5)
            "elemental_sulfur": 0.6,
            "ngl": 0.8,
            "methanol": 0.7,
            "glycol": 0.8,
            "mercaptans": 0.5
        },
        criticality_modifiers={
            "Critical": 0.4,       # More conservative than default (0.5)
            "High": 0.6,           # More conservative than default (0.7)
            "Medium": 0.9,         # More conservative than default (1.0)
            "Low": 1.3             # More conservative than default (1.5)
        },
        emergency_intervals={
            "pressure_vessel": 6,  # More frequent than default (12)
            "piping": 9,           # More frequent than default (18)
            "heat_exchanger": 6,   # More frequent than default (12)
            "pump": 3,             # More frequent than default (6)
            "compressor": 3,       # More frequent than default (6)
            "tank": 12             # More frequent than default (24)
        }
    )
    
    # Create config with custom settings
    custom_config = RBIConfig(level1_settings=custom_level1_settings)
    
    print("Custom Base Intervals (months):")
    for equipment_type, interval in custom_config.level1_settings.base_intervals.items():
        print(f"  {equipment_type}: {interval}")
    
    print("\nCustom Service Modifiers:")
    for service_type, modifier in custom_config.level1_settings.service_modifiers.items():
        print(f"  {service_type}: {modifier}")
    
    return custom_config


def compare_calculations():
    """Compare calculations with default vs custom settings"""
    print("\n=== Calculation Comparison ===")
    
    # Test equipment
    equipment = EquipmentData(
        equipment_id="V-TEST",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime(2015, 1, 1),
        design_pressure=25.0,
        design_temperature=150.0,
        material="CS",
        criticality_level="High"
    )
    
    # Default calculation
    default_config = RBIConfig()
    default_calculator = Level1Calculator(default_config)
    default_result = default_calculator.calculate(equipment)
    
    # Custom calculation
    custom_config = demonstrate_custom_settings()
    custom_calculator = Level1Calculator(custom_config)
    custom_result = custom_calculator.calculate(equipment)
    
    print(f"\nEquipment: {equipment.equipment_id}")
    print(f"Type: {equipment.equipment_type.value}")
    print(f"Service: {equipment.service_type.value}")
    print(f"Criticality: {equipment.criticality_level}")
    
    print(f"\nDefault Settings:")
    print(f"  Inspection Interval: {default_result.inspection_interval_months} months")
    print(f"  Risk Level: {default_result.risk_level.value}")
    print(f"  PoF Score: {default_result.pof_score:.1f}")
    
    print(f"\nCustom Settings (More Conservative):")
    print(f"  Inspection Interval: {custom_result.inspection_interval_months} months")
    print(f"  Risk Level: {custom_result.risk_level.value}")
    print(f"  PoF Score: {custom_result.pof_score:.1f}")
    
    print(f"\nDifference:")
    interval_diff = default_result.inspection_interval_months - custom_result.inspection_interval_months
    print(f"  Interval Reduction: {interval_diff} months")
    print(f"  More Conservative: {'Yes' if interval_diff > 0 else 'No'}")


def demonstrate_config_management():
    """Show how to manage Level 1 settings through config manager"""
    print("\n=== Configuration Management ===")
    
    # Create config manager
    config_manager = RBIConfigManager()
    
    # Validate current configuration
    validation_results = config_manager.validate_complete_configuration()
    level1_errors = validation_results.get("level1_settings", [])
    
    print(f"Level 1 Settings Validation:")
    if level1_errors:
        print("  Errors found:")
        for error in level1_errors:
            print(f"    - {error}")
    else:
        print("  ✓ All settings are valid")
    
    # Export configuration
    exported_config = config_manager.export_configuration()
    level1_config = exported_config.get("level1_settings", {})
    
    print(f"\nExported Level 1 Configuration:")
    print(f"  Base intervals: {len(level1_config.get('base_intervals', {}))} equipment types")
    print(f"  Service modifiers: {len(level1_config.get('service_modifiers', {}))} service types")
    print(f"  Criticality modifiers: {len(level1_config.get('criticality_modifiers', {}))} levels")
    print(f"  Emergency intervals: {len(level1_config.get('emergency_intervals', {}))} equipment types")
    
    # Show how admin can modify settings
    print(f"\nAdmin can modify settings by:")
    print(f"  1. Updating base_intervals for different equipment types")
    print(f"  2. Adjusting service_modifiers for aggressive/mild services")
    print(f"  3. Setting criticality_modifiers for different risk levels")
    print(f"  4. Configuring emergency_intervals for fallback scenarios")


def demonstrate_validation():
    """Show validation of Level 1 settings"""
    print("\n=== Settings Validation ===")
    
    # Create invalid settings to show validation
    try:
        invalid_settings = Level1Settings(
            base_intervals={
                "pressure_vessel": -10,  # Invalid: negative
                "piping": 300,           # Invalid: too high
            },
            service_modifiers={
                "sour_gas": -0.5,        # Invalid: negative
                "sweet_gas": 5.0,        # Invalid: too high
            },
            criticality_modifiers={
                "Critical": 0,           # Invalid: zero
                "High": 4.0,             # Invalid: too high
            }
        )
        
        errors = invalid_settings.validate_settings()
        print("Validation Errors:")
        for error in errors:
            print(f"  - {error}")
            
    except Exception as e:
        print(f"Settings creation failed: {e}")
    
    # Show valid settings
    valid_settings = Level1Settings()  # Uses defaults
    errors = valid_settings.validate_settings()
    print(f"\nDefault Settings Validation: {'✓ Valid' if not errors else 'Errors found'}")


if __name__ == "__main__":
    demonstrate_default_settings()
    demonstrate_custom_settings()
    compare_calculations()
    demonstrate_config_management()
    demonstrate_validation()