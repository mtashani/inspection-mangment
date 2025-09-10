"""Example usage of Batch Calculation Service"""

import time
from datetime import datetime
from app.domains.rbi.services.batch_calculation_service import (
    BatchCalculationService,
    BatchCalculationRequest
)
from app.domains.rbi.models.core import RBILevel
from app.domains.rbi.models.config import RBIConfig


def progress_callback(completed: int, total: int):
    """Progress callback function"""
    percentage = (completed / total) * 100
    print(f"Progress: {completed}/{total} ({percentage:.1f}%)")


def main():
    """Demonstrate Batch Calculation Service usage"""
    
    print("=== RBI Batch Calculation Service Example ===\n")
    
    # Initialize the service
    config = RBIConfig()
    batch_service = BatchCalculationService(config)
    
    # Example 1: Simple batch calculation
    print("1. Simple Batch Calculation")
    print("-" * 40)
    
    equipment_list = ["V-101", "V-102", "V-103", "E-201", "P-301"]
    
    # Create batch request using helper method
    request = batch_service.create_batch_request(
        equipment_ids=equipment_list,
        requested_level=RBILevel.LEVEL_2,
        max_parallel=3,
        cache_enabled=True
    )
    
    print(f"Processing {len(equipment_list)} equipment items...")
    start_time = time.time()
    
    try:
        result = batch_service.calculate_batch(request)
        
        execution_time = time.time() - start_time
        
        print(f"\nBatch Calculation Results:")
        print(f"- Total Equipment: {result.total_equipment}")
        print(f"- Successful: {result.successful_calculations}")
        print(f"- Failed: {result.failed_calculations}")
        print(f"- Execution Time: {result.execution_time:.2f} seconds")
        print(f"- Cache Hits: {result.cache_hits}")
        print(f"- Cache Misses: {result.cache_misses}")
        
        # Display individual results
        print(f"\nIndividual Results:")
        for calc_result in result.results:
            print(f"  {calc_result.equipment_id:8} | "
                  f"{calc_result.calculation_level.value:8} | "
                  f"{calc_result.risk_level.value:10} | "
                  f"{calc_result.inspection_interval_months:2d} months")
        
        # Display errors if any
        if result.errors:
            print(f"\nErrors:")
            for equipment_id, error_msg in result.errors:
                print(f"  {equipment_id}: {error_msg}")
        
        # Display performance metrics
        metrics = result.performance_metrics
        exec_metrics = metrics["execution_metrics"]
        print(f"\nPerformance Metrics:")
        print(f"- Success Rate: {exec_metrics['success_rate_percent']:.1f}%")
        print(f"- Throughput: {exec_metrics['throughput_per_second']:.2f} calculations/sec")
        print(f"- Avg Time per Calculation: {exec_metrics['average_time_per_calculation']:.3f}s")
        
        calc_analysis = metrics["calculation_analysis"]
        print(f"- Level Distribution: {calc_analysis['level_distribution']}")
        print(f"- Fallback Rate: {calc_analysis['fallback_rate_percent']:.1f}%")
        
    except Exception as e:
        print(f"Batch calculation failed: {str(e)}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 2: Advanced batch calculation with priority and progress
    print("2. Advanced Batch Calculation with Priority")
    print("-" * 50)
    
    large_equipment_list = [f"V-{i:03d}" for i in range(1, 21)]  # V-001 to V-020
    priority_equipment = ["V-001", "V-005", "V-010"]  # High priority items
    
    # Create advanced request
    advanced_request = BatchCalculationRequest(
        equipment_ids=large_equipment_list,
        requested_level=RBILevel.LEVEL_3,
        max_parallel=5,
        cache_enabled=True,
        progress_callback=progress_callback,
        error_handling="continue",
        priority_equipment=priority_equipment,
        timeout_seconds=600
    )
    
    print(f"Processing {len(large_equipment_list)} equipment items with priority...")
    print(f"Priority equipment: {priority_equipment}")
    
    try:
        result = batch_service.calculate_batch(advanced_request)
        
        print(f"\nAdvanced Batch Results:")
        print(f"- Total Equipment: {result.total_equipment}")
        print(f"- Successful: {result.successful_calculations}")
        print(f"- Failed: {result.failed_calculations}")
        print(f"- Execution Time: {result.execution_time:.2f} seconds")
        
        # Show first few results to verify priority ordering
        print(f"\nFirst 5 Results (should include priority items first):")
        for i, calc_result in enumerate(result.results[:5]):
            priority_mark = "⭐" if calc_result.equipment_id in priority_equipment else "  "
            print(f"  {i+1}. {priority_mark} {calc_result.equipment_id} | "
                  f"{calc_result.calculation_level.value} | "
                  f"{calc_result.risk_level.value}")
        
        # Performance analysis
        metrics = result.performance_metrics
        cache_perf = metrics["cache_performance"]
        print(f"\nCache Performance:")
        print(f"- Hit Rate: {cache_perf['hit_rate_percent']:.1f}%")
        print(f"- Total Hits: {cache_perf['hits']}")
        print(f"- Total Misses: {cache_perf['misses']}")
        
    except Exception as e:
        print(f"Advanced batch calculation failed: {str(e)}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 3: Cache performance demonstration
    print("3. Cache Performance Demonstration")
    print("-" * 40)
    
    # Clear cache first
    batch_service.clear_cache()
    print("Cache cleared.")
    
    test_equipment = ["V-101", "V-102", "V-103"]
    
    # First run - should miss cache
    print("\nFirst run (cache misses expected):")
    request1 = batch_service.create_batch_request(
        equipment_ids=test_equipment,
        cache_enabled=True
    )
    
    result1 = batch_service.calculate_batch(request1)
    print(f"- Cache Hits: {result1.cache_hits}")
    print(f"- Cache Misses: {result1.cache_misses}")
    print(f"- Execution Time: {result1.execution_time:.3f}s")
    
    # Second run - should hit cache
    print("\nSecond run (cache hits expected):")
    request2 = batch_service.create_batch_request(
        equipment_ids=test_equipment,
        cache_enabled=True
    )
    
    result2 = batch_service.calculate_batch(request2)
    print(f"- Cache Hits: {result2.cache_hits}")
    print(f"- Cache Misses: {result2.cache_misses}")
    print(f"- Execution Time: {result2.execution_time:.3f}s")
    
    # Show cache statistics
    cache_stats = batch_service.get_cache_stats()
    print(f"\nOverall Cache Statistics:")
    print(f"- Hit Rate: {cache_stats['hit_rate_percent']:.1f}%")
    print(f"- Equipment Cache Size: {cache_stats['equipment_cache_size']}")
    print(f"- Result Cache Size: {cache_stats['result_cache_size']}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 4: Batch size optimization
    print("4. Batch Size Optimization")
    print("-" * 30)
    
    test_sizes = [5, 50, 500, 5000]
    
    print("Recommended batch sizes:")
    for size in test_sizes:
        optimal_size = batch_service.optimize_batch_size(size)
        print(f"- {size:4d} equipment → batch size: {optimal_size}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 5: Error handling strategies
    print("5. Error Handling Strategies")
    print("-" * 35)
    
    # Simulate equipment list with some that might fail
    mixed_equipment = ["V-101", "INVALID-001", "V-102", "INVALID-002", "V-103"]
    
    error_strategies = ["continue", "stop"]
    
    for strategy in error_strategies:
        print(f"\nTesting '{strategy}' error handling:")
        
        request = BatchCalculationRequest(
            equipment_ids=mixed_equipment,
            max_parallel=1,
            cache_enabled=False,
            error_handling=strategy
        )
        
        try:
            result = batch_service.calculate_batch(request)
            print(f"- Processed: {result.successful_calculations}/{result.total_equipment}")
            print(f"- Errors: {result.failed_calculations}")
            print(f"- Strategy: {strategy}")
            
            if result.errors:
                print(f"- Error Details: {len(result.errors)} errors occurred")
                
        except Exception as e:
            print(f"- Batch failed with strategy '{strategy}': {str(e)}")
    
    print("\n" + "="*60)
    
    print("\n🚀 Batch Calculation Service Demo Complete!")
    print("\nKey Features Demonstrated:")
    print("✓ Simple batch processing")
    print("✓ Advanced configuration options")
    print("✓ Priority equipment handling")
    print("✓ Progress tracking")
    print("✓ Intelligent caching")
    print("✓ Performance optimization")
    print("✓ Error handling strategies")
    print("✓ Comprehensive metrics")


if __name__ == "__main__":
    main()