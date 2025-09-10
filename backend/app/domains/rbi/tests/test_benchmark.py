"""Benchmark Tests for RBI System"""

import pytest
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any

from app.domains.rbi.services.pattern_recognition_engine import PatternRecognitionEngine
from app.domains.rbi.services.adaptive_parameter_adjuster import AdaptiveParameterAdjuster
from app.domains.rbi.services.prediction_tracker import PredictionTracker
from app.domains.rbi.services.audit_trail_service import AuditTrailService
from app.domains.rbi.services.calculation_report_service import CalculationReportService
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


class TestRBIBenchmark:
    """Comprehensive benchmark tests for RBI system"""
    
    @pytest.fixture
    def benchmark_system(self):
        """Setup complete system for benchmarking"""
        return {
            'pattern_engine': PatternRecognitionEngine(),
            'parameter_adjuster': AdaptiveParameterAdjuster(),
            'prediction_tracker': PredictionTracker(),
            'audit_service': AuditTrailService(),
            'report_service': CalculationReportService()
        }
    
    def test_comprehensive_benchmark(self, benchmark_system):
        """Comprehensive benchmark of all RBI components"""
        
        benchmark_results = {
            'test_timestamp': datetime.now().isoformat(),
            'system_info': {
                'python_version': '3.12+',
                'platform': 'Windows',
                'test_environment': 'Development'
            },
            'performance_metrics': {}
        }
        
        # Test 1: Pattern Recognition Performance
        print("\n=== Pattern Recognition Benchmark ===")
        pattern_start = time.time()
        
        equipment = EquipmentData(
            equipment_id="BENCH-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=365*5),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel"
        )
        
        inspection_data = []
        for i in range(20):  # 20 historical inspections
            inspection = ExtractedRBIData(
                equipment_id="BENCH-001",
                corrosion_rate=0.1 + (i * 0.005),
                coating_condition="moderate",
                damage_mechanisms=["General Corrosion", "Pitting"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity=["Low", "Medium", "High"][i % 3],
                        description=f"Benchmark finding {i}",
                        location="Shell"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=30*i),
                inspection_quality="good"
            )
            inspection_data.append(inspection)
        
        pattern_result = benchmark_system['pattern_engine'].analyze_equipment_patterns(
            equipment_data=equipment,
            historical_calculations=[],
            inspection_history=inspection_data
        )
        
        pattern_time = time.time() - pattern_start
        benchmark_results['performance_metrics']['pattern_recognition'] = {
            'execution_time_seconds': round(pattern_time, 4),
            'data_points_processed': len(inspection_data),
            'throughput_per_second': round(len(inspection_data) / pattern_time, 2) if pattern_time > 0 else 'N/A'
        }
        
        print(f"Pattern Recognition Time: {pattern_time:.4f} seconds")
        print(f"Data Points Processed: {len(inspection_data)}")
        
        # Test 2: Parameter Adjustment Performance
        print("\n=== Parameter Adjustment Benchmark ===")
        param_start = time.time()
        
        adjustment_count = 100
        successful_adjustments = 0
        
        for i in range(adjustment_count):
            result = benchmark_system['parameter_adjuster'].adjust_parameters(
                equipment_id=f"BENCH-{i:03d}",
                current_parameters={
                    "corrosion_rate": 0.1 + (i * 0.001),
                    "design_pressure": 20.0 + (i % 5),
                    "confidence_threshold": 0.8
                },
                force_adjustment=True
            )
            if result is not None:
                successful_adjustments += 1
        
        param_time = time.time() - param_start
        benchmark_results['performance_metrics']['parameter_adjustment'] = {
            'execution_time_seconds': round(param_time, 4),
            'adjustments_attempted': adjustment_count,
            'successful_adjustments': successful_adjustments,
            'success_rate_percent': round((successful_adjustments / adjustment_count) * 100, 2),
            'throughput_per_second': round(adjustment_count / param_time, 2) if param_time > 0 else 'N/A'
        }
        
        print(f"Parameter Adjustment Time: {param_time:.4f} seconds")
        print(f"Success Rate: {successful_adjustments}/{adjustment_count} ({(successful_adjustments/adjustment_count)*100:.1f}%)\"")
        
        # Test 3: Prediction Tracking Performance
        print("\n=== Prediction Tracking Benchmark ===")
        pred_start = time.time()
        
        prediction_count = 200
        prediction_ids = []
        
        for i in range(prediction_count):
            equipment_pred = EquipmentData(
                equipment_id=f"PRED-{i:03d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SWEET_GAS,
                installation_date=datetime.now() - timedelta(days=365*2),
                design_pressure=15.0,
                design_temperature=120.0,
                material="Stainless Steel"
            )
            
            calc_result = RBICalculationResult(
                equipment_id=f"PRED-{i:03d}",
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=365*3),
                risk_level=RiskLevel.MEDIUM,
                pof_score=2.0,
                cof_scores={"safety": 2.5, "environmental": 2.0, "economic": 2.0},
                confidence_score=0.85,
                data_quality_score=0.9,
                calculation_timestamp=datetime.now(),
                input_parameters={}
            )
            
            pred_id = benchmark_system['prediction_tracker'].record_prediction(
                calculation_result=calc_result,
                equipment_data=equipment_pred
            )
            prediction_ids.append(pred_id)
        
        pred_time = time.time() - pred_start
        benchmark_results['performance_metrics']['prediction_tracking'] = {
            'execution_time_seconds': round(pred_time, 4),
            'predictions_recorded': len(prediction_ids),
            'throughput_per_second': round(prediction_count / pred_time, 2) if pred_time > 0 else 'N/A'
        }
        
        print(f"Prediction Tracking Time: {pred_time:.4f} seconds")
        print(f"Predictions Recorded: {len(prediction_ids)}")
        
        # Test 4: Audit Service Performance
        print("\n=== Audit Service Benchmark ===")
        audit_start = time.time()
        
        audit_count = 150
        audit_ids = []
        
        for i in range(audit_count):
            equipment_audit = EquipmentData(
                equipment_id=f"AUDIT-{i:03d}",
                equipment_type=EquipmentType.HEAT_EXCHANGER,
                service_type=ServiceType.STEAM,
                installation_date=datetime.now() - timedelta(days=365*3),
                design_pressure=18.0,
                design_temperature=180.0,
                material="Carbon Steel"
            )
            
            calc_result_audit = RBICalculationResult(
                equipment_id=f"AUDIT-{i:03d}",
                calculation_level=RBILevel.LEVEL_3,
                requested_level=RBILevel.LEVEL_3,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=365*2),
                risk_level=RiskLevel.HIGH,
                pof_score=3.5,
                cof_scores={"safety": 4.0, "environmental": 3.5, "economic": 3.0},
                confidence_score=0.9,
                data_quality_score=0.85,
                calculation_timestamp=datetime.now(),
                input_parameters={}
            )
            
            audit_id = benchmark_system['audit_service'].log_calculation_event(
                calculation_result=calc_result_audit,
                equipment_data=equipment_audit,
                user_id=f"bench_user_{i % 5}"
            )
            audit_ids.append(audit_id)
        
        audit_time = time.time() - audit_start
        benchmark_results['performance_metrics']['audit_service'] = {
            'execution_time_seconds': round(audit_time, 4),
            'audit_events_logged': len(audit_ids),
            'throughput_per_second': round(audit_count / audit_time, 2) if audit_time > 0 else 'N/A'
        }
        
        print(f"Audit Service Time: {audit_time:.4f} seconds")
        print(f"Audit Events Logged: {len(audit_ids)}")
        
        # Test 5: Report Generation Performance
        print("\n=== Report Generation Benchmark ===")
        report_start = time.time()
        
        report_count = 50
        reports_generated = 0
        
        for i in range(report_count):
            equipment_report = EquipmentData(
                equipment_id=f"RPT-{i:03d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime.now() - timedelta(days=365*4),
                design_pressure=22.0,
                design_temperature=160.0,
                material="Stainless Steel"
            )
            
            calc_result_report = RBICalculationResult(
                equipment_id=f"RPT-{i:03d}",
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=365*3),
                risk_level=RiskLevel.MEDIUM,
                pof_score=2.5,
                cof_scores={"safety": 3.0, "environmental": 2.5, "economic": 2.0},
                confidence_score=0.88,
                data_quality_score=0.92,
                calculation_timestamp=datetime.now(),
                input_parameters={}
            )
            
            try:
                report = benchmark_system['report_service'].generate_detailed_report(
                    calculation_result=calc_result_report,
                    equipment_data=equipment_report
                )
                if report is not None:
                    reports_generated += 1
            except Exception as e:
                print(f"Report generation failed for RPT-{i:03d}: {str(e)}")
        
        report_time = time.time() - report_start
        benchmark_results['performance_metrics']['report_generation'] = {
            'execution_time_seconds': round(report_time, 4),
            'reports_attempted': report_count,
            'reports_generated': reports_generated,
            'success_rate_percent': round((reports_generated / report_count) * 100, 2),
            'throughput_per_second': round(report_count / report_time, 2) if report_time > 0 else 'N/A'
        }
        
        print(f"Report Generation Time: {report_time:.4f} seconds")
        print(f"Reports Generated: {reports_generated}/{report_count}")
        
        # Calculate overall metrics
        total_time = pattern_time + param_time + pred_time + audit_time + report_time
        benchmark_results['performance_metrics']['overall'] = {
            'total_execution_time_seconds': round(total_time, 4),
            'total_operations': (
                len(inspection_data) + adjustment_count + 
                prediction_count + audit_count + report_count
            ),
            'overall_throughput_per_second': round(
                (len(inspection_data) + adjustment_count + prediction_count + 
                 audit_count + report_count) / total_time, 2
            ) if total_time > 0 else 'N/A'
        }
        
        # Print summary
        print("\n=== Benchmark Summary ===")
        print(f"Total Execution Time: {total_time:.4f} seconds")
        print(f"Total Operations: {benchmark_results['performance_metrics']['overall']['total_operations']}")
        print(f"Overall Throughput: {benchmark_results['performance_metrics']['overall']['overall_throughput_per_second']} ops/sec")
        
        # Save benchmark results
        benchmark_file = f"benchmark_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(benchmark_file, 'w') as f:
                json.dump(benchmark_results, f, indent=2)
            print(f"\nBenchmark results saved to: {benchmark_file}")
        except Exception as e:
            print(f"Failed to save benchmark results: {str(e)}")
        
        # Performance assertions
        assert total_time < 60.0  # Should complete within 60 seconds
        assert successful_adjustments >= adjustment_count * 0.95  # 95% success rate
        assert reports_generated >= report_count * 0.90  # 90% success rate
        assert len(prediction_ids) == prediction_count
        assert len(audit_ids) == audit_count
        
        return benchmark_results
    
    def test_memory_benchmark(self, benchmark_system):
        """Memory usage benchmark"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        print(f"\n=== Memory Benchmark ===")
        print(f"Initial Memory Usage: {initial_memory:.2f} MB")
        
        # Create large dataset
        equipment_list = []
        inspection_list = []
        
        for i in range(500):  # Large dataset
            equipment = EquipmentData(
                equipment_id=f"MEM-{i:04d}",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime.now() - timedelta(days=365*2),
                design_pressure=20.0,
                design_temperature=150.0,
                material="Carbon Steel"
            )
            
            inspection = ExtractedRBIData(
                equipment_id=f"MEM-{i:04d}",
                corrosion_rate=0.1 + (i * 0.0001),
                coating_condition="moderate",
                damage_mechanisms=["General Corrosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Medium",
                        description=f"Memory test finding {i}",
                        location="Shell"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=60),
                inspection_quality="average"
            )
            
            equipment_list.append(equipment)
            inspection_list.append(inspection)
        
        # Check memory after data creation
        after_data_memory = process.memory_info().rss / 1024 / 1024  # MB
        data_memory_increase = after_data_memory - initial_memory
        
        print(f"Memory after data creation: {after_data_memory:.2f} MB")
        print(f"Memory increase for data: {data_memory_increase:.2f} MB")
        
        # Process data
        for i, (equipment, inspection) in enumerate(zip(equipment_list[:100], inspection_list[:100])):
            result = benchmark_system['pattern_engine'].analyze_equipment_patterns(
                equipment_data=equipment,
                historical_calculations=[],
                inspection_history=[inspection]
            )
            
            if (i + 1) % 25 == 0:
                current_memory = process.memory_info().rss / 1024 / 1024  # MB
                print(f"Memory after processing {i+1} items: {current_memory:.2f} MB")
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        total_memory_increase = final_memory - initial_memory
        processing_memory_increase = final_memory - after_data_memory
        
        print(f"Final Memory Usage: {final_memory:.2f} MB")
        print(f"Total Memory Increase: {total_memory_increase:.2f} MB")
        print(f"Processing Memory Increase: {processing_memory_increase:.2f} MB")
        
        # Memory assertions
        assert total_memory_increase < 200  # Should not increase by more than 200MB
        assert processing_memory_increase < 50  # Processing should not add more than 50MB
        
        return {
            'initial_memory_mb': round(initial_memory, 2),
            'final_memory_mb': round(final_memory, 2),
            'total_increase_mb': round(total_memory_increase, 2),
            'processing_increase_mb': round(processing_memory_increase, 2),
            'data_processed': 100
        }