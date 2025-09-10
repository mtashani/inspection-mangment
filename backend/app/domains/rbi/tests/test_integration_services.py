"""Tests for Integration Services"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock

from app.domains.rbi.integrations.equipment_database_integration import (
    EquipmentDatabaseIntegrationService,
    DatabaseConnection,
    DatabaseType,
    SyncConfiguration,
    SyncMode,
    SQLServerConnector,
    RESTAPIConnector
)
from app.domains.rbi.integrations.inspection_report_integration import (
    InspectionReportIntegrationService,
    ReportSourceConfig,
    ReportSource,
    FileSystemReportProcessor,
    DatabaseReportProcessor
)
from app.domains.rbi.integrations.data_sync_manager import (
    DataSyncManager,
    SyncJobConfig,
    DataType,
    SyncStatus
)
from app.domains.rbi.models.core import (
    EquipmentData,
    EquipmentType,
    ServiceType,
    ExtractedRBIData
)


class TestEquipmentDatabaseIntegration:
    """Test equipment database integration service"""
    
    @pytest.fixture
    def sample_db_connection(self):
        """Sample database connection"""
        return DatabaseConnection(
            connection_id="test_db",
            database_type=DatabaseType.SQL_SERVER,
            host="localhost",
            port=1433,
            database_name="equipment_db",
            username="test_user",
            password="test_pass"
        )
    
    @pytest.fixture
    def integration_service(self):
        """Equipment database integration service"""
        return EquipmentDatabaseIntegrationService()
    
    def test_create_sql_server_connector(self, integration_service, sample_db_connection):
        """Test creating SQL Server connector"""
        connector = integration_service.create_connector(sample_db_connection)
        
        assert isinstance(connector, SQLServerConnector)
        assert connector.connection.connection_id == "test_db"
        assert connector.connection.database_type == DatabaseType.SQL_SERVER
    
    def test_create_rest_api_connector(self, integration_service):
        """Test creating REST API connector"""
        api_connection = DatabaseConnection(
            connection_id="test_api",
            database_type=DatabaseType.REST_API,
            host="api.example.com",
            port=443,
            database_name="equipment_api",
            username="api_user",
            password="api_key"
        )
        
        try:
            connector = integration_service.create_connector(api_connection)
            
            assert isinstance(connector, RESTAPIConnector)
            assert connector.connection.connection_id == "test_api"
            assert connector.base_url == "https://api.example.com:443"
        except ImportError as e:
            # httpx not installed - skip test
            pytest.skip(f"Skipping REST API connector test: {str(e)}")
    
    def test_create_unsupported_connector(self, integration_service):
        """Test creating unsupported connector type"""
        unsupported_connection = DatabaseConnection(
            connection_id="test_unsupported",
            database_type=DatabaseType.ORACLE,  # Not implemented
            host="localhost",
            port=1521,
            database_name="test_db",
            username="test_user",
            password="test_pass"
        )
        
        with pytest.raises(ValueError, match="Unsupported database type"):
            integration_service.create_connector(unsupported_connection)
    
    @pytest.mark.asyncio
    async def test_add_connection_success(self, integration_service, sample_db_connection):
        """Test successfully adding a database connection"""
        with patch.object(integration_service, 'create_connector') as mock_create:
            mock_connector = AsyncMock()
            mock_connector.connect.return_value = True
            mock_connector.test_connection.return_value = True
            mock_create.return_value = mock_connector
            
            result = await integration_service.add_connection(sample_db_connection)
            
            assert result is True
            assert "test_db" in integration_service.connectors
            mock_connector.connect.assert_called_once()
            mock_connector.test_connection.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_add_connection_connect_failure(self, integration_service, sample_db_connection):
        """Test adding connection with connect failure"""
        with patch.object(integration_service, 'create_connector') as mock_create:
            mock_connector = AsyncMock()
            mock_connector.connect.return_value = False
            mock_create.return_value = mock_connector
            
            result = await integration_service.add_connection(sample_db_connection)
            
            assert result is False
            assert "test_db" not in integration_service.connectors
    
    @pytest.mark.asyncio
    async def test_add_connection_test_failure(self, integration_service, sample_db_connection):
        """Test adding connection with test failure"""
        with patch.object(integration_service, 'create_connector') as mock_create:
            mock_connector = AsyncMock()
            mock_connector.connect.return_value = True
            mock_connector.test_connection.return_value = False
            mock_connector.disconnect.return_value = True
            mock_create.return_value = mock_connector
            
            result = await integration_service.add_connection(sample_db_connection)
            
            assert result is False
            assert "test_db" not in integration_service.connectors
            mock_connector.disconnect.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_remove_connection(self, integration_service, sample_db_connection):
        """Test removing a database connection"""
        # First add a connection
        mock_connector = AsyncMock()
        mock_connector.disconnect.return_value = True
        integration_service.connectors["test_db"] = mock_connector
        
        result = await integration_service.remove_connection("test_db")
        
        assert result is True
        assert "test_db" not in integration_service.connectors
        mock_connector.disconnect.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_remove_nonexistent_connection(self, integration_service):
        """Test removing a non-existent connection"""
        result = await integration_service.remove_connection("nonexistent")
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_get_equipment_data_specific_connection(self, integration_service):
        """Test getting equipment data from specific connection"""
        mock_connector = AsyncMock()
        mock_equipment = EquipmentData(
            equipment_id="TEST-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        mock_connector.get_equipment_data.return_value = mock_equipment
        integration_service.connectors["test_db"] = mock_connector
        
        result = await integration_service.get_equipment_data("TEST-001", "test_db")
        
        assert result is not None
        assert result.equipment_id == "TEST-001"
        mock_connector.get_equipment_data.assert_called_once_with("TEST-001")
    
    @pytest.mark.asyncio
    async def test_get_equipment_data_all_connections(self, integration_service):
        """Test getting equipment data from all connections"""
        # Setup multiple connectors
        mock_connector1 = AsyncMock()
        mock_connector1.get_equipment_data.return_value = None
        
        mock_connector2 = AsyncMock()
        mock_equipment = EquipmentData(
            equipment_id="TEST-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        mock_connector2.get_equipment_data.return_value = mock_equipment
        
        integration_service.connectors["db1"] = mock_connector1
        integration_service.connectors["db2"] = mock_connector2
        
        result = await integration_service.get_equipment_data("TEST-001")
        
        assert result is not None
        assert result.equipment_id == "TEST-001"
        mock_connector1.get_equipment_data.assert_called_once_with("TEST-001")
        mock_connector2.get_equipment_data.assert_called_once_with("TEST-001")


class TestSQLServerConnector:
    """Test SQL Server connector"""
    
    @pytest.fixture
    def sql_connector(self):
        """SQL Server connector"""
        connection = DatabaseConnection(
            connection_id="test_sql",
            database_type=DatabaseType.SQL_SERVER,
            host="localhost",
            port=1433,
            database_name="test_db",
            username="test_user",
            password="test_pass"
        )
        return SQLServerConnector(connection)
    
    @pytest.mark.asyncio
    async def test_connect_success(self, sql_connector):
        """Test successful connection"""
        result = await sql_connector.connect()
        assert result is True
    
    @pytest.mark.asyncio
    async def test_disconnect_success(self, sql_connector):
        """Test successful disconnection"""
        result = await sql_connector.disconnect()
        assert result is True
    
    @pytest.mark.asyncio
    async def test_test_connection_success(self, sql_connector):
        """Test successful connection test"""
        result = await sql_connector.test_connection()
        assert result is True
    
    @pytest.mark.asyncio
    async def test_get_equipment_data_found(self, sql_connector):
        """Test getting equipment data - found"""
        result = await sql_connector.get_equipment_data("TEST-001")
        
        assert result is not None
        assert result.equipment_id == "TEST-001"
        assert result.equipment_type == EquipmentType.PRESSURE_VESSEL
    
    @pytest.mark.asyncio
    async def test_get_equipment_data_not_found(self, sql_connector):
        """Test getting equipment data - not found"""
        result = await sql_connector.get_equipment_data("NONEXISTENT")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_equipment_list(self, sql_connector):
        """Test getting equipment list"""
        result = await sql_connector.get_equipment_list(limit=10)
        
        assert isinstance(result, list)
        assert len(result) <= 10
        
        if result:
            assert all(isinstance(eq, EquipmentData) for eq in result)
    
    @pytest.mark.asyncio
    async def test_get_equipment_list_with_filters(self, sql_connector):
        """Test getting equipment list with filters"""
        filters = {
            "equipment_type": "pressure_vessel",
            "criticality_level": "High"
        }
        
        result = await sql_connector.get_equipment_list(filters=filters, limit=5)
        
        assert isinstance(result, list)
        assert len(result) <= 5
    
    @pytest.mark.asyncio
    async def test_get_updated_equipment(self, sql_connector):
        """Test getting updated equipment"""
        since_timestamp = datetime.now() - timedelta(hours=2)
        
        result = await sql_connector.get_updated_equipment(since_timestamp)
        
        assert isinstance(result, list)
        # Should return updated equipment if within last hour
        if datetime.now() - since_timestamp < timedelta(hours=1):
            assert len(result) > 0
    
    @pytest.mark.asyncio
    async def test_update_equipment_data(self, sql_connector):
        """Test updating equipment data"""
        equipment_data = EquipmentData(
            equipment_id="TEST-UPDATE",
            equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER,
            installation_date=datetime.now() - timedelta(days=10*365),
            design_pressure=10.0,
            design_temperature=80.0,
            material="Stainless Steel",
            criticality_level="Medium"
        )
        
        result = await sql_connector.update_equipment_data(equipment_data)
        
        assert result is True


class TestInspectionReportIntegration:
    """Test inspection report integration service"""
    
    @pytest.fixture
    def report_service(self):
        """Inspection report integration service"""
        return InspectionReportIntegrationService()
    
    @pytest.fixture
    def file_system_config(self):
        """File system report source configuration"""
        return ReportSourceConfig(
            source_id="test_fs",
            source_type=ReportSource.FILE_SYSTEM,
            connection_params={
                "directories": ["/test/reports"]
            },
            file_patterns=["*.pdf", "*.xlsx"],
            polling_interval_minutes=30
        )
    
    @pytest.fixture
    def database_config(self):
        """Database report source configuration"""
        return ReportSourceConfig(
            source_id="test_db_reports",
            source_type=ReportSource.DATABASE,
            connection_params={
                "host": "localhost",
                "port": 1433,
                "database": "reports_db"
            },
            polling_interval_minutes=60
        )
    
    def test_create_file_system_processor(self, report_service, file_system_config):
        """Test creating file system processor"""
        processor = report_service.create_processor(file_system_config)
        
        assert isinstance(processor, FileSystemReportProcessor)
        assert processor.source_config.source_id == "test_fs"
    
    def test_create_database_processor(self, report_service, database_config):
        """Test creating database processor"""
        processor = report_service.create_processor(database_config)
        
        assert isinstance(processor, DatabaseReportProcessor)
        assert processor.source_config.source_id == "test_db_reports"
    
    def test_create_unsupported_processor(self, report_service):
        """Test creating unsupported processor type"""
        unsupported_config = ReportSourceConfig(
            source_id="test_unsupported",
            source_type=ReportSource.EMAIL,  # Not implemented
            connection_params={}
        )
        
        with pytest.raises(ValueError, match="Unsupported report source type"):
            report_service.create_processor(unsupported_config)
    
    @pytest.mark.asyncio
    async def test_add_report_source_success(self, report_service, file_system_config):
        """Test successfully adding a report source"""
        with patch.object(report_service, 'create_processor') as mock_create:
            mock_processor = AsyncMock()
            mock_processor.connect.return_value = True
            mock_create.return_value = mock_processor
            
            result = await report_service.add_report_source(file_system_config)
            
            assert result is True
            assert "test_fs" in report_service.processors
            mock_processor.connect.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_add_report_source_connect_failure(self, report_service, file_system_config):
        """Test adding report source with connect failure"""
        with patch.object(report_service, 'create_processor') as mock_create:
            mock_processor = AsyncMock()
            mock_processor.connect.return_value = False
            mock_create.return_value = mock_processor
            
            result = await report_service.add_report_source(file_system_config)
            
            assert result is False
            assert "test_fs" not in report_service.processors
    
    @pytest.mark.asyncio
    async def test_get_processing_statistics(self, report_service):
        """Test getting processing statistics"""
        # Add some mock processed reports
        from app.domains.rbi.integrations.inspection_report_integration import ReportProcessingResult
        
        results = [
            ReportProcessingResult(
                source_id="test_source",
                report_id="RPT-001",
                equipment_id="EQ-001",
                processing_timestamp=datetime.now(),
                success=True
            ),
            ReportProcessingResult(
                source_id="test_source",
                report_id="RPT-002",
                equipment_id="EQ-002",
                processing_timestamp=datetime.now(),
                success=False,
                error_message="Processing failed"
            )
        ]
        
        report_service.processed_reports["test_source"] = results
        
        stats = await report_service.get_processing_statistics()
        
        assert stats["overall"]["total_processed"] == 2
        assert stats["overall"]["successful"] == 1
        assert stats["overall"]["failed"] == 1
        assert stats["overall"]["success_rate"] == 0.5
        assert "test_source" in stats["by_source"]
        assert stats["by_source"]["test_source"]["success_rate"] == 0.5


class TestFileSystemReportProcessor:
    """Test file system report processor"""
    
    @pytest.fixture
    def fs_processor(self):
        """File system report processor"""
        config = ReportSourceConfig(
            source_id="test_fs",
            source_type=ReportSource.FILE_SYSTEM,
            connection_params={
                "directories": ["/test/reports"]
            },
            file_patterns=["*.pdf", "*.xlsx"]
        )
        return FileSystemReportProcessor(config)
    
    @pytest.mark.asyncio
    async def test_connect_success(self, fs_processor):
        """Test successful connection to file system"""
        with patch('os.path.exists', return_value=True):
            result = await fs_processor.connect()
            assert result is True
    
    @pytest.mark.asyncio
    async def test_connect_directory_not_exists(self, fs_processor):
        """Test connection failure when directory doesn't exist"""
        with patch('os.path.exists', return_value=False):
            result = await fs_processor.connect()
            assert result is False
    
    @pytest.mark.asyncio
    async def test_disconnect(self, fs_processor):
        """Test disconnection from file system"""
        result = await fs_processor.disconnect()
        assert result is True
    
    def test_extract_equipment_id_from_filename(self, fs_processor):
        """Test extracting equipment ID from filename"""
        # Test various filename patterns
        test_cases = [
            ("101-E-401A_inspection.pdf", "101-E-401A"),
            ("EQ_12345_report.xlsx", "12345"),
            ("ABC123456_data.csv", "ABC123456"),
            ("no_equipment_id.pdf", None)
        ]
        
        for filename, expected in test_cases:
            result = fs_processor._extract_equipment_id(filename, f"/test/{filename}")
            assert result == expected
    
    @pytest.mark.asyncio
    async def test_process_pdf_report(self, fs_processor):
        """Test processing PDF report"""
        result = await fs_processor._process_pdf_report("/test/report.pdf", "TEST-001")
        
        assert isinstance(result, ExtractedRBIData)
        assert result.equipment_id == "TEST-001"
        assert result.corrosion_rate == 0.2
        assert result.coating_condition == "moderate"
        assert len(result.inspection_findings) > 0
        assert result.inspection_quality == "good"
    
    @pytest.mark.asyncio
    async def test_process_excel_report(self, fs_processor):
        """Test processing Excel report"""
        result = await fs_processor._process_excel_report("/test/report.xlsx", "TEST-001")
        
        assert isinstance(result, ExtractedRBIData)
        assert result.equipment_id == "TEST-001"
        assert result.corrosion_rate == 0.15
        assert result.coating_condition == "moderate"
        assert len(result.inspection_findings) > 0
        assert result.inspection_quality == "good"
    
    @pytest.mark.asyncio
    async def test_process_csv_report(self, fs_processor):
        """Test processing CSV report"""
        result = await fs_processor._process_csv_report("/test/report.csv", "TEST-001")
        
        assert isinstance(result, ExtractedRBIData)
        assert result.equipment_id == "TEST-001"
        assert result.corrosion_rate == 0.1
        assert result.coating_condition == "excellent"
        assert len(result.inspection_findings) > 0
        assert result.inspection_quality == "average"


