"""Batch Calculation Service - Advanced batch processing for RBI calculations"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable, Tuple
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
import time

from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    RBILevel
)
from app.domains.rbi.models.config import RBIConfig
from app.domains.rbi.services.rbi_calculation_engine import RBICalculationEngine


logger = logging.getLogger(__name__)


@dataclass
class BatchCalculationRequest:
    """Batch calculation request configuration"""
    equipment_ids: List[str]
    requested_level: Optional[RBILevel] = None
    max_parallel: int = 5
    cache_enabled: bool = True
    progress_callback: Optional[Callable[[int, int], None]] = None
    error_handling: str = "continue"  # "continue", "stop", "retry"
    retry_attempts: int = 3
    timeout_seconds: int = 300
    priority_equipment: List[str] = field(default_factory=list)


@dataclass
class BatchCalculationResult:
    """Batch calculation result with metadata"""
    request_id: str
    total_equipment: int
    successful_calculations: int
    failed_calculations: int
    results: List[RBICalculationResult]
    errors: List[Tuple[str, str]]  # (equipment_id, error_message)
    execution_time: float
    cache_hits: int
    cache_misses: int
    start_time: datetime
    end_time: datetime
    performance_metrics: Dict[str, Any]


class DataCache:
    """Efficient data caching for batch operations"""
    
    def __init__(self, ttl_seconds: int = 3600):
        """Initialize cache with TTL"""
        self.ttl_seconds = ttl_seconds
        self._equipment_cache: Dict[str, Tuple[EquipmentData, datetime]] = {}
        self._extracted_data_cache: Dict[str, Tuple[ExtractedRBIData, datetime]] = {}
        self._result_cache: Dict[str, Tuple[RBICalculationResult, datetime]] = {}
        self.hits = 0
        self.misses = 0
    
    def get_equipment_data(self, equipment_id: str) -> Optional[EquipmentData]:
        """Get cached equipment data"""
        if equipment_id in self._equipment_cache:
            data, timestamp = self._equipment_cache[equipment_id]
            if datetime.now() - timestamp < timedelta(seconds=self.ttl_seconds):
                self.hits += 1
                return data
            else:
                del self._equipment_cache[equipment_id]
        
        self.misses += 1
        return None
    
    def set_equipment_data(self, equipment_id: str, data: EquipmentData):
        """Cache equipment data"""
        self._equipment_cache[equipment_id] = (data, datetime.now())
    
    def get_extracted_data(self, equipment_id: str) -> Optional[ExtractedRBIData]:
        """Get cached extracted data"""
        if equipment_id in self._extracted_data_cache:
            data, timestamp = self._extracted_data_cache[equipment_id]
            if datetime.now() - timestamp < timedelta(seconds=self.ttl_seconds):
                self.hits += 1
                return data
            else:
                del self._extracted_data_cache[equipment_id]
        
        self.misses += 1
        return None
    
    def set_extracted_data(self, equipment_id: str, data: ExtractedRBIData):
        """Cache extracted data"""
        self._extracted_data_cache[equipment_id] = (data, datetime.now())
    
    def get_calculation_result(self, cache_key: str) -> Optional[RBICalculationResult]:
        """Get cached calculation result"""
        if cache_key in self._result_cache:
            result, timestamp = self._result_cache[cache_key]
            if datetime.now() - timestamp < timedelta(seconds=self.ttl_seconds):
                self.hits += 1
                return result
            else:
                del self._result_cache[cache_key]
        
        self.misses += 1
        return None
    
    def set_calculation_result(self, cache_key: str, result: RBICalculationResult):
        """Cache calculation result"""
        self._result_cache[cache_key] = (result, datetime.now())
    
    def clear(self):
        """Clear all caches"""
        self._equipment_cache.clear()
        self._extracted_data_cache.clear()
        self._result_cache.clear()
        self.hits = 0
        self.misses = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_percent": round(hit_rate, 2),
            "equipment_cache_size": len(self._equipment_cache),
            "extracted_data_cache_size": len(self._extracted_data_cache),
            "result_cache_size": len(self._result_cache)
        }


class BatchCalculationService:
    """Advanced batch calculation service with caching and performance optimization"""
    
    def __init__(self, config: Optional[RBIConfig] = None):
        """Initialize batch calculation service"""
        self.config = config or RBIConfig()
        self.engine = RBICalculationEngine(self.config)
        self.cache = DataCache()
        self._active_requests: Dict[str, BatchCalculationRequest] = {}
    
    def calculate_batch(self, request: BatchCalculationRequest) -> BatchCalculationResult:
        """
        Execute batch RBI calculations with advanced features
        
        Args:
            request: Batch calculation request configuration
            
        Returns:
            BatchCalculationResult with detailed metrics and results
        """
        
        request_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{id(request)}"
        start_time = datetime.now()
        
        logger.info(f"Starting batch calculation {request_id} for {len(request.equipment_ids)} equipment")
        
        # Store active request
        self._active_requests[request_id] = request
        
        try:
            # Pre-load data if caching is enabled
            if request.cache_enabled:
                self._preload_data(request.equipment_ids)
            
            # Sort equipment by priority
            sorted_equipment = self._sort_by_priority(request.equipment_ids, request.priority_equipment)
            
            # Execute calculations
            if request.max_parallel > 1:
                results, errors = self._execute_parallel_calculations(request, sorted_equipment)
            else:
                results, errors = self._execute_sequential_calculations(request, sorted_equipment)
            
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            # Generate performance metrics
            performance_metrics = self._generate_performance_metrics(
                request, results, errors, execution_time
            )
            
            # Create batch result
            batch_result = BatchCalculationResult(
                request_id=request_id,
                total_equipment=len(request.equipment_ids),
                successful_calculations=len(results),
                failed_calculations=len(errors),
                results=results,
                errors=errors,
                execution_time=execution_time,
                cache_hits=self.cache.hits,
                cache_misses=self.cache.misses,
                start_time=start_time,
                end_time=end_time,
                performance_metrics=performance_metrics
            )
            
            logger.info(
                f"Batch calculation {request_id} completed: "
                f"{len(results)} successful, {len(errors)} failed, "
                f"{execution_time:.2f}s execution time"
            )
            
            return batch_result
            
        except Exception as e:
            logger.error(f"Batch calculation {request_id} failed: {str(e)}")
            raise
        finally:
            # Clean up active request
            if request_id in self._active_requests:
                del self._active_requests[request_id]
    
    def _preload_data(self, equipment_ids: List[str]):
        """Pre-load equipment and inspection data for batch processing"""
        
        logger.debug(f"Pre-loading data for {len(equipment_ids)} equipment")
        
        # Pre-load equipment data
        for equipment_id in equipment_ids:
            if not self.cache.get_equipment_data(equipment_id):
                try:
                    equipment_data = self.engine.equipment_service.get_equipment_data(equipment_id)
                    if equipment_data:
                        self.cache.set_equipment_data(equipment_id, equipment_data)
                except Exception as e:
                    logger.warning(f"Failed to pre-load equipment data for {equipment_id}: {str(e)}")
        
        # Pre-load extracted data
        for equipment_id in equipment_ids:
            if not self.cache.get_extracted_data(equipment_id):
                try:
                    extracted_data = self.engine.data_extractor.extract_rbi_data(equipment_id)
                    if extracted_data:
                        self.cache.set_extracted_data(equipment_id, extracted_data)
                except Exception as e:
                    logger.warning(f"Failed to pre-load extracted data for {equipment_id}: {str(e)}")
    
    def _sort_by_priority(self, equipment_ids: List[str], priority_equipment: List[str]) -> List[str]:
        """Sort equipment by priority (priority equipment first)"""
        
        priority_set = set(priority_equipment)
        # Maintain the order of priority equipment as specified
        priority_items = [eq_id for eq_id in priority_equipment if eq_id in equipment_ids]
        regular_items = [eq_id for eq_id in equipment_ids if eq_id not in priority_set]
        
        return priority_items + regular_items
    
    def _execute_parallel_calculations(
        self, 
        request: BatchCalculationRequest, 
        equipment_ids: List[str]
    ) -> Tuple[List[RBICalculationResult], List[Tuple[str, str]]]:
        """Execute calculations in parallel using ThreadPoolExecutor"""
        
        results = []
        errors = []
        completed = 0
        
        with ThreadPoolExecutor(max_workers=request.max_parallel) as executor:
            # Submit all tasks
            future_to_equipment = {
                executor.submit(self._calculate_single_with_cache, equipment_id, request): equipment_id
                for equipment_id in equipment_ids
            }
            
            # Process completed tasks
            for future in as_completed(future_to_equipment, timeout=request.timeout_seconds):
                equipment_id = future_to_equipment[future]
                completed += 1
                
                try:
                    result = future.result()
                    results.append(result)
                    
                except Exception as e:
                    error_msg = str(e)
                    errors.append((equipment_id, error_msg))
                    logger.error(f"Calculation failed for {equipment_id}: {error_msg}")
                    
                    if request.error_handling == "stop":
                        logger.info("Stopping batch calculation due to error")
                        break
                
                # Progress callback
                if request.progress_callback:
                    request.progress_callback(completed, len(equipment_ids))
        
        return results, errors
    
    def _execute_sequential_calculations(
        self, 
        request: BatchCalculationRequest, 
        equipment_ids: List[str]
    ) -> Tuple[List[RBICalculationResult], List[Tuple[str, str]]]:
        """Execute calculations sequentially"""
        
        results = []
        errors = []
        
        for i, equipment_id in enumerate(equipment_ids):
            try:
                result = self._calculate_single_with_cache(equipment_id, request)
                results.append(result)
                
            except Exception as e:
                error_msg = str(e)
                errors.append((equipment_id, error_msg))
                logger.error(f"Calculation failed for {equipment_id}: {error_msg}")
                
                if request.error_handling == "stop":
                    logger.info("Stopping batch calculation due to error")
                    break
            
            # Progress callback
            if request.progress_callback:
                request.progress_callback(i + 1, len(equipment_ids))
        
        return results, errors
    
    def _calculate_single_with_cache(
        self, 
        equipment_id: str, 
        request: BatchCalculationRequest
    ) -> RBICalculationResult:
        """Calculate single equipment with caching support"""
        
        # Check cache first
        if request.cache_enabled:
            cache_key = f"{equipment_id}_{request.requested_level.value if request.requested_level else 'auto'}"
            cached_result = self.cache.get_calculation_result(cache_key)
            if cached_result:
                return cached_result
        
        # Perform calculation
        result = self.engine.calculate_next_inspection_date(
            equipment_id=equipment_id,
            requested_level=request.requested_level
        )
        
        # Cache result
        if request.cache_enabled:
            cache_key = f"{equipment_id}_{request.requested_level.value if request.requested_level else 'auto'}"
            self.cache.set_calculation_result(cache_key, result)
        
        return result
    
    def _generate_performance_metrics(
        self,
        request: BatchCalculationRequest,
        results: List[RBICalculationResult],
        errors: List[Tuple[str, str]],
        execution_time: float
    ) -> Dict[str, Any]:
        """Generate detailed performance metrics"""
        
        total_equipment = len(request.equipment_ids)
        successful_count = len(results)
        failed_count = len(errors)
        
        # Calculate rates
        success_rate = (successful_count / total_equipment * 100) if total_equipment > 0 else 0
        throughput = total_equipment / execution_time if execution_time > 0 else 0
        
        # Analyze calculation levels
        level_distribution = {}
        fallback_count = 0
        confidence_scores = []
        
        for result in results:
            level = result.calculation_level.value
            level_distribution[level] = level_distribution.get(level, 0) + 1
            
            if result.fallback_occurred:
                fallback_count += 1
            
            confidence_scores.append(result.confidence_score)
        
        # Calculate confidence statistics
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        min_confidence = min(confidence_scores) if confidence_scores else 0
        max_confidence = max(confidence_scores) if confidence_scores else 0
        
        # Cache statistics
        cache_stats = self.cache.get_stats()
        
        return {
            "execution_metrics": {
                "total_equipment": total_equipment,
                "successful_calculations": successful_count,
                "failed_calculations": failed_count,
                "success_rate_percent": round(success_rate, 2),
                "execution_time_seconds": round(execution_time, 2),
                "throughput_per_second": round(throughput, 2),
                "average_time_per_calculation": round(execution_time / total_equipment, 3) if total_equipment > 0 else 0
            },
            "calculation_analysis": {
                "level_distribution": level_distribution,
                "fallback_count": fallback_count,
                "fallback_rate_percent": round((fallback_count / successful_count * 100) if successful_count > 0 else 0, 2),
                "confidence_statistics": {
                    "average": round(avg_confidence, 3),
                    "minimum": round(min_confidence, 3),
                    "maximum": round(max_confidence, 3)
                }
            },
            "cache_performance": cache_stats,
            "configuration": {
                "max_parallel": request.max_parallel,
                "cache_enabled": request.cache_enabled,
                "error_handling": request.error_handling,
                "priority_equipment_count": len(request.priority_equipment)
            }
        }
    
    def get_active_requests(self) -> Dict[str, Dict[str, Any]]:
        """Get information about active batch requests"""
        
        active_info = {}
        for request_id, request in self._active_requests.items():
            active_info[request_id] = {
                "equipment_count": len(request.equipment_ids),
                "requested_level": request.requested_level.value if request.requested_level else "auto",
                "max_parallel": request.max_parallel,
                "cache_enabled": request.cache_enabled
            }
        
        return active_info
    
    def clear_cache(self):
        """Clear all cached data"""
        self.cache.clear()
        logger.info("Batch calculation cache cleared")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get current cache statistics"""
        return self.cache.get_stats()
    
    def optimize_batch_size(self, total_equipment: int, target_time_seconds: int = 300) -> int:
        """Recommend optimal batch size based on performance targets"""
        
        # Simple heuristic based on system capabilities
        # In production, this could be more sophisticated
        
        if total_equipment <= 10:
            return total_equipment
        elif total_equipment <= 100:
            return min(20, total_equipment)
        elif total_equipment <= 1000:
            return min(50, total_equipment)
        else:
            return min(100, total_equipment)
    
    def create_batch_request(
        self,
        equipment_ids: List[str],
        requested_level: Optional[RBILevel] = None,
        **kwargs
    ) -> BatchCalculationRequest:
        """Create a batch calculation request with sensible defaults"""
        
        # Determine optimal parallel processing
        optimal_parallel = min(5, max(1, len(equipment_ids) // 10))
        
        return BatchCalculationRequest(
            equipment_ids=equipment_ids,
            requested_level=requested_level,
            max_parallel=kwargs.get('max_parallel', optimal_parallel),
            cache_enabled=kwargs.get('cache_enabled', True),
            progress_callback=kwargs.get('progress_callback'),
            error_handling=kwargs.get('error_handling', 'continue'),
            retry_attempts=kwargs.get('retry_attempts', 3),
            timeout_seconds=kwargs.get('timeout_seconds', 300),
            priority_equipment=kwargs.get('priority_equipment', [])
        )