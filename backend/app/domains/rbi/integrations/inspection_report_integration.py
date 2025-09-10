"""Inspection Report Integration Service"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import json
try:
    import httpx
except ImportError:
    httpx = None
from abc import ABC, abstractmethod

from app.domains.rbi.models.core import (
    ExtractedRBIData,
    InspectionFinding,
    EquipmentType,
    ServiceType
)


class ReportSource(str, Enum):
    """Supported inspection report sources"""
    FILE_SYSTEM = "file_system"
    DATABASE = "database"
    REST_API = "rest_api"
    EMAIL = "email"
    FTP = "ftp"
    SHAREPOINT = "sharepoint"
    SAP_PM = "sap_pm"
    MAXIMO = "maximo"


class ReportFormat(str, Enum):
    """Supported report formats"""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    XML = "xml"
    JSON = "json"
    TEXT = "text"


@dataclass
class ReportSourceConfig:
    """Configuration for inspection report source"""
    source_id: str
    source_type: ReportSource
    connection_params: Dict[str, Any]
    file_patterns: List[str] = None
    polling_interval_minutes: int = 60
    enabled: bool = True
    last_processed_timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.file_patterns is None:
            self.file_patterns = []


@dataclass
class ReportProcessingResult:
    """Result of report processing"""
    source_id: str
    report_id: str
    equipment_id: str
    processing_timestamp: datetime
    success: bool
    extracted_data: Optional[ExtractedRBIData] = None
    error_message: Optional[str] = None
    processing_time_seconds: float = 0.0


class InspectionReportProcessor(ABC):
    """Abstract base class for inspection report processors"""
    
    def __init__(self, source_config: ReportSourceConfig):
        self.source_config = source_config
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    @abstractmethod
    async def connect(self) -> bool:
        """Connect to report source"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from report source"""
        pass
    
    @abstractmethod
    async def get_new_reports(self) -> List[Dict[str, Any]]:
        """Get new inspection reports"""
        pass
    
    @abstractmethod
    async def process_report(self, report_info: Dict[str, Any]) -> ReportProcessingResult:
        """Process individual inspection report"""
        pass
    
    @abstractmethod
    async def mark_report_processed(self, report_id: str) -> bool:
        """Mark report as processed"""
        pass


