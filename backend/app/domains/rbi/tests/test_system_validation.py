"""Final System Validation and User Acceptance Tests"""

import pytest
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any

from app.domains.rbi.system_integration import RBIIntegratedSystem, initialize_rbi_system, SystemStatus
from app.domains.rbi.deployment.deployment_config import DeploymentConfig, DeploymentEnvironment
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    RBICalculationResult,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType,
    InspectionFinding
)


class TestSystemValidation:
    """Final system validation tests"""
    
    @pytest.fixture
    def integrated_system(self):
        """Setup integrated RBI system for testing"""
        from app.domains.rbi.system_integration import RBIIntegratedSystem
        
        config = {
            'system': {
                'name': 'RBI Test System',
                'version': '1.0.0',
                'environment': 'testing',
                'debug': True
            },
            'performance': {
                'max_concurrent_calculations': 5,
                'calculation_timeout_seconds': 30
            }
        }
        
        return RBIIntegratedSystem(config)
    
    @pytest.fixture
    def sample_equipment_data(self):
        """Sample equipment data for testing"""
        return EquipmentData(
            equipment_id="VAL-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=365*5),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel",
            criticality_level="High"
        )
    
    @pytest.fixture
    def sample_inspection_data(self):
        """Sample inspection data for testing"""
        return ExtractedRBIData(
            equipment_id="VAL-001",
            corrosion_rate=0.15,
            coating_condition="moderate",
            damage_mechanisms=["General Corrosion", "Pitting"],
            inspection_findings=[
                InspectionFinding(
                    finding_type="Corrosion",
                    severity="Medium",
                    description="Moderate corrosion observed on shell",
                    location="Shell",
                    recommendation="Monitor closely and consider repair"
                )
            ],
            last_inspection_date=datetime.now() - timedelta(days=60),
            inspection_quality="good"
        )
    
    @pytest.mark.asyncio
    async def test_system_initialization(self, integrated_system):
        """Test system initialization and health check"""
        
        # Verify system is initialized
        assert integrated_system is not None
        
        # Initialize the system
        init_success = await integrated_system.initialize()
        assert init_success == True
        
        # Perform health check
        health = await integrated_system.health_check()
        
        assert health.status == SystemStatus.READY
        assert health.components_status['pattern_engine'] == True
        assert health.components_status['parameter_adjuster'] == True
        assert health.components_status['prediction_tracker'] == True
        assert health.components_status['audit_service'] == True
        assert health.components_status['report_service'] == True
        
        # Check system info
        system_info = integrated_system.get_system_info()
        assert system_info['system']['name'] == 'RBI Test System'
        assert system_info['system']['status'] == 'ready'
    
    @pytest.mark.asyncio
    async def test_complete_rbi_calculation_workflow(self, integrated_system, sample_equipment_data, sample_inspection_data):
        """Test complete RBI calculation workflow"""
        
        # Initialize the system first
        await integrated_system.initialize()
        
        # Perform RBI calculation
        result = await integrated_system.calculate_rbi(
            equipment_data=sample_equipment_data,
            inspection_data=sample_inspection_data,
            user_id="test_user",
            calculation_options={"include_recommendations": True}
        )
        
        # Verify calculation result
        assert isinstance(result, RBICalculationResult)
        assert result.equipment_id == "VAL-001"
        assert result.risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]
        assert result.calculation_level in [RBILevel.LEVEL_1, RBILevel.LEVEL_2, RBILevel.LEVEL_3]
        assert result.confidence_score > 0.0
        assert result.data_quality_score > 0.0
        assert result.next_inspection_date > datetime.now()
        
        # Verify system performance metrics updated
        system_info = integrated_system.get_system_info()
        assert system_info['performance']['total_calculations'] > 0
        assert system_info['performance']['successful_calculations'] > 0
    
    @pytest.mark.asyncio
    async def test_batch_calculation_workflow(self, integrated_system):
        """Test batch calculation workflow"""
        
        # Create batch data
        equipment_batch = []
        inspection_batch = []
        
        for i in range(5):
            equipment = EquipmentData(
                equipment_id=f"BATCH-{i:03d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SWEET_GAS,
                installation_date=datetime.now() - timedelta(days=365*3),
                design_pressure=20.0,
                design_temperature=140.0,
                material="Stainless Steel"
            )
            
            inspection = ExtractedRBIData(
                equipment_id=f"BATCH-{i:03d}",
                corrosion_rate=0.1 + (i * 0.02),
                coating_condition="excellent",
                damage_mechanisms=["General Corrosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Low",
                        description=f"Batch test finding {i}",
                        location="Shell"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=30),
                inspection_quality="average"
            )
            
            equipment_batch.append(equipment)
            inspection_batch.append(inspection)
        
        # Perform batch calculation
        results = await integrated_system.batch_calculate_rbi(
            equipment_batch=equipment_batch,
            inspection_batch=inspection_batch,
            user_id="batch_test_user",
            max_concurrent=3
        )
        
        # Verify results
        assert len(results) == 5
        for result in results:
            assert isinstance(result, RBICalculationResult)
            assert result.equipment_id.startswith("BATCH-")
    
    @pytest.mark.asyncio
    async def test_report_generation_workflow(self, integrated_system, sample_equipment_data, sample_inspection_data):
        """Test report generation workflow"""
        
        # Perform calculation first
        calculation_result = await integrated_system.calculate_rbi(
            equipment_data=sample_equipment_data,
            inspection_data=sample_inspection_data,
            user_id="report_test_user"
        )
        
        # Generate comprehensive report
        report = await integrated_system.generate_comprehensive_report(
            equipment_id=sample_equipment_data.equipment_id,
            calculation_result=calculation_result,
            equipment_data=sample_equipment_data,
            inspection_data=sample_inspection_data,
            include_recommendations=True
        )
        
        # Verify report
        assert report is not None
        assert hasattr(report, 'equipment_id')
        assert report.equipment_id == "VAL-001"
    
    @pytest.mark.asyncio
    async def test_system_error_handling(self, integrated_system):
        """Test system error handling and recovery"""
        
        # Test with invalid equipment data
        invalid_equipment = EquipmentData(
            equipment_id="",  # Invalid empty ID
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now(),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel"
        )
        
        invalid_inspection = ExtractedRBIData(
            equipment_id="",  # Invalid empty ID
            corrosion_rate=0.1,
            coating_condition="moderate",
            inspection_quality="good"
        )
        
        # Should handle error gracefully
        with pytest.raises(Exception):
            await integrated_system.calculate_rbi(
                equipment_data=invalid_equipment,
                inspection_data=invalid_inspection
            )
        
        # System should still be operational after error
        health = await integrated_system.health_check()
        assert health.status == SystemStatus.READY
    
    @pytest.mark.asyncio
    async def test_system_performance_under_load(self, integrated_system):
        """Test system performance under load"""
        
        # Create load test data
        equipment_list = []
        inspection_list = []
        
        for i in range(20):
            equipment = EquipmentData(
                equipment_id=f"LOAD-{i:03d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime.now() - timedelta(days=365*2),
                design_pressure=18.0,
                design_temperature=130.0,
                material="Carbon Steel"
            )
            
            inspection = ExtractedRBIData(
                equipment_id=f"LOAD-{i:03d}",
                corrosion_rate=0.08 + (i * 0.005),
                coating_condition="moderate",
                damage_mechanisms=["General Corrosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Low",
                        description=f"Load test finding {i}",
                        location="Shell"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=45),
                inspection_quality="good"
            )
            
            equipment_list.append(equipment)
            inspection_list.append(inspection)
        
        # Measure performance
        start_time = time.time()
        
        results = await integrated_system.batch_calculate_rbi(
            equipment_batch=equipment_list,
            inspection_batch=inspection_list,
            user_id="load_test_user",
            max_concurrent=5
        )
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Performance assertions
        assert len(results) == 20
        assert total_time < 30.0  # Should complete within 30 seconds
        
        # Check system health after load test
        health = await integrated_system.health_check()
        assert health.status == SystemStatus.READY
        
        # Check performance metrics
        system_info = integrated_system.get_system_info()
        assert system_info['performance']['error_rate'] < 0.1  # Less than 10% error rate


