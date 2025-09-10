"""Tests for Batch Calculation Service"""

import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

from app.domains.rbi.services.batch_calculation_service import (
    BatchCalculationService,
    BatchCalculationRequest,
    DataCache
)
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    RBICalculationResult,
    ThicknessMeasurement,
    EquipmentType,
    ServiceType,
    RBILevel,
    RiskLevel
)
from app.domains.rbi.models.config import RBIConfig


class TestDataCache:
    """Test DataCache functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.cache = DataCache(ttl_seconds=60)
    
    def create_sample_equipment(self) -> EquipmentData:
        """Create sample equipment data"""
        return EquipmentData(
            equipment_id="V-101",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2015, 1, 1),
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            criticality_level="High"
        )
    
    def test_equipment_data_caching(self):
        """Test equipment data caching"""
        equipment = self.create_sample_equipment()
        
        # Initially no cache hit
        assert self.cache.get_equipment_data("V-101") is None
        assert self.cache.misses == 1
        
        # Set cache
        self.cache.set_equipment_data("V-101", equipment)
        
        # Should get cache hit
        cached_equipment = self.cache.get_equipment_data("V-101")
        assert cached_equipment is not None
        assert cached_equipment.equipment_id == "V-101"
        assert self.cache.hits == 1
    
    def test_cache_expiration(self):
        """Test cache TTL expiration"""
        # Use very short TTL for testing
        short_cache = DataCache(ttl_seconds=1)
        equipment = self.create_sample_equipment()
        
        # Set cache
        short_cache.set_equipment_data("V-101", equipment)
        
        # Should get cache hit immediately
        assert short_cache.get_equipment_data("V-101") is not None
        assert short_cache.hits == 1
        
        # Wait for expiration
        time.sleep(1.1)
        
        # Should miss after expiration
        assert short_cache.get_equipment_data("V-101") is None
        assert short_cache.misses == 1
    
    def test_cache_stats(self):
        """Test cache statistics"""
        equipment = self.create_sample_equipment()
        
        # Initial stats
        stats = self.cache.get_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 0
        assert stats["hit_rate_percent"] == 0
        
        # Add some cache operations
        self.cache.get_equipment_data("V-101")  # miss
        self.cache.set_equipment_data("V-101", equipment)
        self.cache.get_equipment_data("V-101")  # hit
        
        stats = self.cache.get_stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_rate_percent"] == 50.0
    
    def test_cache_clear(self):
        """Test cache clearing"""
        equipment = self.create_sample_equipment()
        
        # Set cache
        self.cache.set_equipment_data("V-101", equipment)
        assert self.cache.get_equipment_data("V-101") is not None
        
        # Clear cache
        self.cache.clear()
        
        # Should be empty
        assert self.cache.get_equipment_data("V-101") is None
        stats = self.cache.get_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 1  # From the get call above


class TestBatchCalculationService:
    """Test BatchCalculationService functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.config = RBIConfig()
        self.service = BatchCalculationService(self.config)
    
    def create_sample_calculation_result(self, equipment_id: str) -> RBICalculationResult:
        """Create sample calculation result"""
        return RBICalculationResult(
            equipment_id=equipment_id,
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_3,
            fallback_occurred=False,
            next_inspection_date=datetime.now() + timedelta(days=720),
            risk_level=RiskLevel.MEDIUM,
            pof_score=2.5,
            cof_scores={"safety": 3.0, "environmental": 2.5, "economic": 3.5},
            confidence_score=0.75,
            data_quality_score=0.8,
            calculation_timestamp=datetime.now(),
            input_parameters={},
            missing_data=[],
            estimated_parameters=[],
            inspection_interval_months=24
        )
    
    def test_create_batch_request(self):
        """Test batch request creation"""
        equipment_ids = ["V-101", "V-102", "V-103"]
        
        request = self.service.create_batch_request(
            equipment_ids=equipment_ids,
            requested_level=RBILevel.LEVEL_2,
            max_parallel=3
        )
        
        assert request.equipment_ids == equipment_ids
        assert request.requested_level == RBILevel.LEVEL_2
        assert request.max_parallel == 3
        assert request.cache_enabled is True
        assert request.error_handling == "continue"
    
    def test_sort_by_priority(self):
        """Test equipment sorting by priority"""
        equipment_ids = ["V-101", "V-102", "V-103", "V-104"]
        priority_equipment = ["V-103", "V-101"]
        
        sorted_ids = self.service._sort_by_priority(equipment_ids, priority_equipment)
        
        # Priority equipment should come first
        assert sorted_ids[:2] == ["V-103", "V-101"]
        assert set(sorted_ids[2:]) == {"V-102", "V-104"}
    
    def test_calculate_batch_sequential(self):
        """Test sequential batch calculation"""
        # Mock calculation results
        equipment_ids = ["V-101", "V-102"]
        mock_results = [
            self.create_sample_calculation_result("V-101"),
            self.create_sample_calculation_result("V-102")
        ]
        
        # Mock the engine directly
        self.service.engine.calculate_next_inspection_date = Mock(side_effect=mock_results)
        
        # Create request
        request = BatchCalculationRequest(
            equipment_ids=equipment_ids,
            requested_level=RBILevel.LEVEL_2,
            max_parallel=1,  # Sequential
            cache_enabled=False
        )
        
        # Execute batch calculation
        result = self.service.calculate_batch(request)
        
        # Verify results
        assert result.total_equipment == 2
        assert result.successful_calculations == 2
        assert result.failed_calculations == 0
        assert len(result.results) == 2
        assert len(result.errors) == 0
        assert result.execution_time >= 0  # Allow for very fast execution
        
        # Verify engine was called for each equipment
        assert self.service.engine.calculate_next_inspection_date.call_count == 2
    
    def test_calculate_batch_parallel(self):
        """Test parallel batch calculation"""
        # Mock calculation results
        equipment_ids = ["V-101", "V-102", "V-103"]
        mock_results = [
            self.create_sample_calculation_result("V-101"),
            self.create_sample_calculation_result("V-102"),
            self.create_sample_calculation_result("V-103")
        ]
        
        # Mock the engine directly
        self.service.engine.calculate_next_inspection_date = Mock(side_effect=mock_results)
        
        # Create request
        request = BatchCalculationRequest(
            equipment_ids=equipment_ids,
            requested_level=RBILevel.LEVEL_2,
            max_parallel=3,  # Parallel
            cache_enabled=False
        )
        
        # Execute batch calculation
        result = self.service.calculate_batch(request)
        
        # Verify results
        assert result.total_equipment == 3
        assert result.successful_calculations == 3
        assert result.failed_calculations == 0
        assert len(result.results) == 3
        assert len(result.errors) == 0
        
        # Verify engine was called for each equipment
        assert self.service.engine.calculate_next_inspection_date.call_count == 3
    
    def test_calculate_batch_with_errors(self):
        """Test batch calculation with some failures"""
        # Mock calculation results with one failure
        equipment_ids = ["V-101", "V-102", "V-103"]
        
        def mock_calculate(equipment_id, requested_level=None):
            if equipment_id == "V-102":
                raise Exception("Calculation failed")
            return self.create_sample_calculation_result(equipment_id)
        
        # Mock the engine directly
        self.service.engine.calculate_next_inspection_date = Mock(side_effect=mock_calculate)
        
        # Create request
        request = BatchCalculationRequest(
            equipment_ids=equipment_ids,
            requested_level=RBILevel.LEVEL_2,
            max_parallel=1,
            cache_enabled=False,
            error_handling="continue"
        )
        
        # Execute batch calculation
        result = self.service.calculate_batch(request)
        
        # Verify results
        assert result.total_equipment == 3
        assert result.successful_calculations == 2
        assert result.failed_calculations == 1
        assert len(result.results) == 2
        assert len(result.errors) == 1
        assert result.errors[0][0] == "V-102"
        assert "Calculation failed" in result.errors[0][1]
    
    def test_progress_callback(self):
        """Test progress callback functionality"""
        progress_calls = []
        
        def progress_callback(completed, total):
            progress_calls.append((completed, total))
        
        # Mock the engine to avoid actual calculations
        self.service.engine.calculate_next_inspection_date = Mock(
            return_value=self.create_sample_calculation_result("V-101")
        )
        
        # Create request with progress callback
        request = BatchCalculationRequest(
            equipment_ids=["V-101", "V-102"],
            max_parallel=1,
            cache_enabled=False,
            progress_callback=progress_callback
        )
        
        # Execute batch calculation
        self.service.calculate_batch(request)
        
        # Verify progress callbacks
        assert len(progress_calls) == 2
        assert progress_calls[0] == (1, 2)
        assert progress_calls[1] == (2, 2)
    
    def test_performance_metrics_generation(self):
        """Test performance metrics generation"""
        # Mock the engine
        self.service.engine.calculate_next_inspection_date = Mock(
            return_value=self.create_sample_calculation_result("V-101")
        )
        
        # Create request
        request = BatchCalculationRequest(
            equipment_ids=["V-101", "V-102"],
            requested_level=RBILevel.LEVEL_2,
            max_parallel=1,
            cache_enabled=True
        )
        
        # Execute batch calculation
        result = self.service.calculate_batch(request)
        
        # Verify performance metrics exist
        assert "performance_metrics" in result.__dict__
        metrics = result.performance_metrics
        
        assert "execution_metrics" in metrics
        assert "calculation_analysis" in metrics
        assert "cache_performance" in metrics
        assert "configuration" in metrics
        
        # Check execution metrics
        exec_metrics = metrics["execution_metrics"]
        assert exec_metrics["total_equipment"] == 2
        assert exec_metrics["successful_calculations"] == 2
        assert exec_metrics["success_rate_percent"] == 100.0
        assert exec_metrics["execution_time_seconds"] >= 0
    
    def test_cache_integration(self):
        """Test cache integration in batch calculations"""
        # Mock the engine
        mock_result = self.create_sample_calculation_result("V-101")
        self.service.engine.calculate_next_inspection_date = Mock(return_value=mock_result)
        
        # First calculation should miss cache
        request = BatchCalculationRequest(
            equipment_ids=["V-101"],
            cache_enabled=True
        )
        
        result1 = self.service.calculate_batch(request)
        assert result1.cache_misses > 0
        
        # Second calculation should hit cache
        result2 = self.service.calculate_batch(request)
        assert result2.cache_hits > 0
        
        # Engine should only be called once (first time)
        assert self.service.engine.calculate_next_inspection_date.call_count == 1
    
    def test_optimize_batch_size(self):
        """Test batch size optimization"""
        # Test different equipment counts
        assert self.service.optimize_batch_size(5) == 5
        assert self.service.optimize_batch_size(50) == 20
        assert self.service.optimize_batch_size(500) == 50
        assert self.service.optimize_batch_size(5000) == 100
    
    def test_active_requests_tracking(self):
        """Test active requests tracking"""
        # Initially no active requests
        assert len(self.service.get_active_requests()) == 0
        
        # Mock the engine to simulate long-running calculation
        def slow_calculation(equipment_id, requested_level=None):
            time.sleep(0.1)  # Simulate work
            return self.create_sample_calculation_result(equipment_id)
        
        self.service.engine.calculate_next_inspection_date = Mock(side_effect=slow_calculation)
        
        # Start batch calculation
        request = BatchCalculationRequest(
            equipment_ids=["V-101"],
            max_parallel=1,
            cache_enabled=False
        )
        
        # Execute and verify request was tracked and cleaned up
        result = self.service.calculate_batch(request)
        
        # Should be cleaned up after completion
        assert len(self.service.get_active_requests()) == 0
        assert result.successful_calculations == 1
    
    def test_cache_management(self):
        """Test cache management operations"""
        # Add some data to cache
        self.service.cache.set_equipment_data("V-101", Mock())
        
        # Verify cache has data
        stats = self.service.get_cache_stats()
        assert stats["equipment_cache_size"] > 0
        
        # Clear cache
        self.service.clear_cache()
        
        # Verify cache is empty
        stats = self.service.get_cache_stats()
        assert stats["equipment_cache_size"] == 0
        assert stats["hits"] == 0
        assert stats["misses"] == 0