class FileSystemReportProcessor(InspectionReportProcessor):
    """File system based report processor"""
    
    def __init__(self, source_config: ReportSourceConfig):
        super().__init__(source_config)
        self.watch_directories = source_config.connection_params.get("directories", [])
        self.processed_files = set()
    
    async def connect(self) -> bool:
        """Connect to file system"""
        try:
            import os
            
            # Verify directories exist
            for directory in self.watch_directories:
                if not os.path.exists(directory):
                    self.logger.error(f"Directory does not exist: {directory}")
                    return False
            
            self.logger.info(f"Connected to file system directories: {self.watch_directories}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to connect to file system: {str(e)}")
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from file system"""
        self.logger.info("Disconnected from file system")
        return True
    
    async def get_new_reports(self) -> List[Dict[str, Any]]:
        """Get new inspection reports from file system"""
        try:
            import os
            import glob
            
            new_reports = []
            
            for directory in self.watch_directories:
                for pattern in self.source_config.file_patterns:
                    file_pattern = os.path.join(directory, pattern)
                    
                    for file_path in glob.glob(file_pattern):
                        if file_path not in self.processed_files:
                            file_stat = os.stat(file_path)
                            
                            # Check if file is newer than last processed timestamp
                            file_mtime = datetime.fromtimestamp(file_stat.st_mtime)
                            
                            if (not self.source_config.last_processed_timestamp or 
                                file_mtime > self.source_config.last_processed_timestamp):
                                
                                new_reports.append({
                                    "report_id": os.path.basename(file_path),
                                    "file_path": file_path,
                                    "modified_time": file_mtime,
                                    "size_bytes": file_stat.st_size
                                })
            
            self.logger.info(f"Found {len(new_reports)} new reports")
            return new_reports
            
        except Exception as e:
            self.logger.error(f"Error getting new reports: {str(e)}")
            return []
    
    async def process_report(self, report_info: Dict[str, Any]) -> ReportProcessingResult:
        """Process inspection report file"""
        start_time = datetime.now()
        
        try:
            file_path = report_info["file_path"]
            report_id = report_info["report_id"]
            
            self.logger.info(f"Processing report: {report_id}")
            
            # Extract equipment ID from filename or content
            equipment_id = self._extract_equipment_id(report_id, file_path)
            
            if not equipment_id:
                raise ValueError("Could not extract equipment ID from report")
            
            # Process file based on format
            file_extension = file_path.lower().split('.')[-1]
            
            if file_extension == 'pdf':
                extracted_data = await self._process_pdf_report(file_path, equipment_id)
            elif file_extension in ['xlsx', 'xls']:
                extracted_data = await self._process_excel_report(file_path, equipment_id)
            elif file_extension == 'csv':
                extracted_data = await self._process_csv_report(file_path, equipment_id)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ReportProcessingResult(
                source_id=self.source_config.source_id,
                report_id=report_id,
                equipment_id=equipment_id,
                processing_timestamp=start_time,
                success=True,
                extracted_data=extracted_data,
                processing_time_seconds=processing_time
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ReportProcessingResult(
                source_id=self.source_config.source_id,
                report_id=report_info.get("report_id", "unknown"),
                equipment_id=report_info.get("equipment_id", "unknown"),
                processing_timestamp=start_time,
                success=False,
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def mark_report_processed(self, report_id: str) -> bool:
        """Mark report as processed"""
        try:
            # Add to processed files set
            for directory in self.watch_directories:
                for pattern in self.source_config.file_patterns:
                    import os
                    file_path = os.path.join(directory, report_id)
                    if os.path.exists(file_path):
                        self.processed_files.add(file_path)
                        break
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error marking report as processed: {str(e)}")
            return False
    
    def _extract_equipment_id(self, filename: str, file_path: str) -> Optional[str]:
        """Extract equipment ID from filename or file content"""
        try:
            # Try to extract from filename pattern
            import re
            
            # Common patterns for equipment IDs
            patterns = [
                r'([A-Z0-9]+-[A-Z]-[0-9]+[A-Z]?)',  # 101-E-401A format
                r'EQ[_-]([A-Z0-9]+)',               # EQ_12345 format
                r'([A-Z]{2,3}[0-9]{3,6})',          # ABC123456 format
            ]
            
            for pattern in patterns:
                match = re.search(pattern, filename.upper())
                if match:
                    return match.group(1)
            
            # If not found in filename, try to extract from file content
            # This would require parsing the actual file content
            # For now, return None if not found in filename
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error extracting equipment ID: {str(e)}")
            return None
    
    async def _process_pdf_report(self, file_path: str, equipment_id: str) -> ExtractedRBIData:
        """Process PDF inspection report"""
        try:
            # In a real implementation, use PyPDF2, pdfplumber, or similar
            # For now, return mock data
            
            self.logger.info(f"Processing PDF report: {file_path}")
            
            # Simulate PDF processing time
            await asyncio.sleep(0.5)
            
            # Mock extracted data
            return ExtractedRBIData(
                equipment_id=equipment_id,
                corrosion_rate=0.2,
                coating_condition="moderate",
                damage_mechanisms=["General Corrosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Low",
                        description="Light surface corrosion observed",
                        location="Bottom section",
                        recommendation="Monitor during next inspection"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=30),
                inspection_quality="good"
            )
            
        except Exception as e:
            self.logger.error(f"Error processing PDF report: {str(e)}")
            raise
    
    async def _process_excel_report(self, file_path: str, equipment_id: str) -> ExtractedRBIData:
        """Process Excel inspection report"""
        try:
            # In a real implementation, use openpyxl or pandas
            self.logger.info(f"Processing Excel report: {file_path}")
            
            # Simulate Excel processing time
            await asyncio.sleep(0.3)
            
            # Mock extracted data
            return ExtractedRBIData(
                equipment_id=equipment_id,
                corrosion_rate=0.15,
                coating_condition="moderate",
                damage_mechanisms=["Pitting", "General Corrosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Pitting",
                        severity="Medium",
                        description="Small pits detected near weld seam",
                        location="Weld area",
                        recommendation="Increase inspection frequency"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=15),
                inspection_quality="good"
            )
            
        except Exception as e:
            self.logger.error(f"Error processing Excel report: {str(e)}")
            raise
    
    async def _process_csv_report(self, file_path: str, equipment_id: str) -> ExtractedRBIData:
        """Process CSV inspection report"""
        try:
            # In a real implementation, use pandas or csv module
            self.logger.info(f"Processing CSV report: {file_path}")
            
            # Simulate CSV processing time
            await asyncio.sleep(0.2)
            
            # Mock extracted data
            return ExtractedRBIData(
                equipment_id=equipment_id,
                corrosion_rate=0.1,
                coating_condition="excellent",
                damage_mechanisms=["General Corrosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Low",
                        description="Minimal surface corrosion",
                        location="External surface",
                        recommendation="Continue normal inspection schedule"
                    )
                ],
                last_inspection_date=datetime.now() - timedelta(days=7),
                inspection_quality="average"
            )
            
        except Exception as e:
            self.logger.error(f"Error processing CSV report: {str(e)}")
            raise


class DatabaseReportProcessor(InspectionReportProcessor):
    """Database based report processor"""
    
    def __init__(self, source_config: ReportSourceConfig):
        super().__init__(source_config)
        self.connection = None
    
    async def connect(self) -> bool:
        """Connect to database"""
        try:
            # In a real implementation, establish database connection
            self.logger.info("Connected to inspection report database")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to connect to database: {str(e)}")
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from database"""
        try:
            if self.connection:
                # Close database connection
                pass
            self.logger.info("Disconnected from inspection report database")
            return True
            
        except Exception as e:
            self.logger.error(f"Error disconnecting from database: {str(e)}")
            return False
    
    async def get_new_reports(self) -> List[Dict[str, Any]]:
        """Get new inspection reports from database"""
        try:
            # Mock database query
            self.logger.info("Querying database for new inspection reports")
            
            # Simulate database query time
            await asyncio.sleep(0.1)
            
            # Mock results
            return [
                {
                    "report_id": "RPT-001",
                    "equipment_id": "101-E-401A",
                    "inspection_date": datetime.now() - timedelta(days=5),
                    "report_status": "completed"
                },
                {
                    "report_id": "RPT-002", 
                    "equipment_id": "101-T-201B",
                    "inspection_date": datetime.now() - timedelta(days=3),
                    "report_status": "completed"
                }
            ]
            
        except Exception as e:
            self.logger.error(f"Error querying database for reports: {str(e)}")
            return []
    
    async def process_report(self, report_info: Dict[str, Any]) -> ReportProcessingResult:
        """Process inspection report from database"""
        start_time = datetime.now()
        
        try:
            report_id = report_info["report_id"]
            equipment_id = report_info["equipment_id"]
            
            self.logger.info(f"Processing database report: {report_id}")
            
            # Mock database query to get report details
            await asyncio.sleep(0.2)
            
            # Mock extracted data
            extracted_data = ExtractedRBIData(
                equipment_id=equipment_id,
                inspection_date=report_info["inspection_date"],
                inspector_name="Database Inspector",
                inspection_type="Scheduled",
                thickness_measurements=[8.4, 8.2, 8.6, 8.3],
                corrosion_rate=0.25,
                damage_mechanisms=["General Corrosion", "Erosion"],
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Moderate",
                        location="Internal surface",
                        description="Moderate corrosion detected",
                        recommendation="Monitor closely"
                    )
                ],
                overall_condition="Fair",
                next_inspection_recommendation=datetime.now() + timedelta(days=270),
                confidence_level=0.9
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ReportProcessingResult(
                source_id=self.source_config.source_id,
                report_id=report_id,
                equipment_id=equipment_id,
                processing_timestamp=start_time,
                success=True,
                extracted_data=extracted_data,
                processing_time_seconds=processing_time
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ReportProcessingResult(
                source_id=self.source_config.source_id,
                report_id=report_info.get("report_id", "unknown"),
                equipment_id=report_info.get("equipment_id", "unknown"),
                processing_timestamp=start_time,
                success=False,
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def mark_report_processed(self, report_id: str) -> bool:
        """Mark report as processed in database"""
        try:
            # Mock database update
            self.logger.info(f"Marking report {report_id} as processed in database")
            await asyncio.sleep(0.1)
            return True
            
        except Exception as e:
            self.logger.error(f"Error marking report as processed: {str(e)}")
            return False


class InspectionReportIntegrationService:
    """Main service for inspection report integration"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.processors: Dict[str, InspectionReportProcessor] = {}
        self.processing_tasks: Dict[str, asyncio.Task] = {}
        self.processed_reports: Dict[str, List[ReportProcessingResult]] = {}
    
    def register_processor(self, source_id: str, processor: InspectionReportProcessor):
        """Register a report processor"""
        self.processors[source_id] = processor
        self.processed_reports[source_id] = []
        self.logger.info(f"Registered report processor: {source_id}")
    
    def create_processor(self, source_config: ReportSourceConfig) -> InspectionReportProcessor:
        """Create appropriate processor based on source type"""
        
        if source_config.source_type == ReportSource.FILE_SYSTEM:
            return FileSystemReportProcessor(source_config)
        elif source_config.source_type == ReportSource.DATABASE:
            return DatabaseReportProcessor(source_config)
        else:
            raise ValueError(f"Unsupported report source type: {source_config.source_type}")
    
    async def add_report_source(self, source_config: ReportSourceConfig) -> bool:
        """Add and configure a new report source"""
        try:
            processor = self.create_processor(source_config)
            
            # Test connection
            if await processor.connect():
                self.register_processor(source_config.source_id, processor)
                
                # Start processing task if enabled
                if source_config.enabled:
                    self._start_processing_task(source_config)
                
                self.logger.info(f"Successfully added report source: {source_config.source_id}")
                return True
            else:
                self.logger.error(f"Failed to connect to report source: {source_config.source_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error adding report source {source_config.source_id}: {str(e)}")
            return False
    
    def _start_processing_task(self, source_config: ReportSourceConfig):
        """Start report processing task"""
        
        async def processing_task():
            processor = self.processors[source_config.source_id]
            
            while True:
                try:
                    # Get new reports
                    new_reports = await processor.get_new_reports()
                    
                    # Process each report
                    for report_info in new_reports:
                        try:
                            result = await processor.process_report(report_info)
                            self.processed_reports[source_config.source_id].append(result)
                            
                            if result.success:
                                await processor.mark_report_processed(result.report_id)
                                self.logger.info(f"Successfully processed report: {result.report_id}")
                            else:
                                self.logger.error(f"Failed to process report: {result.report_id} - {result.error_message}")
                                
                        except Exception as e:
                            self.logger.error(f"Error processing report {report_info.get('report_id', 'unknown')}: {str(e)}")
                    
                    # Update last processed timestamp
                    source_config.last_processed_timestamp = datetime.now()
                    
                    # Wait for next polling interval
                    await asyncio.sleep(source_config.polling_interval_minutes * 60)
                    
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self.logger.error(f"Error in processing task {source_config.source_id}: {str(e)}")
                    await asyncio.sleep(60)  # Wait before retrying
        
        task = asyncio.create_task(processing_task())
        self.processing_tasks[source_config.source_id] = task
        self.logger.info(f"Started processing task: {source_config.source_id}")
    
    async def process_single_report(self, source_id: str, report_info: Dict[str, Any]) -> ReportProcessingResult:
        """Process a single report on demand"""
        
        if source_id not in self.processors:
            raise ValueError(f"Report processor not found: {source_id}")
        
        processor = self.processors[source_id]
        result = await processor.process_report(report_info)
        
        self.processed_reports[source_id].append(result)
        
        if result.success:
            await processor.mark_report_processed(result.report_id)
        
        return result
    
    async def get_processing_results(self, source_id: str = None, limit: int = 100) -> List[ReportProcessingResult]:
        """Get processing results"""
        
        if source_id:
            if source_id in self.processed_reports:
                return self.processed_reports[source_id][-limit:]
            else:
                return []
        else:
            # Get results from all sources
            all_results = []
            for results in self.processed_reports.values():
                all_results.extend(results)
            
            # Sort by processing timestamp and return latest
            all_results.sort(key=lambda x: x.processing_timestamp, reverse=True)
            return all_results[:limit]
    
    async def get_processing_statistics(self) -> Dict[str, Any]:
        """Get processing statistics"""
        
        total_processed = 0
        total_successful = 0
        total_failed = 0
        
        source_stats = {}
        
        for source_id, results in self.processed_reports.items():
            source_processed = len(results)
            source_successful = len([r for r in results if r.success])
            source_failed = source_processed - source_successful
            
            source_stats[source_id] = {
                "total_processed": source_processed,
                "successful": source_successful,
                "failed": source_failed,
                "success_rate": source_successful / source_processed if source_processed > 0 else 0.0
            }
            
            total_processed += source_processed
            total_successful += source_successful
            total_failed += source_failed
        
        return {
            "overall": {
                "total_processed": total_processed,
                "successful": total_successful,
                "failed": total_failed,
                "success_rate": total_successful / total_processed if total_processed > 0 else 0.0
            },
            "by_source": source_stats,
            "active_sources": len(self.processors),
            "active_tasks": len(self.processing_tasks)
        }
    
    async def stop_processing(self, source_id: str) -> bool:
        """Stop processing for a specific source"""
        try:
            if source_id in self.processing_tasks:
                self.processing_tasks[source_id].cancel()
                del self.processing_tasks[source_id]
                self.logger.info(f"Stopped processing for source: {source_id}")
                return True
            else:
                self.logger.warning(f"No active processing task for source: {source_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error stopping processing for source {source_id}: {str(e)}")
            return False
    
    async def remove_report_source(self, source_id: str) -> bool:
        """Remove a report source"""
        try:
            # Stop processing task
            await self.stop_processing(source_id)
            
            # Disconnect processor
            if source_id in self.processors:
                processor = self.processors[source_id]
                await processor.disconnect()
                del self.processors[source_id]
            
            # Clean up processed reports
            if source_id in self.processed_reports:
                del self.processed_reports[source_id]
            
            self.logger.info(f"Removed report source: {source_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error removing report source {source_id}: {str(e)}")
            return False
    
    async def shutdown(self):
        """Shutdown all processors and tasks"""
        self.logger.info("Shutting down inspection report integration service")
        
        # Cancel all processing tasks
        for task in self.processing_tasks.values():
            task.cancel()
        
        # Wait for tasks to complete
        if self.processing_tasks:
            await asyncio.gather(*self.processing_tasks.values(), return_exceptions=True)
        
        # Disconnect all processors
        for processor in self.processors.values():
            try:
                await processor.disconnect()
            except Exception as e:
                self.logger.error(f"Error disconnecting processor: {str(e)}")
        
        self.processors.clear()
        self.processing_tasks.clear()
        self.processed_reports.clear()
        
        self.logger.info("Inspection report integration service shutdown complete")