class TestDataSyncManager:
    """Test data synchronization manager"""
    
    @pytest.fixture
    def sync_manager(self):
        """Data sync manager"""
        return DataSyncManager()
    
    @pytest.fixture
    def equipment_sync_job(self):
        """Equipment synchronization job configuration"""
        db_connection = DatabaseConnection(
            connection_id="test_equipment_db",
            database_type=DatabaseType.SQL_SERVER,
            host="localhost",
            port=1433,
            database_name="equipment_db",
            username="test_user",
            password="test_pass"
        )
        
        return SyncJobConfig(
            job_id="equipment_sync_001",
            job_name="Equipment Master Sync",
            data_type=DataType.EQUIPMENT_MASTER,
            source_config=db_connection,
            sync_mode=SyncMode.SCHEDULED,
            schedule_cron="0 */6 * * *"  # Every 6 hours
        )
    
    @pytest.fixture
    def inspection_sync_job(self):
        """Inspection report synchronization job configuration"""
        report_config = ReportSourceConfig(
            source_id="test_inspection_reports",
            source_type=ReportSource.FILE_SYSTEM,
            connection_params={
                "directories": ["/reports/inspections"]
            },
            file_patterns=["*.pdf", "*.xlsx"],
            polling_interval_minutes=30
        )
        
        return SyncJobConfig(
            job_id="inspection_sync_001",
            job_name="Inspection Reports Sync",
            data_type=DataType.INSPECTION_REPORTS,
            source_config=report_config,
            sync_mode=SyncMode.REAL_TIME
        )
    
    @pytest.mark.asyncio
    async def test_initialize(self, sync_manager):
        """Test initializing sync manager"""
        with patch.object(sync_manager, 'start_scheduler') as mock_scheduler, \
             patch.object(sync_manager, 'start_health_monitoring') as mock_health:
            
            await sync_manager.initialize()
            
            mock_scheduler.assert_called_once()
            mock_health.assert_called_once()
    
    def test_validate_job_config_valid(self, sync_manager, equipment_sync_job):
        """Test validating valid job configuration"""
        result = sync_manager._validate_job_config(equipment_sync_job)
        assert result is True
    
    def test_validate_job_config_missing_id(self, sync_manager, equipment_sync_job):
        """Test validating job config with missing ID"""
        equipment_sync_job.job_id = ""
        result = sync_manager._validate_job_config(equipment_sync_job)
        assert result is False
    
    def test_validate_job_config_duplicate_id(self, sync_manager, equipment_sync_job):
        """Test validating job config with duplicate ID"""
        sync_manager.sync_jobs[equipment_sync_job.job_id] = equipment_sync_job
        result = sync_manager._validate_job_config(equipment_sync_job)
        assert result is False
    
    def test_validate_job_config_wrong_source_type(self, sync_manager, equipment_sync_job):
        """Test validating job config with wrong source type"""
        # Set wrong source config type for equipment job
        equipment_sync_job.source_config = ReportSourceConfig(
            source_id="wrong_type",
            source_type=ReportSource.FILE_SYSTEM,
            connection_params={}
        )
        
        result = sync_manager._validate_job_config(equipment_sync_job)
        assert result is False
    
    @pytest.mark.asyncio
    async def test_add_sync_job_success(self, sync_manager, equipment_sync_job):
        """Test successfully adding sync job"""
        with patch.object(sync_manager, '_configure_equipment_sync', return_value=True):
            result = await sync_manager.add_sync_job(equipment_sync_job)
            
            assert result is True
            assert equipment_sync_job.job_id in sync_manager.sync_jobs
            assert equipment_sync_job.job_id in sync_manager.job_results
    
    @pytest.mark.asyncio
    async def test_add_sync_job_validation_failure(self, sync_manager, equipment_sync_job):
        """Test adding sync job with validation failure"""
        equipment_sync_job.job_id = ""  # Invalid ID
        
        result = await sync_manager.add_sync_job(equipment_sync_job)
        
        assert result is False
        assert equipment_sync_job.job_id not in sync_manager.sync_jobs
    
    @pytest.mark.asyncio
    async def test_add_sync_job_configuration_failure(self, sync_manager, equipment_sync_job):
        """Test adding sync job with configuration failure"""
        with patch.object(sync_manager, '_configure_equipment_sync', return_value=False):
            result = await sync_manager.add_sync_job(equipment_sync_job)
            
            assert result is False
            assert equipment_sync_job.job_id not in sync_manager.sync_jobs
    
    @pytest.mark.asyncio
    async def test_get_sync_job_status_existing(self, sync_manager, equipment_sync_job):
        """Test getting status of existing sync job"""
        sync_manager.sync_jobs[equipment_sync_job.job_id] = equipment_sync_job
        sync_manager.job_results[equipment_sync_job.job_id] = []
        
        status = await sync_manager.get_sync_job_status(equipment_sync_job.job_id)
        
        assert status is not None
        assert status["job_id"] == equipment_sync_job.job_id
        assert status["job_name"] == equipment_sync_job.job_name
        assert status["data_type"] == equipment_sync_job.data_type.value
        assert status["enabled"] == equipment_sync_job.enabled
        assert status["is_running"] is False
    
    @pytest.mark.asyncio
    async def test_get_sync_job_status_nonexistent(self, sync_manager):
        """Test getting status of non-existent sync job"""
        status = await sync_manager.get_sync_job_status("nonexistent")
        assert status is None
    
    @pytest.mark.asyncio
    async def test_get_system_health(self, sync_manager):
        """Test getting system health status"""
        health = await sync_manager.get_system_health()
        
        assert health.timestamp is not None
        assert health.overall_status in ["healthy", "warning", "critical", "error"]
        assert health.active_jobs >= 0
        assert health.failed_jobs >= 0
        assert health.total_records_processed >= 0
        assert 0.0 <= health.average_success_rate <= 1.0
        assert isinstance(health.service_statuses, dict)
        assert isinstance(health.recent_errors, list)
    
    @pytest.mark.asyncio
    async def test_shutdown(self, sync_manager):
        """Test shutting down sync manager"""
        with patch.object(sync_manager, 'stop_scheduler') as mock_stop_scheduler, \
             patch.object(sync_manager, 'stop_health_monitoring') as mock_stop_health, \
             patch.object(sync_manager.equipment_service, 'shutdown') as mock_eq_shutdown, \
             patch.object(sync_manager.inspection_service, 'shutdown') as mock_insp_shutdown:
            
            await sync_manager.shutdown()
            
            mock_stop_scheduler.assert_called_once()
            mock_stop_health.assert_called_once()
            mock_eq_shutdown.assert_called_once()
            mock_insp_shutdown.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__])