"""Example usage of Integration Services"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any

from app.domains.rbi.integrations.equipment_database_integration import (
    EquipmentDatabaseIntegrationService,
    DatabaseConnection,
    DatabaseType,
    SyncConfiguration,
    SyncMode
)
from app.domains.rbi.integrations.inspection_report_integration import (
    InspectionReportIntegrationService,
    ReportSourceConfig,
    ReportSource
)
from app.domains.rbi.integrations.data_sync_manager import (
    DataSyncManager,
    SyncJobConfig,
    DataType
)


async def demonstrate_equipment_database_integration():
    """Demonstrate equipment database integration"""
    
    print("🔗 Equipment Database Integration Demo")
    print("=" * 60)
    
    # Initialize service
    service = EquipmentDatabaseIntegrationService()
    
    try:
        # Configure SQL Server connection
        sql_connection = DatabaseConnection(
            connection_id="main_equipment_db",
            database_type=DatabaseType.SQL_SERVER,
            host="sql-server.company.com",
            port=1433,
            database_name="EquipmentMaster",
            username="rbi_user",
            password="secure_password",
            ssl_enabled=True
        )
        
        print(f"📊 Adding SQL Server connection...")
        print(f"Host: {sql_connection.host}:{sql_connection.port}")
        print(f"Database: {sql_connection.database_name}")
        
        # Add connection
        success = await service.add_connection(sql_connection)
        
        if success:
            print(f"✅ SQL Server connection added successfully")
            
            # Test getting equipment data
            print(f"\n🔍 Testing equipment data retrieval...")
            
            equipment = await service.get_equipment_data("101-E-401A")
            if equipment:
                print(f"✅ Found equipment: {equipment.equipment_id}")
                print(f"   Type: {equipment.equipment_type.value}")
                print(f"   Service: {equipment.service_type.value}")
                print(f"   Age: {equipment.age_years:.1f} years")
                print(f"   Pressure: {equipment.design_pressure} bar")
                print(f"   Temperature: {equipment.design_temperature}°C")
            else:
                print(f"❌ Equipment not found")
            
            # Test getting equipment list
            print(f"\n📋 Getting equipment list...")
            
            filters = {
                "equipment_type": "pressure_vessel",
                "criticality_level": "High"
            }
            
            equipment_list = await service.get_equipment_list(filters=filters, limit=10)
            print(f"✅ Found {len(equipment_list)} equipment items")
            
            for eq in equipment_list[:3]:  # Show first 3
                print(f"   • {eq.equipment_id}: {eq.equipment_type.value} - {eq.criticality_level}")
            
            # Configure synchronization
            print(f"\n🔄 Configuring data synchronization...")
            
            sync_config = SyncConfiguration(
                sync_id="equipment_hourly_sync",
                source_connection=sql_connection,
                sync_mode=SyncMode.SCHEDULED,
                sync_interval_minutes=60,
                batch_size=500,
                enabled=True
            )
            
            service.configure_sync(sync_config)
            print(f"✅ Sync configuration added: {sync_config.sync_id}")
            
            # Perform manual sync
            print(f"\n⚡ Performing manual synchronization...")
            
            sync_result = await service.perform_sync("equipment_hourly_sync")
            
            print(f"✅ Sync completed:")
            print(f"   Records processed: {sync_result.records_processed}")
            print(f"   Records updated: {sync_result.records_updated}")
            print(f"   Records inserted: {sync_result.records_inserted}")
            print(f"   Records failed: {sync_result.records_failed}")
            print(f"   Processing time: {sync_result.processing_time_seconds:.2f}s")
            print(f"   Success: {sync_result.success}")
            
        else:
            print(f"❌ Failed to add SQL Server connection")
        
        # Add REST API connection
        print(f"\n🌐 Adding REST API connection...")
        
        api_connection = DatabaseConnection(
            connection_id="equipment_api",
            database_type=DatabaseType.REST_API,
            host="api.equipment-system.com",
            port=443,
            database_name="equipment_api",
            username="api_key",
            password="your_api_key_here",
            ssl_enabled=True
        )
        
        api_success = await service.add_connection(api_connection)
        
        if api_success:
            print(f"✅ REST API connection added successfully")
            
            # Test API data retrieval
            api_equipment = await service.get_equipment_data("API-TEST-001", "equipment_api")
            if api_equipment:
                print(f"✅ API equipment found: {api_equipment.equipment_id}")
            else:
                print(f"ℹ️ API equipment not found (expected for demo)")
        else:
            print(f"❌ Failed to add REST API connection")
        
        # Test all connections
        print(f"\n🔍 Testing all connections...")
        
        connection_results = await service.test_all_connections()
        
        for conn_id, is_connected in connection_results.items():
            status = "✅ Connected" if is_connected else "❌ Disconnected"
            print(f"   {conn_id}: {status}")
        
        # Get connection status
        print(f"\n📊 Connection status summary...")
        
        status_summary = await service.get_connection_status()
        
        for conn_id, status in status_summary.items():
            print(f"   {conn_id}:")
            print(f"     Connected: {status['connected']}")
            print(f"     Type: {status.get('database_type', 'unknown')}")
            print(f"     Host: {status.get('host', 'unknown')}")
            print(f"     Last tested: {status.get('last_tested', 'unknown')}")
    
    except Exception as e:
        print(f"❌ Error in equipment database integration demo: {str(e)}")
    
    finally:
        # Cleanup
        await service.shutdown()
        print(f"\n🛑 Equipment database integration service shutdown")


async def demonstrate_inspection_report_integration():
    """Demonstrate inspection report integration"""
    
    print("\n📄 Inspection Report Integration Demo")
    print("=" * 60)
    
    # Initialize service
    service = InspectionReportIntegrationService()
    
    try:
        # Configure file system report source
        file_system_config = ReportSourceConfig(
            source_id="inspection_reports_fs",
            source_type=ReportSource.FILE_SYSTEM,
            connection_params={
                "directories": [
                    "/reports/inspections",
                    "/reports/ndt",
                    "/reports/thickness"
                ]
            },
            file_patterns=[
                "*.pdf",
                "*.xlsx",
                "*.csv"
            ],
            polling_interval_minutes=15,
            enabled=True
        )
        
        print(f"📁 Adding file system report source...")
        print(f"Directories: {file_system_config.connection_params['directories']}")
        print(f"File patterns: {file_system_config.file_patterns}")
        print(f"Polling interval: {file_system_config.polling_interval_minutes} minutes")
        
        # Add file system source
        fs_success = await service.add_report_source(file_system_config)
        
        if fs_success:
            print(f"✅ File system report source added successfully")
        else:
            print(f"❌ Failed to add file system report source")
        
        # Configure database report source
        database_config = ReportSourceConfig(
            source_id="inspection_reports_db",
            source_type=ReportSource.DATABASE,
            connection_params={
                "host": "reports-db.company.com",
                "port": 1433,
                "database": "InspectionReports",
                "username": "reports_user",
                "password": "reports_password"
            },
            polling_interval_minutes=30,
            enabled=True
        )
        
        print(f"\n🗄️ Adding database report source...")
        print(f"Host: {database_config.connection_params['host']}")
        print(f"Database: {database_config.connection_params['database']}")
        
        # Add database source
        db_success = await service.add_report_source(database_config)
        
        if db_success:
            print(f"✅ Database report source added successfully")
        else:
            print(f"❌ Failed to add database report source")
        
        # Wait for some processing
        print(f"\n⏳ Waiting for report processing...")
        await asyncio.sleep(2)
        
        # Get processing statistics
        print(f"\n📊 Getting processing statistics...")
        
        stats = await service.get_processing_statistics()
        
        print(f"✅ Processing statistics:")
        print(f"   Overall:")
        print(f"     Total processed: {stats['overall']['total_processed']}")
        print(f"     Successful: {stats['overall']['successful']}")
        print(f"     Failed: {stats['overall']['failed']}")
        print(f"     Success rate: {stats['overall']['success_rate']:.1%}")
        
        print(f"   Active sources: {stats['active_sources']}")
        print(f"   Active tasks: {stats['active_tasks']}")
        
        if stats['by_source']:
            print(f"   By source:")
            for source_id, source_stats in stats['by_source'].items():
                print(f"     {source_id}:")
                print(f"       Processed: {source_stats['total_processed']}")
                print(f"       Success rate: {source_stats['success_rate']:.1%}")
        
        # Get recent processing results
        print(f"\n📋 Recent processing results...")
        
        recent_results = await service.get_processing_results(limit=5)
        
        if recent_results:
            print(f"✅ Found {len(recent_results)} recent results:")
            
            for result in recent_results:
                status = "✅ Success" if result.success else "❌ Failed"
                print(f"   • {result.report_id} ({result.equipment_id}): {status}")
                print(f"     Processed: {result.processing_timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"     Time: {result.processing_time_seconds:.2f}s")
                
                if not result.success and result.error_message:
                    print(f"     Error: {result.error_message}")
        else:
            print(f"ℹ️ No processing results yet (expected for demo)")
        
        # Demonstrate manual report processing
        print(f"\n⚡ Demonstrating manual report processing...")
        
        # Mock report info
        mock_report_info = {
            "report_id": "MANUAL_TEST_001.pdf",
            "equipment_id": "101-E-401A",
            "file_path": "/test/reports/MANUAL_TEST_001.pdf",
            "modified_time": datetime.now(),
            "size_bytes": 1024000
        }
        
        if "inspection_reports_fs" in service.processors:
            manual_result = await service.process_single_report(
                "inspection_reports_fs", 
                mock_report_info
            )
            
            print(f"✅ Manual processing result:")
            print(f"   Report ID: {manual_result.report_id}")
            print(f"   Equipment ID: {manual_result.equipment_id}")
            print(f"   Success: {manual_result.success}")
            print(f"   Processing time: {manual_result.processing_time_seconds:.2f}s")
            
            if manual_result.success and manual_result.extracted_data:
                data = manual_result.extracted_data
                print(f"   Extracted data:")
                print(f"     Inspector: {data.inspector_name}")
                print(f"     Inspection date: {data.inspection_date.strftime('%Y-%m-%d')}")
                print(f"     Thickness measurements: {len(data.thickness_measurements)} points")
                print(f"     Corrosion rate: {data.corrosion_rate} mm/year")
                print(f"     Overall condition: {data.overall_condition}")
                print(f"     Confidence: {data.confidence_level:.1%}")
    
    except Exception as e:
        print(f"❌ Error in inspection report integration demo: {str(e)}")
    
    finally:
        # Cleanup
        await service.shutdown()
        print(f"\n🛑 Inspection report integration service shutdown")


async def demonstrate_data_sync_manager():
    """Demonstrate data synchronization manager"""
    
    print("\n🔄 Data Sync Manager Demo")
    print("=" * 60)
    
    # Initialize sync manager
    sync_manager = DataSyncManager()
    
    try:
        # Initialize the manager
        print(f"🚀 Initializing Data Sync Manager...")
        await sync_manager.initialize()
        print(f"✅ Data Sync Manager initialized")
        
        # Create equipment sync job
        print(f"\n⚙️ Creating equipment synchronization job...")
        
        from app.domains.rbi.integrations.equipment_database_integration import DatabaseConnection, DatabaseType
        
        equipment_db_connection = DatabaseConnection(
            connection_id="equipment_master_db",
            database_type=DatabaseType.SQL_SERVER,
            host="equipment-db.company.com",
            port=1433,
            database_name="EquipmentMaster",
            username="sync_user",
            password="sync_password"
        )
        
        equipment_sync_job = SyncJobConfig(
            job_id="equipment_master_sync",
            job_name="Equipment Master Data Sync",
            data_type=DataType.EQUIPMENT_MASTER,
            source_config=equipment_db_connection,
            sync_mode=SyncMode.SCHEDULED,
            schedule_cron="0 */6 * * *",  # Every 6 hours
            enabled=True,
            retry_count=3,
            timeout_minutes=30,
            notification_emails=["admin@company.com"]
        )
        
        # Add equipment sync job
        eq_success = await sync_manager.add_sync_job(equipment_sync_job)
        
        if eq_success:
            print(f"✅ Equipment sync job added: {equipment_sync_job.job_name}")
            print(f"   Job ID: {equipment_sync_job.job_id}")
            print(f"   Sync mode: {equipment_sync_job.sync_mode.value}")
            print(f"   Schedule: {equipment_sync_job.schedule_cron}")
        else:
            print(f"❌ Failed to add equipment sync job")
        
        # Create inspection reports sync job
        print(f"\n📄 Creating inspection reports synchronization job...")
        
        from app.domains.rbi.integrations.inspection_report_integration import ReportSourceConfig, ReportSource
        
        inspection_report_config = ReportSourceConfig(
            source_id="inspection_reports_sync",
            source_type=ReportSource.FILE_SYSTEM,
            connection_params={
                "directories": ["/reports/inspections"]
            },
            file_patterns=["*.pdf", "*.xlsx"],
            polling_interval_minutes=15
        )
        
        inspection_sync_job = SyncJobConfig(
            job_id="inspection_reports_sync",
            job_name="Inspection Reports Sync",
            data_type=DataType.INSPECTION_REPORTS,
            source_config=inspection_report_config,
            sync_mode=SyncMode.REAL_TIME,
            enabled=True,
            retry_count=2,
            timeout_minutes=15
        )
        
        # Add inspection sync job
        insp_success = await sync_manager.add_sync_job(inspection_sync_job)
        
        if insp_success:
            print(f"✅ Inspection reports sync job added: {inspection_sync_job.job_name}")
            print(f"   Job ID: {inspection_sync_job.job_id}")
            print(f"   Sync mode: {inspection_sync_job.sync_mode.value}")
            print(f"   Polling interval: {inspection_report_config.polling_interval_minutes} minutes")
        else:
            print(f"❌ Failed to add inspection reports sync job")
        
        # Get all sync jobs status
        print(f"\n📊 Getting all sync jobs status...")
        
        all_statuses = await sync_manager.get_all_sync_jobs_status()
        
        print(f"✅ Found {len(all_statuses)} sync jobs:")
        
        for status in all_statuses:
            print(f"   • {status['job_name']} ({status['job_id']}):")
            print(f"     Data type: {status['data_type']}")
            print(f"     Sync mode: {status['sync_mode']}")
            print(f"     Enabled: {status['enabled']}")
            print(f"     Running: {status['is_running']}")
            print(f"     Last run: {status['last_run'] or 'Never'}")
            print(f"     Last status: {status['last_status']}")
            print(f"     Total runs: {status['total_runs']}")
            print(f"     Success rate: {status['success_rate']:.1%}")
        
        # Trigger manual sync
        if eq_success:
            print(f"\n⚡ Triggering manual equipment sync...")
            
            manual_success = await sync_manager.trigger_manual_sync("equipment_master_sync")
            
            if manual_success:
                print(f"✅ Manual sync triggered successfully")
                
                # Wait a bit for processing
                await asyncio.sleep(1)
                
                # Get job results
                results = await sync_manager.get_sync_job_results("equipment_master_sync", limit=1)
                
                if results:
                    result = results[0]
                    print(f"✅ Sync result:")
                    print(f"   Status: {result.status.value}")
                    print(f"   Duration: {result.duration_seconds:.2f}s")
                    print(f"   Records processed: {result.records_processed}")
                    print(f"   Records successful: {result.records_successful}")
                    print(f"   Records failed: {result.records_failed}")
                    print(f"   Success rate: {result.success_rate:.1%}")
                    
                    if result.error_message:
                        print(f"   Error: {result.error_message}")
            else:
                print(f"❌ Failed to trigger manual sync")
        
        # Get system health
        print(f"\n🏥 Getting system health status...")
        
        health = await sync_manager.get_system_health()
        
        print(f"✅ System health:")
        print(f"   Overall status: {health.overall_status}")
        print(f"   Active jobs: {health.active_jobs}")
        print(f"   Failed jobs: {health.failed_jobs}")
        print(f"   Total records processed: {health.total_records_processed}")
        print(f"   Average success rate: {health.average_success_rate:.1%}")
        print(f"   Timestamp: {health.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
        
        if health.service_statuses:
            print(f"   Service statuses:")
            for service, status in health.service_statuses.items():
                print(f"     {service}: {status}")
        
        if health.recent_errors:
            print(f"   Recent errors:")
            for error in health.recent_errors[:3]:  # Show first 3
                print(f"     • {error}")
        
        # Demonstrate job control
        if eq_success:
            print(f"\n🎛️ Demonstrating job control...")
            
            # Pause job
            print(f"⏸️ Pausing equipment sync job...")
            pause_success = await sync_manager.pause_sync_job("equipment_master_sync")
            
            if pause_success:
                print(f"✅ Job paused successfully")
                
                # Check status
                status = await sync_manager.get_sync_job_status("equipment_master_sync")
                print(f"   Enabled: {status['enabled']}")
                print(f"   Running: {status['is_running']}")
                
                # Resume job
                print(f"▶️ Resuming equipment sync job...")
                resume_success = await sync_manager.resume_sync_job("equipment_master_sync")
                
                if resume_success:
                    print(f"✅ Job resumed successfully")
                    
                    # Check status again
                    status = await sync_manager.get_sync_job_status("equipment_master_sync")
                    print(f"   Enabled: {status['enabled']}")
                    print(f"   Running: {status['is_running']}")
                else:
                    print(f"❌ Failed to resume job")
            else:
                print(f"❌ Failed to pause job")
    
    except Exception as e:
        print(f"❌ Error in data sync manager demo: {str(e)}")
    
    finally:
        # Cleanup
        await sync_manager.shutdown()
        print(f"\n🛑 Data Sync Manager shutdown")


async def main():
    """Run all integration service demonstrations"""
    
    print("🚀 Integration Services Examples")
    print("=" * 80)
    print("Note: These examples use mock data and connections for demonstration")
    print("=" * 80)
    
    try:
        await demonstrate_equipment_database_integration()
        await demonstrate_inspection_report_integration()
        await demonstrate_data_sync_manager()
        
        print(f"\n🎉 All integration service demonstrations completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Demo failed with error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())