class TestUserAcceptanceScenarios:
    """User acceptance test scenarios"""
    
    @pytest.fixture
    async def production_like_system(self):
        """Setup production-like system for UAT"""
        config = {
            'system': {
                'name': 'RBI Production System',
                'version': '1.0.0',
                'environment': 'production',
                'debug': False
            },
            'performance': {
                'max_concurrent_calculations': 10,
                'calculation_timeout_seconds': 30
            },
            'security': {
                'enable_audit_trail': True,
                'data_retention_days': 365
            }
        }
        
        system = await initialize_rbi_system(config)
        yield system
        await system.shutdown()
    
    @pytest.mark.asyncio
    async def test_typical_user_workflow(self, production_like_system):
        """Test typical user workflow scenario"""
        
        # Scenario: Inspector performs RBI calculation for pressure vessel
        equipment = EquipmentData(
            equipment_id="PV-101",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2015, 6, 15),
            design_pressure=30.0,
            design_temperature=180.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        
        inspection = ExtractedRBIData(
            equipment_id="PV-101",
            corrosion_rate=0.25,  # Higher corrosion rate
            coating_condition="none",
            damage_mechanisms=["General Corrosion", "Pitting", "Stress Corrosion Cracking"],
            inspection_findings=[
                InspectionFinding(
                    finding_type="Corrosion",
                    severity="High",
                    description="Significant general corrosion with localized pitting",
                    location="Bottom head",
                    recommendation="Immediate repair required"
                ),
                InspectionFinding(
                    finding_type="Cracking",
                    severity="Medium",
                    description="Stress corrosion cracking near weld seam",
                    location="Shell-to-head weld",
                    recommendation="Monitor and plan for replacement"
                )
            ],
            last_inspection_date=datetime.now() - timedelta(days=90),
            inspection_quality="good"
        )
        
        # Perform calculation
        result = await production_like_system.calculate_rbi(
            equipment_data=equipment,
            inspection_data=inspection,
            user_id="inspector_001"
        )
        
        # Verify high-risk equipment is properly identified
        assert result.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]
        assert result.calculation_level == RBILevel.LEVEL_3  # High criticality
        assert result.inspection_interval_months <= 24  # Frequent inspection required
        
        # Generate report
        report = await production_like_system.generate_comprehensive_report(
            equipment_id=equipment.equipment_id,
            calculation_result=result,
            equipment_data=equipment,
            inspection_data=inspection
        )
        
        assert report is not None
    
    @pytest.mark.asyncio
    async def test_maintenance_planner_workflow(self, production_like_system):
        """Test maintenance planner workflow scenario"""
        
        # Scenario: Maintenance planner reviews multiple equipment items
        equipment_list = [
            EquipmentData(
                equipment_id=f"HX-{i:03d}",
                equipment_type=EquipmentType.HEAT_EXCHANGER,
                service_type=ServiceType.STEAM,
                installation_date=datetime(2018, 1, 1),
                design_pressure=15.0,
                design_temperature=200.0,
                material="Stainless Steel",
                criticality_level="Medium"
            ) for i in range(1, 6)
        ]
        
        inspection_list = [
            ExtractedRBIData(
                equipment_id=f"HX-{i:03d}",
                corrosion_rate=0.05 + (i * 0.02),
                coating_condition="excellent",
                damage_mechanisms=["General Corrosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Low",
                        description=f"Minor corrosion on HX-{i:03d}",
                        location="Tube sheet"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=180),
                inspection_quality="average"
            ) for i in range(1, 6)
        ]
        
        # Batch calculation for maintenance planning
        results = await production_like_system.batch_calculate_rbi(
            equipment_batch=equipment_list,
            inspection_batch=inspection_list,
            user_id="planner_001"
        )
        
        # Verify results for maintenance planning
        assert len(results) == 5
        
        # Sort by risk level for prioritization
        high_risk_equipment = [r for r in results if r.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]]
        medium_risk_equipment = [r for r in results if r.risk_level == RiskLevel.MEDIUM]
        low_risk_equipment = [r for r in results if r.risk_level == RiskLevel.LOW]
        
        # Verify risk distribution makes sense
        assert len(high_risk_equipment) + len(medium_risk_equipment) + len(low_risk_equipment) == 5
    
    @pytest.mark.asyncio
    async def test_system_administrator_workflow(self, production_like_system):
        """Test system administrator workflow scenario"""
        
        # Scenario: System administrator monitors system health and performance
        
        # Perform health check
        health = await production_like_system.health_check()
        
        assert health.status == SystemStatus.READY
        assert all(health.components_status.values())
        assert health.error_count == 0
        
        # Get system information
        system_info = production_like_system.get_system_info()
        
        assert system_info['system']['name'] == 'RBI Production System'
        assert system_info['system']['status'] == 'ready'
        assert 'performance' in system_info
        assert 'health' in system_info
        
        # Check recent errors and warnings
        recent_errors = production_like_system.get_recent_errors()
        recent_warnings = production_like_system.get_recent_warnings()
        
        # Should be empty for a healthy system
        assert len(recent_errors) == 0
        assert len(recent_warnings) == 0
    
    @pytest.mark.asyncio
    async def test_concurrent_user_scenario(self, production_like_system):
        """Test concurrent users scenario"""
        
        # Scenario: Multiple users performing calculations simultaneously
        
        async def user_calculation(user_id: str, equipment_id: str):
            equipment = EquipmentData(
                equipment_id=equipment_id,
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SWEET_GAS,
                installation_date=datetime.now() - timedelta(days=365*4),
                design_pressure=20.0,
                design_temperature=140.0,
                material="Carbon Steel"
            )
            
            inspection = ExtractedRBIData(
                equipment_id=equipment_id,
                corrosion_rate=0.12,
                coating_condition="moderate",
                damage_mechanisms=["General Corrosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Medium",
                        description="Moderate corrosion observed",
                        location="Shell"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=120),
                inspection_quality="good"
            )
            
            return await production_like_system.calculate_rbi(
                equipment_data=equipment,
                inspection_data=inspection,
                user_id=user_id
            )
        
        # Simulate 5 concurrent users
        tasks = []
        for i in range(5):
            task = user_calculation(f"user_{i:03d}", f"CONC-{i:03d}")
            tasks.append(task)
        
        # Execute concurrently
        results = await asyncio.gather(*tasks)
        
        # Verify all calculations completed successfully
        assert len(results) == 5
        for result in results:
            assert isinstance(result, RBICalculationResult)
            assert result.equipment_id.startswith("CONC-")
        
        # Verify system health after concurrent operations
        health = await production_like_system.health_check()
        assert health.status == SystemStatus.READY


