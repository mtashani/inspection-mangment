"""Data Synchronization Manager - Orchestrates all data integration services"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import json

from app.domains.rbi.integrations.equipment_database_integration import (
    EquipmentDatabaseIntegrationService,
    DatabaseConnection,
    SyncConfiguration,
    SyncResult,
    SyncMode
)
from app.domains.rbi.integrations.inspection_report_integration import (
    InspectionReportIntegrationService,
    ReportSourceConfig,
    ReportProcessingResult
)


class SyncStatus(str, Enum):
    """Data synchronization status"""
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


class DataType(str, Enum):
    """Types of data being synchronized"""
    EQUIPMENT_MASTER = "equipment_master"
    INSPECTION_REPORTS = "inspection_reports"
    MAINTENANCE_HISTORY = "maintenance_history"
    CONFIGURATION = "configuration"


@dataclass
class SyncJobConfig:
    """Configuration for a synchronization job"""
    job_id: str
    job_name: str
    data_type: DataType
    source_config: Union[DatabaseConnection, ReportSourceConfig]
    sync_mode: SyncMode
    schedule_cron: Optional[str] = None
    enabled: bool = True
    retry_count: int = 3
    retry_delay_minutes: int = 5
    timeout_minutes: int = 30
    notification_emails: List[str] = field(default_factory=list)
    custom_settings: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SyncJobResult:
    """Result of a synchronization job"""
    job_id: str
    job_name: str
    data_type: DataType
    start_time: datetime
    end_time: Optional[datetime] = None
    status: SyncStatus = SyncStatus.RUNNING
    records_processed: int = 0
    records_successful: int = 0
    records_failed: int = 0
    error_message: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def duration_seconds(self) -> float:
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return (datetime.now() - self.start_time).total_seconds()
    
    @property
    def success_rate(self) -> float:
        if self.records_processed == 0:
            return 0.0
        return self.records_successful / self.records_processed


@dataclass
class SystemHealthStatus:
    """Overall system health status"""
    timestamp: datetime
    overall_status: str
    active_jobs: int
    failed_jobs: int
    total_records_processed: int
    average_success_rate: float
    service_statuses: Dict[str, str] = field(default_factory=dict)
    recent_errors: List[str] = field(default_factory=list)


class DataSyncManager:
    """Main orchestrator for all data synchronization services"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Initialize integration services
        self.equipment_service = EquipmentDatabaseIntegrationService()
        self.inspection_service = InspectionReportIntegrationService()
        
        # Job management
        self.sync_jobs: Dict[str, SyncJobConfig] = {}
        self.job_results: Dict[str, List[SyncJobResult]] = {}
        self.active_jobs: Dict[str, asyncio.Task] = {}
        
        # Scheduling
        self.scheduler_task: Optional[asyncio.Task] = None
        self.scheduler_running = False
        
        # Health monitoring
        self.health_check_interval = 300  # 5 minutes
        self.health_task: Optional[asyncio.Task] = None
    
    async def initialize(self):
        """Initialize the data sync manager"""
        try:
            self.logger.info("Initializing Data Sync Manager")
            
            # Start scheduler
            await self.start_scheduler()
            
            # Start health monitoring
            await self.start_health_monitoring()
            
            self.logger.info("Data Sync Manager initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Data Sync Manager: {str(e)}")
            raise
    
    async def add_sync_job(self, job_config: SyncJobConfig) -> bool:
        """Add a new synchronization job"""
        try:
            self.logger.info(f"Adding sync job: {job_config.job_id}")
            
            # Validate job configuration
            if not self._validate_job_config(job_config):
                return False
            
            # Configure the appropriate service
            if job_config.data_type == DataType.EQUIPMENT_MASTER:
                success = await self._configure_equipment_sync(job_config)
            elif job_config.data_type == DataType.INSPECTION_REPORTS:
                success = await self._configure_inspection_sync(job_config)
            else:
                self.logger.error(f"Unsupported data type: {job_config.data_type}")
                return False
            
            if success:
                self.sync_jobs[job_config.job_id] = job_config
                self.job_results[job_config.job_id] = []
                
                # Start job if it's enabled and real-time
                if job_config.enabled and job_config.sync_mode == SyncMode.REAL_TIME:
                    await self.start_sync_job(job_config.job_id)
                
                self.logger.info(f"Successfully added sync job: {job_config.job_id}")
                return True
            else:
                self.logger.error(f"Failed to configure sync job: {job_config.job_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error adding sync job {job_config.job_id}: {str(e)}")
            return False
    
    async def start_sync_job(self, job_id: str) -> bool:
        """Start a synchronization job"""
        try:
            if job_id not in self.sync_jobs:
                self.logger.error(f"Sync job not found: {job_id}")
                return False
            
            if job_id in self.active_jobs:
                self.logger.warning(f"Sync job already running: {job_id}")
                return True
            
            job_config = self.sync_jobs[job_id]
            
            # Create and start job task
            task = asyncio.create_task(self._execute_sync_job(job_config))
            self.active_jobs[job_id] = task
            
            self.logger.info(f"Started sync job: {job_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error starting sync job {job_id}: {str(e)}")
            return False
    
    async def stop_sync_job(self, job_id: str) -> bool:
        """Stop a synchronization job"""
        try:
            if job_id in self.active_jobs:
                task = self.active_jobs[job_id]
                task.cancel()
                
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                
                del self.active_jobs[job_id]
                self.logger.info(f"Stopped sync job: {job_id}")
                return True
            else:
                self.logger.warning(f"Sync job not running: {job_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error stopping sync job {job_id}: {str(e)}")
            return False
    
    async def pause_sync_job(self, job_id: str) -> bool:
        """Pause a synchronization job"""
        try:
            if job_id in self.sync_jobs:
                self.sync_jobs[job_id].enabled = False
                await self.stop_sync_job(job_id)
                self.logger.info(f"Paused sync job: {job_id}")
                return True
            else:
                self.logger.error(f"Sync job not found: {job_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error pausing sync job {job_id}: {str(e)}")
            return False
    
    async def resume_sync_job(self, job_id: str) -> bool:
        """Resume a paused synchronization job"""
        try:
            if job_id in self.sync_jobs:
                self.sync_jobs[job_id].enabled = True
                await self.start_sync_job(job_id)
                self.logger.info(f"Resumed sync job: {job_id}")
                return True
            else:
                self.logger.error(f"Sync job not found: {job_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error resuming sync job {job_id}: {str(e)}")
            return False
    
    async def remove_sync_job(self, job_id: str) -> bool:
        """Remove a synchronization job"""
        try:
            # Stop job if running
            await self.stop_sync_job(job_id)
            
            # Remove from configuration
            if job_id in self.sync_jobs:
                job_config = self.sync_jobs[job_id]
                
                # Clean up service configuration
                if job_config.data_type == DataType.EQUIPMENT_MASTER:
                    # Remove from equipment service
                    pass
                elif job_config.data_type == DataType.INSPECTION_REPORTS:
                    await self.inspection_service.remove_report_source(job_id)
                
                del self.sync_jobs[job_id]
                
                # Keep job results for historical purposes
                self.logger.info(f"Removed sync job: {job_id}")
                return True
            else:
                self.logger.warning(f"Sync job not found: {job_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error removing sync job {job_id}: {str(e)}")
            return False
    
    async def get_sync_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a synchronization job"""
        try:
            if job_id not in self.sync_jobs:
                return None
            
            job_config = self.sync_jobs[job_id]
            is_running = job_id in self.active_jobs
            
            # Get latest results
            latest_results = self.job_results.get(job_id, [])
            latest_result = latest_results[-1] if latest_results else None
            
            return {
                "job_id": job_id,
                "job_name": job_config.job_name,
                "data_type": job_config.data_type.value,
                "sync_mode": job_config.sync_mode.value,
                "enabled": job_config.enabled,
                "is_running": is_running,
                "last_run": latest_result.start_time.isoformat() if latest_result else None,
                "last_status": latest_result.status.value if latest_result else "never_run",
                "total_runs": len(latest_results),
                "success_rate": sum(r.success_rate for r in latest_results) / len(latest_results) if latest_results else 0.0
            }
            
        except Exception as e:
            self.logger.error(f"Error getting sync job status {job_id}: {str(e)}")
            return None
    
    async def get_all_sync_jobs_status(self) -> List[Dict[str, Any]]:
        """Get status of all synchronization jobs"""
        statuses = []
        
        for job_id in self.sync_jobs.keys():
            status = await self.get_sync_job_status(job_id)
            if status:
                statuses.append(status)
        
        return statuses
    
    async def get_sync_job_results(self, job_id: str, limit: int = 50) -> List[SyncJobResult]:
        """Get results for a synchronization job"""
        if job_id in self.job_results:
            results = self.job_results[job_id]
            return results[-limit:] if len(results) > limit else results
        return []
    
    async def trigger_manual_sync(self, job_id: str) -> bool:
        """Trigger a manual synchronization"""
        try:
            if job_id not in self.sync_jobs:
                self.logger.error(f"Sync job not found: {job_id}")
                return False
            
            # Create a one-time execution task
            job_config = self.sync_jobs[job_id]
            task = asyncio.create_task(self._execute_sync_job(job_config, manual=True))
            
            self.logger.info(f"Triggered manual sync for job: {job_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error triggering manual sync {job_id}: {str(e)}")
            return False
    
    async def get_system_health(self) -> SystemHealthStatus:
        """Get overall system health status"""
        try:
            current_time = datetime.now()
            
            # Count active and failed jobs
            active_jobs = len(self.active_jobs)
            failed_jobs = 0
            total_records = 0
            success_rates = []
            
            for job_results in self.job_results.values():
                if job_results:
                    latest_result = job_results[-1]
                    if latest_result.status == SyncStatus.FAILED:
                        failed_jobs += 1
                    
                    total_records += latest_result.records_processed
                    if latest_result.records_processed > 0:
                        success_rates.append(latest_result.success_rate)
            
            # Calculate average success rate
            avg_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0.0
            
            # Determine overall status
            if failed_jobs > active_jobs / 2:
                overall_status = "critical"
            elif failed_jobs > 0:
                overall_status = "warning"
            else:
                overall_status = "healthy"
            
            # Get service statuses
            service_statuses = {
                "equipment_database": "operational",
                "inspection_reports": "operational",
                "scheduler": "operational" if self.scheduler_running else "stopped"
            }
            
            # Get recent errors (last 24 hours)
            recent_errors = []
            cutoff_time = current_time - timedelta(hours=24)
            
            for job_results in self.job_results.values():
                for result in job_results:
                    if (result.start_time >= cutoff_time and 
                        result.status == SyncStatus.FAILED and 
                        result.error_message):
                        recent_errors.append(f"{result.job_name}: {result.error_message}")
            
            return SystemHealthStatus(
                timestamp=current_time,
                overall_status=overall_status,
                active_jobs=active_jobs,
                failed_jobs=failed_jobs,
                total_records_processed=total_records,
                average_success_rate=avg_success_rate,
                service_statuses=service_statuses,
                recent_errors=recent_errors[-10:]  # Last 10 errors
            )
            
        except Exception as e:
            self.logger.error(f"Error getting system health: {str(e)}")
            return SystemHealthStatus(
                timestamp=datetime.now(),
                overall_status="error",
                active_jobs=0,
                failed_jobs=0,
                total_records_processed=0,
                average_success_rate=0.0,
                recent_errors=[f"Health check failed: {str(e)}"]
            )
    
    async def start_scheduler(self):
        """Start the job scheduler"""
        if self.scheduler_running:
            return
        
        async def scheduler_loop():
            self.scheduler_running = True
            
            while self.scheduler_running:
                try:
                    current_time = datetime.now()
                    
                    # Check scheduled jobs
                    for job_id, job_config in self.sync_jobs.items():
                        if (job_config.enabled and 
                            job_config.sync_mode == SyncMode.SCHEDULED and
                            job_config.schedule_cron and
                            job_id not in self.active_jobs):
                            
                            # Check if job should run based on cron schedule
                            # For simplicity, we'll check every minute
                            if self._should_run_scheduled_job(job_config, current_time):
                                await self.start_sync_job(job_id)
                    
                    # Wait for next check
                    await asyncio.sleep(60)  # Check every minute
                    
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self.logger.error(f"Error in scheduler loop: {str(e)}")
                    await asyncio.sleep(60)
            
            self.scheduler_running = False
        
        self.scheduler_task = asyncio.create_task(scheduler_loop())
        self.logger.info("Started job scheduler")
    
    async def stop_scheduler(self):
        """Stop the job scheduler"""
        if self.scheduler_task:
            self.scheduler_running = False
            self.scheduler_task.cancel()
            
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
            
            self.scheduler_task = None
            self.logger.info("Stopped job scheduler")
    
    async def start_health_monitoring(self):
        """Start health monitoring"""
        async def health_monitor_loop():
            while True:
                try:
                    health_status = await self.get_system_health()
                    
                    # Log health status
                    if health_status.overall_status == "critical":
                        self.logger.error(f"System health critical: {health_status.failed_jobs} failed jobs")
                    elif health_status.overall_status == "warning":
                        self.logger.warning(f"System health warning: {health_status.failed_jobs} failed jobs")
                    else:
                        self.logger.info(f"System health good: {health_status.active_jobs} active jobs")
                    
                    # Send notifications if needed
                    if health_status.overall_status in ["critical", "warning"]:
                        await self._send_health_notifications(health_status)
                    
                    await asyncio.sleep(self.health_check_interval)
                    
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self.logger.error(f"Error in health monitor: {str(e)}")
                    await asyncio.sleep(self.health_check_interval)
        
        self.health_task = asyncio.create_task(health_monitor_loop())
        self.logger.info("Started health monitoring")
    
    async def stop_health_monitoring(self):
        """Stop health monitoring"""
        if self.health_task:
            self.health_task.cancel()
            
            try:
                await self.health_task
            except asyncio.CancelledError:
                pass
            
            self.health_task = None
            self.logger.info("Stopped health monitoring")
    
    async def shutdown(self):
        """Shutdown the data sync manager"""
        self.logger.info("Shutting down Data Sync Manager")
        
        # Stop scheduler and health monitoring
        await self.stop_scheduler()
        await self.stop_health_monitoring()
        
        # Stop all active jobs
        for job_id in list(self.active_jobs.keys()):
            await self.stop_sync_job(job_id)
        
        # Shutdown integration services
        await self.equipment_service.shutdown()
        await self.inspection_service.shutdown()
        
        self.logger.info("Data Sync Manager shutdown complete")
    
    # Private helper methods
    
    def _validate_job_config(self, job_config: SyncJobConfig) -> bool:
        """Validate job configuration"""
        try:
            # Basic validation
            if not job_config.job_id or not job_config.job_name:
                self.logger.error("Job ID and name are required")
                return False
            
            if job_config.job_id in self.sync_jobs:
                self.logger.error(f"Job ID already exists: {job_config.job_id}")
                return False
            
            # Validate data type specific configuration
            if job_config.data_type == DataType.EQUIPMENT_MASTER:
                if not isinstance(job_config.source_config, DatabaseConnection):
                    self.logger.error("Equipment master jobs require DatabaseConnection")
                    return False
            elif job_config.data_type == DataType.INSPECTION_REPORTS:
                if not isinstance(job_config.source_config, ReportSourceConfig):
                    self.logger.error("Inspection report jobs require ReportSourceConfig")
                    return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error validating job config: {str(e)}")
            return False
    
    async def _configure_equipment_sync(self, job_config: SyncJobConfig) -> bool:
        """Configure equipment synchronization"""
        try:
            db_connection = job_config.source_config
            
            # Add connection to equipment service
            success = await self.equipment_service.add_connection(db_connection)
            
            if success and job_config.sync_mode in [SyncMode.SCHEDULED, SyncMode.BATCH]:
                # Configure sync
                sync_config = SyncConfiguration(
                    sync_id=job_config.job_id,
                    source_connection=db_connection,
                    sync_mode=job_config.sync_mode,
                    sync_interval_minutes=60,  # Default 1 hour
                    enabled=job_config.enabled
                )
                
                self.equipment_service.configure_sync(sync_config)
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error configuring equipment sync: {str(e)}")
            return False
    
    async def _configure_inspection_sync(self, job_config: SyncJobConfig) -> bool:
        """Configure inspection report synchronization"""
        try:
            report_config = job_config.source_config
            report_config.source_id = job_config.job_id
            
            # Add report source to inspection service
            return await self.inspection_service.add_report_source(report_config)
            
        except Exception as e:
            self.logger.error(f"Error configuring inspection sync: {str(e)}")
            return False
    
    async def _execute_sync_job(self, job_config: SyncJobConfig, manual: bool = False) -> SyncJobResult:
        """Execute a synchronization job"""
        result = SyncJobResult(
            job_id=job_config.job_id,
            job_name=job_config.job_name,
            data_type=job_config.data_type,
            start_time=datetime.now(),
            status=SyncStatus.RUNNING
        )
        
        try:
            self.logger.info(f"Executing sync job: {job_config.job_id}")
            
            if job_config.data_type == DataType.EQUIPMENT_MASTER:
                # Execute equipment sync
                sync_result = await self.equipment_service.perform_sync(job_config.job_id)
                
                result.records_processed = sync_result.records_processed
                result.records_successful = sync_result.records_updated + sync_result.records_inserted
                result.records_failed = sync_result.records_failed
                result.status = SyncStatus.COMPLETED if sync_result.success else SyncStatus.FAILED
                result.error_message = sync_result.error_message
                
            elif job_config.data_type == DataType.INSPECTION_REPORTS:
                # Get processing statistics from inspection service
                stats = await self.inspection_service.get_processing_statistics()
                
                if job_config.job_id in stats["by_source"]:
                    source_stats = stats["by_source"][job_config.job_id]
                    result.records_processed = source_stats["total_processed"]
                    result.records_successful = source_stats["successful"]
                    result.records_failed = source_stats["failed"]
                    result.status = SyncStatus.COMPLETED
                else:
                    result.status = SyncStatus.FAILED
                    result.error_message = "No processing statistics available"
            
            result.end_time = datetime.now()
            
            # Store result
            if job_config.job_id not in self.job_results:
                self.job_results[job_config.job_id] = []
            
            self.job_results[job_config.job_id].append(result)
            
            # Keep only last 100 results per job
            if len(self.job_results[job_config.job_id]) > 100:
                self.job_results[job_config.job_id] = self.job_results[job_config.job_id][-100:]
            
            # Remove from active jobs if not manual
            if not manual and job_config.job_id in self.active_jobs:
                del self.active_jobs[job_config.job_id]
            
            self.logger.info(f"Sync job completed: {job_config.job_id} - Status: {result.status.value}")
            
        except Exception as e:
            result.end_time = datetime.now()
            result.status = SyncStatus.FAILED
            result.error_message = str(e)
            
            self.logger.error(f"Sync job failed: {job_config.job_id} - {str(e)}")
        
        return result
    
    def _should_run_scheduled_job(self, job_config: SyncJobConfig, current_time: datetime) -> bool:
        """Check if a scheduled job should run"""
        # Simplified cron check - in production, use a proper cron library
        # For now, just check if it's the top of the hour
        return current_time.minute == 0
    
    async def _send_health_notifications(self, health_status: SystemHealthStatus):
        """Send health notifications"""
        # In a real implementation, send emails, Slack messages, etc.
        self.logger.warning(f"Health notification: {health_status.overall_status} - {health_status.failed_jobs} failed jobs")