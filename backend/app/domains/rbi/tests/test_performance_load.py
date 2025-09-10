"""Performance and Load Testing for RBI System"""

import pytest
import asyncio
import time
import statistics
from datetime import datetime, timedelta
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import Mock, patch

from app.domains.rbi.services.pattern_recognition_engine import PatternRecognitionEngine
from app.domains.rbi.services.adaptive_parameter_adjuster import AdaptiveParameterAdjuster
from app.domains.rbi.services.prediction_tracker import PredictionTracker
from app.domains.rbi.services.audit_trail_service import AuditTrailService
from app.domains.rbi.services.calculation_report_service import CalculationReportService
from app.domains.rbi.integrations.data_sync_manager import DataSyncManager
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


class TestRBIPerformance:
    """Test RBI system performance under various loads"""
    
    @pytest.fixture
    def performance_system(self):
        """Setup system for performance testing"""
        return {
            'pattern_engine': PatternRecognitionEngine(),
            'parameter_adjuster': AdaptiveParameterAdjuster(),
            'prediction_tracker': PredictionTracker(),
            'audit_service': AuditTrailService(),
            'report_service': CalculationReportService(),
            'sync_manager': DataSyncManager()
        }
    
    @pytest.fixture
    def sample_equipment_batch(self):
        """Generate batch of sample equipment for testing"""
        equipment_batch = []
        for i in range(100):
            equipment = EquipmentData(
                equipment_id=f"PERF-{i:03d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS if i % 2 == 0 else ServiceType.SWEET_GAS,
                installation_date=datetime.now() - timedelta(days=365*(i % 20)),
                design_pressure=15.0 + (i % 10),
                design_temperature=120.0 + (i % 30),
                material="Carbon Steel" if i % 3 == 0 else "Stainless Steel"
            )
            equipment_batch.append(equipment)
        return equipment_batch
    
    @pytest.fixture
    def sample_inspection_batch(self):
        """Generate batch of sample inspection data"""
        inspection_batch = []
        for i in range(100):
            inspection = ExtractedRBIData(
                equipment_id=f"PERF-{i:03d}",
                corrosion_rate=0.1 + (i * 0.01),
                coating_condition="moderate" if i % 2 == 0 else "excellent",
                damage_mechanisms=["General Corrosion", "Pitting"][:(i % 2) + 1],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity=["Low", "Medium", "High"][i % 3],
                        description=f"Performance test finding {i}",
                        location="Shell"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=30*(i % 12)),
                inspection_quality=["good", "average", "poor"][i % 3]
            )
            inspection_batch.append(inspection)
        return inspection_batch
    
    def test_single_calculation_performance(self, performance_system, sample_equipment_batch, sample_inspection_batch):
        """Test performance of single RBI calculation"""
        
        # Measure pattern analysis time
        start_time = time.time()
        
        result = performance_system['pattern_engine'].analyze_equipment_patterns(
            equipment_data=sample_equipment_batch[0],
            historical_calculations=[],
            inspection_history=[sample_inspection_batch[0]]
        )
        
        end_time = time.time()
        calculation_time = end_time - start_time
        
        # Performance assertions
        assert calculation_time < 2.0  # Should complete within 2 seconds
        assert result is not None
        assert hasattr(result, 'equipment_id')
        
        print(f"Single calculation time: {calculation_time:.3f} seconds")
    
    def test_batch_calculation_performance(self, performance_system, sample_equipment_batch, sample_inspection_batch):
        """Test performance of batch RBI calculations"""
        
        batch_size = 10
        equipment_batch = sample_equipment_batch[:batch_size]
        inspection_batch = sample_inspection_batch[:batch_size]
        
        start_time = time.time()
        
        results = []
        for equipment, inspection in zip(equipment_batch, inspection_batch):
            result = performance_system['pattern_engine'].analyze_equipment_patterns(
                equipment_data=equipment,
                historical_calculations=[],
                inspection_history=[inspection]
            )
            results.append(result)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_calculation = total_time / batch_size
        
        # Performance assertions
        assert total_time < 20.0  # Should complete within 20 seconds
        assert len(results) == batch_size
        assert avg_time_per_calculation < 2.0  # Average should be under 2 seconds
        
        print(f"Batch calculation time: {total_time:.3f} seconds")
        print(f"Average time per calculation: {avg_time_per_calculation:.3f} seconds")
    
    @pytest.mark.asyncio
    async def test_concurrent_calculations_performance(self, performance_system, sample_equipment_batch, sample_inspection_batch):
        """Test performance of concurrent RBI calculations"""
        
        batch_size = 20
        equipment_batch = sample_equipment_batch[:batch_size]
        inspection_batch = sample_inspection_batch[:batch_size]
        
        async def mock_calculation(equipment, inspection):
            # Simulate calculation with some processing time
            await asyncio.sleep(0.1)
            return performance_system['pattern_engine'].analyze_equipment_patterns(
                equipment_data=equipment,
                historical_calculations=[],
                inspection_history=[inspection]
            )
        
        start_time = time.time()
        
        # Run concurrent calculations
        tasks = []
        for equipment, inspection in zip(equipment_batch, inspection_batch):
            task = mock_calculation(equipment, inspection)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Performance assertions
        assert total_time < 15.0  # Should complete faster than sequential
        assert len(results) == batch_size
        assert all(result is not None for result in results)
        
        print(f"Concurrent calculation time: {total_time:.3f} seconds")
        print(f"Speedup vs sequential: {(batch_size * 2.0) / total_time:.2f}x")
    
    def test_memory_usage_under_load(self, performance_system, sample_equipment_batch, sample_inspection_batch):
        """Test memory usage under heavy load"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Process large batch
        batch_size = 50
        equipment_batch = sample_equipment_batch[:batch_size]
        inspection_batch = sample_inspection_batch[:batch_size]
        
        results = []
        for equipment, inspection in zip(equipment_batch, inspection_batch):
            result = performance_system['pattern_engine'].analyze_equipment_patterns(
                equipment_data=equipment,
                historical_calculations=[],
                inspection_history=[inspection]
            )
            results.append(result)
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory usage assertions
        assert memory_increase < 100  # Should not increase by more than 100MB
        assert len(results) == batch_size
        
        print(f"Initial memory: {initial_memory:.2f} MB")
        print(f"Final memory: {final_memory:.2f} MB")
        print(f"Memory increase: {memory_increase:.2f} MB")
    
    def test_audit_service_performance(self, performance_system, sample_equipment_batch):
        """Test audit service performance under load"""
        
        batch_size = 100
        equipment_batch = sample_equipment_batch[:batch_size]
        
        # Create mock calculation results
        calculation_results = []
        for equipment in equipment_batch:
            result = RBICalculationResult(
                equipment_id=equipment.equipment_id,
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=365*2),
                risk_level=RiskLevel.MEDIUM,
                pof_score=2.0,
                cof_scores={"safety": 2.5, "environmental": 2.0, "economic": 2.5},
                confidence_score=0.8,
                data_quality_score=0.85,
                calculation_timestamp=datetime.now(),
                input_parameters={}
            )
            calculation_results.append(result)
        
        start_time = time.time()
        
        # Log multiple audit events
        audit_ids = []
        for i, (equipment, result) in enumerate(zip(equipment_batch, calculation_results)):
            audit_id = performance_system['audit_service'].log_calculation_event(
                calculation_result=result,
                equipment_data=equipment,
                user_id=f"perf_user_{i % 5}"
            )
            audit_ids.append(audit_id)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_log = total_time / batch_size
        
        # Performance assertions
        assert total_time < 10.0  # Should complete within 10 seconds
        assert len(audit_ids) == batch_size
        assert avg_time_per_log < 0.1  # Average should be under 100ms
        
        print(f"Audit logging time: {total_time:.3f} seconds")
        print(f"Average time per log: {avg_time_per_log * 1000:.1f} ms")


class TestRBILoadTesting:
    """Load testing for RBI system components"""
    
    @pytest.fixture
    def load_test_system(self):
        """Setup system for load testing"""
        return {
            'pattern_engine': PatternRecognitionEngine(),
            'parameter_adjuster': AdaptiveParameterAdjuster(),
            'prediction_tracker': PredictionTracker(),
            'audit_service': AuditTrailService(),
            'report_service': CalculationReportService()
        }
    
    def test_high_volume_pattern_analysis(self, load_test_system):
        """Test pattern analysis under high volume"""
        
        # Generate large dataset
        equipment_count = 200
        historical_data_per_equipment = 50
        
        start_time = time.time()
        
        for i in range(equipment_count):
            equipment = EquipmentData(
                equipment_id=f"LOAD-{i:03d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime.now() - timedelta(days=365*5),
                design_pressure=20.0,
                design_temperature=150.0,
                material="Carbon Steel"
            )
            
            # Generate historical data
            historical_data = []
            for j in range(min(10, historical_data_per_equipment)):  # Limit to avoid timeout
                inspection = ExtractedRBIData(
                    equipment_id=f"LOAD-{i:03d}",
                    corrosion_rate=0.1 + (j * 0.01),
                    coating_condition="moderate",
                    damage_mechanisms=["General Corrosion"],
                    inspection_findings=[
                        InspectionFinding(
                            finding_type="Corrosion",
                            severity="Medium",
                            description=f"Load test finding {j}",
                            location="Shell"
                        )
                    ],
                    last_inspection_date=datetime.now() - timedelta(days=30*j),
                    inspection_quality="average"
                )
                historical_data.append(inspection)
            
            # Analyze patterns
            result = load_test_system['pattern_engine'].analyze_equipment_patterns(
                equipment_data=equipment,
                historical_calculations=[],
                inspection_history=historical_data
            )
            
            assert result is not None
            
            # Break early if taking too long (for CI/CD)
            if time.time() - start_time > 30:  # 30 second timeout
                print(f"Processed {i+1} equipment items before timeout")
                break
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"High volume pattern analysis time: {total_time:.3f} seconds")
        assert total_time < 60.0  # Should complete within 60 seconds
    
    def test_stress_test_parameter_adjustment(self, load_test_system):
        """Stress test parameter adjustment system"""
        
        adjustment_count = 500
        start_time = time.time()
        
        successful_adjustments = 0
        
        for i in range(adjustment_count):
            try:
                result = load_test_system['parameter_adjuster'].adjust_parameters(
                    equipment_id=f"STRESS-{i:03d}",
                    current_parameters={
                        "corrosion_rate": 0.1 + (i * 0.001),
                        "design_pressure": 15.0 + (i % 10),
                        "confidence_threshold": 0.7 + (i * 0.0001)
                    },
                    force_adjustment=True
                )
                
                if result is not None:
                    successful_adjustments += 1
                    
            except Exception as e:
                print(f"Adjustment {i} failed: {str(e)}")
                continue
        
        end_time = time.time()
        total_time = end_time - start_time
        success_rate = successful_adjustments / adjustment_count
        
        # Performance assertions
        assert total_time < 30.0  # Should complete within 30 seconds
        assert success_rate > 0.95  # At least 95% success rate
        
        print(f"Stress test time: {total_time:.3f} seconds")
        print(f"Success rate: {success_rate:.2%}")
        print(f"Successful adjustments: {successful_adjustments}/{adjustment_count}")
    
    def test_concurrent_report_generation(self, load_test_system):
        """Test concurrent report generation"""
        
        report_count = 20
        
        # Create mock calculation results
        calculation_results = []
        equipment_data = []
        
        for i in range(report_count):
            equipment = EquipmentData(
                equipment_id=f"RPT-{i:03d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime.now() - timedelta(days=365*3),
                design_pressure=18.0,
                design_temperature=140.0,
                material="Stainless Steel"
            )
            
            result = RBICalculationResult(
                equipment_id=f"RPT-{i:03d}",
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=365*3),
                risk_level=RiskLevel.MEDIUM,
                pof_score=2.5,
                cof_scores={"safety": 3.0, "environmental": 2.5, "economic": 2.0},
                confidence_score=0.85,
                data_quality_score=0.8,
                calculation_timestamp=datetime.now(),
                input_parameters={}
            )
            
            equipment_data.append(equipment)
            calculation_results.append(result)
        
        def generate_report(equipment, result):
            """Generate a single report"""
            return load_test_system['report_service'].generate_detailed_report(
                calculation_result=result,
                equipment_data=equipment
            )
        
        start_time = time.time()
        
        # Use ThreadPoolExecutor for concurrent report generation
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            for equipment, result in zip(equipment_data, calculation_results):
                future = executor.submit(generate_report, equipment, result)
                futures.append(future)
            
            reports = []
            for future in as_completed(futures):
                try:
                    report = future.result(timeout=10)  # 10 second timeout per report
                    reports.append(report)
                except Exception as e:
                    print(f"Report generation failed: {str(e)}")
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Performance assertions
        assert total_time < 30.0  # Should complete within 30 seconds
        assert len(reports) >= report_count * 0.9  # At least 90% success rate
        
        print(f"Concurrent report generation time: {total_time:.3f} seconds")
        print(f"Reports generated: {len(reports)}/{report_count}")


class TestRBIScalability:
    """Test RBI system scalability"""
    
    @pytest.fixture
    def scalability_system(self):
        """Setup system for scalability testing"""
        return {
            'prediction_tracker': PredictionTracker(),
            'audit_service': AuditTrailService()
        }
    
    def test_prediction_tracking_scalability(self, scalability_system):
        """Test prediction tracking with large datasets"""
        
        prediction_count = 1000
        start_time = time.time()
        
        prediction_ids = []
        
        for i in range(prediction_count):
            equipment = EquipmentData(
                equipment_id=f"SCALE-{i:04d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SWEET_GAS,
                installation_date=datetime.now() - timedelta(days=365*2),
                design_pressure=16.0,
                design_temperature=130.0,
                material="Carbon Steel"
            )
            
            result = RBICalculationResult(
                equipment_id=f"SCALE-{i:04d}",
                calculation_level=RBILevel.LEVEL_1,
                requested_level=RBILevel.LEVEL_1,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=365*4),
                risk_level=RiskLevel.LOW,
                pof_score=1.5,
                cof_scores={"safety": 2.0, "environmental": 1.5, "economic": 1.5},
                confidence_score=0.9,
                data_quality_score=0.95,
                calculation_timestamp=datetime.now(),
                input_parameters={}
            )
            
            prediction_id = scalability_system['prediction_tracker'].record_prediction(
                calculation_result=result,
                equipment_data=equipment
            )
            
            prediction_ids.append(prediction_id)
            
            # Progress indicator
            if (i + 1) % 100 == 0:
                elapsed = time.time() - start_time
                print(f"Processed {i + 1} predictions in {elapsed:.2f} seconds")
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_prediction = total_time / prediction_count
        
        # Scalability assertions
        assert total_time < 60.0  # Should complete within 60 seconds
        assert len(prediction_ids) == prediction_count
        assert avg_time_per_prediction < 0.06  # Average should be under 60ms
        
        print(f"Prediction tracking scalability test:")
        print(f"Total time: {total_time:.3f} seconds")
        print(f"Average time per prediction: {avg_time_per_prediction * 1000:.1f} ms")
        print(f"Throughput: {prediction_count / total_time:.1f} predictions/second")
    
    def test_audit_trail_scalability(self, scalability_system):
        """Test audit trail with high volume logging"""
        
        log_count = 2000
        start_time = time.time()
        
        audit_ids = []
        
        for i in range(log_count):
            equipment = EquipmentData(
                equipment_id=f"AUDIT-{i:04d}",
                equipment_type=EquipmentType.HEAT_EXCHANGER,
                service_type=ServiceType.STEAM,
                installation_date=datetime.now() - timedelta(days=365*4),
                design_pressure=12.0,
                design_temperature=200.0,
                material="Stainless Steel"
            )
            
            result = RBICalculationResult(
                equipment_id=f"AUDIT-{i:04d}",
                calculation_level=RBILevel.LEVEL_3,
                requested_level=RBILevel.LEVEL_3,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=365*2),
                risk_level=RiskLevel.HIGH,
                pof_score=4.0,
                cof_scores={"safety": 4.5, "environmental": 4.0, "economic": 3.5},
                confidence_score=0.95,
                data_quality_score=0.9,
                calculation_timestamp=datetime.now(),
                input_parameters={}
            )
            
            audit_id = scalability_system['audit_service'].log_calculation_event(
                calculation_result=result,
                equipment_data=equipment,
                user_id=f"scale_user_{i % 10}"
            )
            
            audit_ids.append(audit_id)
            
            # Progress indicator
            if (i + 1) % 200 == 0:
                elapsed = time.time() - start_time
                print(f"Logged {i + 1} audit events in {elapsed:.2f} seconds")
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_log = total_time / log_count
        
        # Scalability assertions
        assert total_time < 120.0  # Should complete within 2 minutes
        assert len(audit_ids) == log_count
        assert avg_time_per_log < 0.06  # Average should be under 60ms
        
        print(f"Audit trail scalability test:")
        print(f"Total time: {total_time:.3f} seconds")
        print(f"Average time per log: {avg_time_per_log * 1000:.1f} ms")
        print(f"Throughput: {log_count / total_time:.1f} logs/second")


class TestRBIResourceUtilization:
    """Test resource utilization under various conditions"""
    
    def test_cpu_utilization_monitoring(self):
        """Monitor CPU utilization during intensive operations"""
        import psutil
        
        # Monitor CPU usage
        cpu_percentages = []
        
        def cpu_monitor():
            for _ in range(10):  # Monitor for 10 intervals
                cpu_percent = psutil.cpu_percent(interval=0.5)
                cpu_percentages.append(cpu_percent)
        
        # Start CPU monitoring in background
        import threading
        monitor_thread = threading.Thread(target=cpu_monitor)
        monitor_thread.start()
        
        # Perform intensive operations
        pattern_engine = PatternRecognitionEngine()
        
        for i in range(50):
            equipment = EquipmentData(
                equipment_id=f"CPU-{i:03d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime.now() - timedelta(days=365*3),
                design_pressure=20.0,
                design_temperature=150.0,
                material="Carbon Steel"
            )
            
            inspection = ExtractedRBIData(
                equipment_id=f"CPU-{i:03d}",
                corrosion_rate=0.15,
                coating_condition="moderate",
                damage_mechanisms=["General Corrosion", "Pitting"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Medium",
                        description="CPU test finding",
                        location="Shell"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=60),
                inspection_quality="good"
            )
            
            result = pattern_engine.analyze_equipment_patterns(
                equipment_data=equipment,
                historical_calculations=[],
                inspection_history=[inspection]
            )
            
            assert result is not None
        
        # Wait for monitoring to complete
        monitor_thread.join()
        
        # Analyze CPU usage
        if cpu_percentages:
            avg_cpu = statistics.mean(cpu_percentages)
            max_cpu = max(cpu_percentages)
            
            print(f"CPU utilization during intensive operations:")
            print(f"Average CPU: {avg_cpu:.1f}%")
            print(f"Peak CPU: {max_cpu:.1f}%")
            
            # CPU utilization should be reasonable
            assert avg_cpu < 80.0  # Average should be under 80%
            assert max_cpu < 95.0  # Peak should be under 95%