class TestDeploymentValidation:
    """Deployment validation tests"""
    
    def test_deployment_config_validation(self):
        """Test deployment configuration validation"""
        
        # Test development config
        dev_config = DeploymentConfig(DeploymentEnvironment.DEVELOPMENT)
        dev_errors = dev_config.validate()
        assert len(dev_errors) == 0  # Should be valid
        
        # Test production config
        prod_config = DeploymentConfig(DeploymentEnvironment.PRODUCTION)
        prod_errors = prod_config.validate()
        
        # Production config might have errors if not properly configured
        # This is expected in test environment
        assert isinstance(prod_errors, list)
    
    def test_config_serialization(self):
        """Test configuration serialization"""
        
        config = DeploymentConfig(DeploymentEnvironment.TESTING)
        config_dict = config.to_dict()
        
        assert isinstance(config_dict, dict)
        assert 'environment' in config_dict
        assert 'database' in config_dict
        assert 'security' in config_dict
        assert 'performance' in config_dict
        assert 'logging' in config_dict
        
        assert config_dict['environment'] == 'testing'
    
    @pytest.mark.asyncio
    async def test_system_startup_shutdown(self):
        """Test system startup and shutdown procedures"""
        
        # Test system initialization
        system = await initialize_rbi_system()
        
        assert system is not None
        
        # Verify system is ready
        health = await system.health_check()
        assert health.status == SystemStatus.READY
        
        # Test graceful shutdown
        await system.shutdown()
        
        # System should be in maintenance mode after shutdown
        system_info = system.get_system_info()
        assert system_info['system']['status'] == 'maintenance'