class TestBatchCalculationRequest:
    """Test BatchCalculationRequest dataclass"""
    
    def test_default_values(self):
        """Test default values in batch request"""
        request = BatchCalculationRequest(equipment_ids=["V-101"])
        
        assert request.equipment_ids == ["V-101"]
        assert request.requested_level is None
        assert request.max_parallel == 5
        assert request.cache_enabled is True
        assert request.progress_callback is None
        assert request.error_handling == "continue"
        assert request.retry_attempts == 3
        assert request.timeout_seconds == 300
        assert request.priority_equipment == []
    
    def test_custom_values(self):
        """Test custom values in batch request"""
        def dummy_callback(completed, total):
            pass
        
        request = BatchCalculationRequest(
            equipment_ids=["V-101", "V-102"],
            requested_level=RBILevel.LEVEL_3,
            max_parallel=10,
            cache_enabled=False,
            progress_callback=dummy_callback,
            error_handling="stop",
            retry_attempts=5,
            timeout_seconds=600,
            priority_equipment=["V-101"]
        )
        
        assert request.equipment_ids == ["V-101", "V-102"]
        assert request.requested_level == RBILevel.LEVEL_3
        assert request.max_parallel == 10
        assert request.cache_enabled is False
        assert request.progress_callback == dummy_callback
        assert request.error_handling == "stop"
        assert request.retry_attempts == 5
        assert request.timeout_seconds == 600
        assert request.priority_equipment == ["V-101"]