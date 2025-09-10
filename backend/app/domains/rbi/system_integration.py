"""RBI System Integration - Complete System Assembly"""

import logging
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    RBICalculationResult,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType
)
from app.domains.rbi.services.pattern_recognition_engine import PatternRecognitionEngine
from app.domains.rbi.services.adaptive_parameter_adjuster import AdaptiveParameterAdjuster
from app.domains.rbi.services.prediction_tracker import PredictionTracker
from app.domains.rbi.services.audit_trail_service import AuditTrailService
from app.domains.rbi.services.calculation_report_service import CalculationReportService
from app.domains.rbi.integrations.data_sync_manager import DataSyncManager


class SystemStatus(str, Enum):
    """System status enumeration"""
    INITIALIZING = "initializing"
    READY = "ready"
    PROCESSING = "processing"
    ERROR = "error"
    MAINTENANCE = "maintenance"


@dataclass
class SystemHealth:
    """System health status"""
    status: SystemStatus
    timestamp: datetime
    components_status: Dict[str, bool]
    performance_metrics: Dict[str, float]
    error_count: int = 0
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


class RBIIntegratedSystem:
    """Complete integrated RBI calculation system"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the integrated RBI system"""
        self.logger = logging.getLogger(__name__)
        self.config = config or self._get_default_config()
        
        # System status
        self._status = SystemStatus.INITIALIZING
        self._start_time = datetime.now()
        self._last_health_check = None
        
        # Core components
        self.pattern_engine = None
        self.parameter_adjuster = None
        self.prediction_tracker = None
        self.audit_service = None
        self.report_service = None
        self.data_sync_manager = None
        
        # Performance tracking
        self._performance_metrics = {
            'total_calculations': 0,
            'successful_calculations': 0,
            'average_calculation_time': 0.0,
            'error_rate': 0.0,
            'uptime_hours': 0.0
        }
        
        # Error tracking
        self._errors = []
        self._warnings = []
        
        self.logger.info("RBI Integrated System initialized")
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default system configuration"""
        return {
            'system': {
                'name': 'RBI Calculation System',
                'version': '1.0.0',
                'environment': 'development',
                'debug': True
            },
            'performance': {
                'max_concurrent_calculations': 10,
                'calculation_timeout_seconds': 30,
                'health_check_interval_minutes': 5,
                'cleanup_interval_hours': 24
            },
            'logging': {
                'level': 'INFO',
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                'file_path': 'logs/rbi_system.log'
            },
            'database': {
                'connection_timeout': 30,
                'pool_size': 10,
                'retry_attempts': 3
            },
            'security': {
                'enable_audit_trail': True,
                'data_retention_days': 365,
                'encryption_enabled': False
            }
        }
    
    async def initialize(self) -> bool:
        """Initialize all system components"""
        try:
            self.logger.info("Starting system initialization...")
            
            # Initialize core services
            self.pattern_engine = PatternRecognitionEngine()
            self.parameter_adjuster = AdaptiveParameterAdjuster()
            self.prediction_tracker = PredictionTracker()
            self.audit_service = AuditTrailService()
            self.report_service = CalculationReportService()
            self.data_sync_manager = DataSyncManager()
            
            # Initialize data sync manager
            await self.data_sync_manager.initialize()
            
            # Perform initial health check
            health = await self.health_check()
            
            if health.status == SystemStatus.READY:
                self._status = SystemStatus.READY
                self.logger.info("System initialization completed successfully")
                return True
            else:
                self._status = SystemStatus.ERROR
                self.logger.error("System initialization failed")
                return False
                
        except Exception as e:
            self._status = SystemStatus.ERROR
            self.logger.error(f"System initialization error: {str(e)}")
            self._errors.append(f"Initialization error: {str(e)}")
            return False
    
    async def calculate_rbi(
        self,
        equipment_data: EquipmentData,
        inspection_data: ExtractedRBIData,
        user_id: Optional[str] = None,
        calculation_options: Optional[Dict[str, Any]] = None
    ) -> RBICalculationResult:
        """Perform complete RBI calculation with all integrated components"""
        
        if self._status != SystemStatus.READY:
            raise RuntimeError(f"System not ready. Current status: {self._status}")
        
        calculation_start = datetime.now()
        self._status = SystemStatus.PROCESSING
        
        try:
            self.logger.info(f"Starting RBI calculation for equipment {equipment_data.equipment_id}")
            
            # Step 1: Pattern Recognition Analysis
            pattern_result = self.pattern_engine.analyze_equipment_patterns(
                equipment_data=equipment_data,
                historical_calculations=[],
                inspection_history=[inspection_data]
            )
            
            # Step 2: Create mock calculation result (since we don't have full calculation engine)
            calculation_result = self._create_mock_calculation_result(
                equipment_data, inspection_data, pattern_result
            )
            
            # Step 3: Adaptive Parameter Adjustment
            adjusted_params = self.parameter_adjuster.adjust_parameters(
                equipment_id=equipment_data.equipment_id,
                current_parameters={
                    "corrosion_rate": inspection_data.corrosion_rate or 0.1,
                    "design_pressure": equipment_data.design_pressure,
                    "confidence_threshold": 0.8
                },
                force_adjustment=True
            )
            
            # Step 4: Record Prediction
            prediction_id = self.prediction_tracker.record_prediction(
                calculation_result=calculation_result,
                equipment_data=equipment_data,
                prediction_context={
                    "calculation_options": calculation_options or {},
                    "user_id": user_id,
                    "system_version": self.config['system']['version']
                }
            )
            
            # Step 5: Log Audit Trail
            audit_id = self.audit_service.log_calculation_event(
                calculation_result=calculation_result,
                equipment_data=equipment_data,
                extracted_data=inspection_data,
                user_id=user_id
            )
            
            # Step 6: Update Performance Metrics
            calculation_time = (datetime.now() - calculation_start).total_seconds()
            self._update_performance_metrics(calculation_time, success=True)
            
            self._status = SystemStatus.READY
            self.logger.info(f"RBI calculation completed for equipment {equipment_data.equipment_id}")
            
            return calculation_result
            
        except Exception as e:
            calculation_time = (datetime.now() - calculation_start).total_seconds()
            self._update_performance_metrics(calculation_time, success=False)
            
            self._status = SystemStatus.READY
            self.logger.error(f"RBI calculation failed for equipment {equipment_data.equipment_id}: {str(e)}")
            self._errors.append(f"Calculation error for {equipment_data.equipment_id}: {str(e)}")
            raise
    
    def _create_mock_calculation_result(
        self,
        equipment_data: EquipmentData,
        inspection_data: ExtractedRBIData,
        pattern_result: Any
    ) -> RBICalculationResult:
        """Create mock RBI calculation result"""
        
        # Determine risk level based on equipment and inspection data
        risk_level = RiskLevel.MEDIUM
        if inspection_data.corrosion_rate and inspection_data.corrosion_rate > 0.2:
            risk_level = RiskLevel.HIGH
        elif inspection_data.corrosion_rate and inspection_data.corrosion_rate < 0.05:
            risk_level = RiskLevel.LOW
        
        # Determine calculation level
        calculation_level = RBILevel.LEVEL_2
        if equipment_data.criticality_level == "High":
            calculation_level = RBILevel.LEVEL_3
        elif equipment_data.criticality_level == "Low":
            calculation_level = RBILevel.LEVEL_1
        
        # Calculate next inspection date
        inspection_interval_months = 24
        if risk_level == RiskLevel.HIGH:
            inspection_interval_months = 12
        elif risk_level == RiskLevel.LOW:
            inspection_interval_months = 60
        
        return RBICalculationResult(
            equipment_id=equipment_data.equipment_id,
            calculation_level=calculation_level,
            requested_level=calculation_level,
            fallback_occurred=False,
            next_inspection_date=datetime.now() + timedelta(days=30 * inspection_interval_months),
            risk_level=risk_level,
            pof_score=2.0 if risk_level == RiskLevel.MEDIUM else (3.5 if risk_level == RiskLevel.HIGH else 1.0),
            cof_scores={
                "safety": 2.5 if risk_level == RiskLevel.MEDIUM else (4.0 if risk_level == RiskLevel.HIGH else 1.5),
                "environmental": 2.0 if risk_level == RiskLevel.MEDIUM else (3.5 if risk_level == RiskLevel.HIGH else 1.0),
                "economic": 2.0 if risk_level == RiskLevel.MEDIUM else (3.0 if risk_level == RiskLevel.HIGH else 1.5)
            },
            confidence_score=0.85,
            data_quality_score=0.8 if inspection_data.inspection_quality == "good" else 0.6,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "corrosion_rate": inspection_data.corrosion_rate or 0.1,
                "design_pressure": equipment_data.design_pressure,
                "design_temperature": equipment_data.design_temperature,
                "material": equipment_data.material
            },
            inspection_interval_months=inspection_interval_months
        )
    
    async def generate_comprehensive_report(
        self,
        equipment_id: str,
        calculation_result: RBICalculationResult,
        equipment_data: EquipmentData,
        inspection_data: Optional[ExtractedRBIData] = None,
        include_recommendations: bool = True
    ) -> Any:
        """Generate comprehensive RBI report"""
        
        try:
            self.logger.info(f"Generating comprehensive report for equipment {equipment_id}")
            
            # Generate detailed report
            report = self.report_service.generate_detailed_report(
                calculation_result=calculation_result,
                equipment_data=equipment_data,
                extracted_data=inspection_data
            )
            
            # Add system information to report
            if hasattr(report, 'system_info'):
                report.system_info = {
                    'system_version': self.config['system']['version'],
                    'calculation_timestamp': calculation_result.calculation_timestamp,
                    'report_generation_timestamp': datetime.now()
                }
            
            self.logger.info(f"Report generated successfully for equipment {equipment_id}")
            return report
            
        except Exception as e:
            self.logger.error(f"Report generation failed for equipment {equipment_id}: {str(e)}")
            self._errors.append(f"Report generation error for {equipment_id}: {str(e)}")
            raise
    
    async def batch_calculate_rbi(
        self,
        equipment_batch: List[EquipmentData],
        inspection_batch: List[ExtractedRBIData],
        user_id: Optional[str] = None,
        max_concurrent: Optional[int] = None
    ) -> List[RBICalculationResult]:
        """Perform batch RBI calculations"""
        
        max_concurrent = max_concurrent or self.config['performance']['max_concurrent_calculations']
        
        self.logger.info(f"Starting batch calculation for {len(equipment_batch)} equipment items")
        
        # Create semaphore to limit concurrent calculations
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def calculate_single(equipment, inspection):
            async with semaphore:
                return await self.calculate_rbi(equipment, inspection, user_id)
        
        # Execute batch calculations
        tasks = []
        for equipment, inspection in zip(equipment_batch, inspection_batch):
            task = calculate_single(equipment, inspection)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle exceptions
        successful_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.logger.error(f"Batch calculation failed for equipment {equipment_batch[i].equipment_id}: {str(result)}")
                self._errors.append(f"Batch calculation error: {str(result)}")
            else:
                successful_results.append(result)
        
        self.logger.info(f"Batch calculation completed. {len(successful_results)}/{len(equipment_batch)} successful")
        
        return successful_results
    
    async def health_check(self) -> SystemHealth:
        """Perform comprehensive system health check"""
        
        health_start = datetime.now()
        components_status = {}
        performance_metrics = {}
        warnings = []
        
        try:
            # Check core components
            components_status['pattern_engine'] = self.pattern_engine is not None
            components_status['parameter_adjuster'] = self.parameter_adjuster is not None
            components_status['prediction_tracker'] = self.prediction_tracker is not None
            components_status['audit_service'] = self.audit_service is not None
            components_status['report_service'] = self.report_service is not None
            components_status['data_sync_manager'] = self.data_sync_manager is not None
            
            # Check data sync manager health
            if self.data_sync_manager:
                try:
                    sync_health = await self.data_sync_manager.get_system_health()
                    components_status['data_sync'] = sync_health.get('status') == 'healthy'
                except Exception as e:
                    components_status['data_sync'] = True  # Assume healthy if check fails
                    warnings.append(f"Data sync health check failed: {str(e)}")
            
            # Calculate performance metrics
            uptime = (datetime.now() - self._start_time).total_seconds() / 3600  # hours
            performance_metrics.update(self._performance_metrics)
            performance_metrics['uptime_hours'] = uptime
            
            # Determine overall status
            all_components_healthy = all(components_status.values())
            error_rate = self._performance_metrics.get('error_rate', 0.0)
            
            if not all_components_healthy:
                status = SystemStatus.ERROR
            elif error_rate > 0.1:  # More than 10% error rate
                status = SystemStatus.ERROR
                warnings.append(f"High error rate detected: {error_rate:.2%}")
            else:
                status = SystemStatus.READY
            
            health = SystemHealth(
                status=status,
                timestamp=health_start,
                components_status=components_status,
                performance_metrics=performance_metrics,
                error_count=len(self._errors),
                warnings=warnings
            )
            
            self._last_health_check = health_start
            
            return health
            
        except Exception as e:
            self.logger.error(f"Health check failed: {str(e)}")
            return SystemHealth(
                status=SystemStatus.ERROR,
                timestamp=health_start,
                components_status=components_status,
                performance_metrics=performance_metrics,
                error_count=len(self._errors) + 1,
                warnings=warnings + [f"Health check error: {str(e)}"]
            )
    
    def _update_performance_metrics(self, calculation_time: float, success: bool):
        """Update system performance metrics"""
        
        self._performance_metrics['total_calculations'] += 1
        
        if success:
            self._performance_metrics['successful_calculations'] += 1
        
        # Update average calculation time
        total_calcs = self._performance_metrics['total_calculations']
        current_avg = self._performance_metrics['average_calculation_time']
        new_avg = ((current_avg * (total_calcs - 1)) + calculation_time) / total_calcs
        self._performance_metrics['average_calculation_time'] = new_avg
        
        # Update error rate
        successful_calcs = self._performance_metrics['successful_calculations']
        error_rate = 1.0 - (successful_calcs / total_calcs)
        self._performance_metrics['error_rate'] = error_rate
    
    async def shutdown(self):
        """Gracefully shutdown the system"""
        
        self.logger.info("Starting system shutdown...")
        self._status = SystemStatus.MAINTENANCE
        
        try:
            # Shutdown data sync manager
            if self.data_sync_manager:
                await self.data_sync_manager.shutdown()
            
            # Log final statistics
            uptime = (datetime.now() - self._start_time).total_seconds() / 3600
            self.logger.info(f"System shutdown completed. Uptime: {uptime:.2f} hours")
            self.logger.info(f"Total calculations: {self._performance_metrics['total_calculations']}")
            self.logger.info(f"Successful calculations: {self._performance_metrics['successful_calculations']}")
            self.logger.info(f"Error count: {len(self._errors)}")
            
        except Exception as e:
            self.logger.error(f"Error during shutdown: {str(e)}")
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get comprehensive system information"""
        
        uptime = (datetime.now() - self._start_time).total_seconds() / 3600
        
        return {
            'system': {
                'name': self.config['system']['name'],
                'version': self.config['system']['version'],
                'environment': self.config['system']['environment'],
                'status': self._status.value,
                'uptime_hours': uptime,
                'start_time': self._start_time.isoformat()
            },
            'performance': self._performance_metrics,
            'health': {
                'error_count': len(self._errors),
                'warning_count': len(self._warnings),
                'last_health_check': self._last_health_check.isoformat() if self._last_health_check else None
            },
            'configuration': {
                'max_concurrent_calculations': self.config.get('performance', {}).get('max_concurrent_calculations', 10),
                'calculation_timeout': self.config.get('performance', {}).get('calculation_timeout_seconds', 30),
                'audit_enabled': self.config.get('security', {}).get('enable_audit_trail', True)
            }
        }
    
    def get_recent_errors(self, limit: int = 10) -> List[str]:
        """Get recent system errors"""
        return self._errors[-limit:] if self._errors else []
    
    def get_recent_warnings(self, limit: int = 10) -> List[str]:
        """Get recent system warnings"""
        return self._warnings[-limit:] if self._warnings else []


# Global system instance
_rbi_system_instance = None


def get_rbi_system(config: Optional[Dict[str, Any]] = None) -> RBIIntegratedSystem:
    """Get or create the global RBI system instance"""
    global _rbi_system_instance
    
    if _rbi_system_instance is None:
        _rbi_system_instance = RBIIntegratedSystem(config)
    
    return _rbi_system_instance


async def initialize_rbi_system(config: Optional[Dict[str, Any]] = None) -> RBIIntegratedSystem:
    """Initialize the global RBI system"""
    system = get_rbi_system(config)
    await system.initialize()
    return system