"""Equipment Database Integration Service"""

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
    EquipmentData,
    EquipmentType,
    ServiceType
)


class DatabaseType(str, Enum):
    """Supported database types"""
    SQL_SERVER = "sql_server"
    ORACLE = "oracle"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    REST_API = "rest_api"
    SAP = "sap"
    MAXIMO = "maximo"


class SyncMode(str, Enum):
    """Data synchronization modes"""
    REAL_TIME = "real_time"
    BATCH = "batch"
    SCHEDULED = "scheduled"
    ON_DEMAND = "on_demand"


@dataclass
class DatabaseConnection:
    """Database connection configuration"""
    connection_id: str
    database_type: DatabaseType
    host: str
    port: int
    database_name: str
    username: str
    password: str
    connection_string: Optional[str] = None
    ssl_enabled: bool = True
    timeout_seconds: int = 30
    pool_size: int = 10
    additional_params: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.additional_params is None:
            self.additional_params = {}


@dataclass
class SyncConfiguration:
    """Data synchronization configuration"""
    sync_id: str
    source_connection: DatabaseConnection
    sync_mode: SyncMode
    sync_interval_minutes: int = 60
    batch_size: int = 1000
    enabled: bool = True
    last_sync_timestamp: Optional[datetime] = None
    sync_filters: Dict[str, Any] = None
    field_mappings: Dict[str, str] = None
    
    def __post_init__(self):
        if self.sync_filters is None:
            self.sync_filters = {}
        if self.field_mappings is None:
            self.field_mappings = {}


@dataclass
class SyncResult:
    """Result of data synchronization"""
    sync_id: str
    sync_timestamp: datetime
    records_processed: int
    records_updated: int
    records_inserted: int
    records_failed: int
    success: bool
    error_message: Optional[str] = None
    processing_time_seconds: float = 0.0
    details: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.details is None:
            self.details = {}


class EquipmentDatabaseConnector(ABC):
    """Abstract base class for equipment database connectors"""
    
    def __init__(self, connection: DatabaseConnection):
        self.connection = connection
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to database"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Close database connection"""
        pass
    
    @abstractmethod
    async def test_connection(self) -> bool:
        """Test database connection"""
        pass
    
    @abstractmethod
    async def get_equipment_data(self, equipment_id: str) -> Optional[EquipmentData]:
        """Get equipment data by ID"""
        pass
    
    @abstractmethod
    async def get_equipment_list(self, filters: Dict[str, Any] = None, limit: int = 1000) -> List[EquipmentData]:
        """Get list of equipment with optional filters"""
        pass
    
    @abstractmethod
    async def get_updated_equipment(self, since_timestamp: datetime) -> List[EquipmentData]:
        """Get equipment updated since timestamp"""
        pass
    
    @abstractmethod
    async def update_equipment_data(self, equipment_data: EquipmentData) -> bool:
        """Update equipment data in database"""
        pass


class SQLServerConnector(EquipmentDatabaseConnector):
    """SQL Server database connector"""
    
    def __init__(self, connection: DatabaseConnection):
        super().__init__(connection)
        self.connection_pool = None
    
    async def connect(self) -> bool:
        """Establish connection to SQL Server"""
        try:
            # In a real implementation, use aioodbc or similar
            self.logger.info(f"Connecting to SQL Server: {self.connection.host}:{self.connection.port}")
            
            # Mock connection for demonstration
            await asyncio.sleep(0.1)  # Simulate connection time
            
            self.logger.info("SQL Server connection established")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to connect to SQL Server: {str(e)}")
            return False
    
    async def disconnect(self) -> bool:
        """Close SQL Server connection"""
        try:
            if self.connection_pool:
                # Close connection pool
                self.logger.info("Closing SQL Server connection")
                await asyncio.sleep(0.1)  # Simulate disconnect time
            return True
        except Exception as e:
            self.logger.error(f"Error disconnecting from SQL Server: {str(e)}")
            return False
    
    async def test_connection(self) -> bool:
        """Test SQL Server connection"""
        try:
            # Execute simple query to test connection
            self.logger.info("Testing SQL Server connection")
            await asyncio.sleep(0.1)  # Simulate query time
            return True
        except Exception as e:
            self.logger.error(f"SQL Server connection test failed: {str(e)}")
            return False
    
    async def get_equipment_data(self, equipment_id: str) -> Optional[EquipmentData]:
        """Get equipment data from SQL Server"""
        try:
            self.logger.info(f"Fetching equipment data for {equipment_id} from SQL Server")
            
            # Mock SQL query
            query = """
            SELECT equipment_id, equipment_type, service_type, installation_date,
                   design_pressure, design_temperature, material, criticality_level,
                   coating_type, location, inventory_size
            FROM equipment_master 
            WHERE equipment_id = ?
            """
            
            # Simulate database query
            await asyncio.sleep(0.1)
            
            # Mock result - in real implementation, execute query and map results
            if equipment_id.startswith("TEST"):
                return EquipmentData(
                    equipment_id=equipment_id,
                    equipment_type=EquipmentType.PRESSURE_VESSEL,
                    service_type=ServiceType.SOUR_GAS,
                    installation_date=datetime.now() - timedelta(days=15*365),
                    design_pressure=25.0,
                    design_temperature=150.0,
                    material="Carbon Steel",
                    criticality_level="High"
                )
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error fetching equipment data: {str(e)}")
            return None
    
    async def get_equipment_list(self, filters: Dict[str, Any] = None, limit: int = 1000) -> List[EquipmentData]:
        """Get equipment list from SQL Server"""
        try:
            self.logger.info(f"Fetching equipment list from SQL Server (limit: {limit})")
            
            # Build query with filters
            query = "SELECT * FROM equipment_master WHERE 1=1"
            params = []
            
            if filters:
                if "equipment_type" in filters:
                    query += " AND equipment_type = ?"
                    params.append(filters["equipment_type"])
                
                if "service_type" in filters:
                    query += " AND service_type = ?"
                    params.append(filters["service_type"])
                
                if "criticality_level" in filters:
                    query += " AND criticality_level = ?"
                    params.append(filters["criticality_level"])
            
            query += f" ORDER BY equipment_id LIMIT {limit}"
            
            # Simulate database query
            await asyncio.sleep(0.2)
            
            # Mock results
            equipment_list = []
            for i in range(min(5, limit)):  # Return up to 5 mock items
                equipment_list.append(EquipmentData(
                    equipment_id=f"EQ-{i:03d}",
                    equipment_type=EquipmentType.PRESSURE_VESSEL,
                    service_type=ServiceType.SOUR_GAS,
                    installation_date=datetime.now() - timedelta(days=(10+i)*365),
                    design_pressure=20.0 + i * 5,
                    design_temperature=100.0 + i * 25,
                    material="Carbon Steel",
                    criticality_level="High" if i < 2 else "Medium"
                ))
            
            return equipment_list
            
        except Exception as e:
            self.logger.error(f"Error fetching equipment list: {str(e)}")
            return []
    
    async def get_updated_equipment(self, since_timestamp: datetime) -> List[EquipmentData]:
        """Get equipment updated since timestamp"""
        try:
            self.logger.info(f"Fetching equipment updated since {since_timestamp}")
            
            query = """
            SELECT * FROM equipment_master 
            WHERE last_modified >= ? 
            ORDER BY last_modified DESC
            """
            
            # Simulate database query
            await asyncio.sleep(0.1)
            
            # Mock results - return equipment modified in last hour
            if datetime.now() - since_timestamp < timedelta(hours=1):
                return [EquipmentData(
                    equipment_id="EQ-UPDATED-001",
                    equipment_type=EquipmentType.TANK,
                    service_type=ServiceType.WATER,
                    installation_date=datetime.now() - timedelta(days=8*365),
                    design_pressure=10.0,
                    design_temperature=80.0,
                    material="Stainless Steel",
                    criticality_level="Medium"
                )]
            
            return []
            
        except Exception as e:
            self.logger.error(f"Error fetching updated equipment: {str(e)}")
            return []
    
    async def update_equipment_data(self, equipment_data: EquipmentData) -> bool:
        """Update equipment data in SQL Server"""
        try:
            self.logger.info(f"Updating equipment data for {equipment_data.equipment_id}")
            
            query = """
            UPDATE equipment_master 
            SET equipment_type = ?, service_type = ?, design_pressure = ?,
                design_temperature = ?, material = ?, criticality_level = ?,
                last_modified = GETDATE()
            WHERE equipment_id = ?
            """
            
            # Simulate database update
            await asyncio.sleep(0.1)
            
            self.logger.info(f"Equipment data updated for {equipment_data.equipment_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error updating equipment data: {str(e)}")
            return False


class RESTAPIConnector(EquipmentDatabaseConnector):
    """REST API connector for equipment data"""
    
    def __init__(self, connection: DatabaseConnection):
        super().__init__(connection)
        if httpx is None:
            raise ImportError("httpx is required for REST API connector. Install with: pip install httpx")
        self.client = None
        self.base_url = f"http://{connection.host}:{connection.port}"
        if connection.ssl_enabled:
            self.base_url = f"https://{connection.host}:{connection.port}"
    
    async def connect(self) -> bool:
        """Establish HTTP client connection"""
        try:
            self.client = httpx.AsyncClient(
                timeout=self.connection.timeout_seconds,
                verify=self.connection.ssl_enabled
            )
            
            self.logger.info(f"REST API client initialized for {self.base_url}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize REST API client: {str(e)}")
            return False
    
    async def disconnect(self) -> bool:
        """Close HTTP client"""
        try:
            if self.client:
                await self.client.aclose()
                self.logger.info("REST API client closed")
            return True
        except Exception as e:
            self.logger.error(f"Error closing REST API client: {str(e)}")
            return False
    
    async def test_connection(self) -> bool:
        """Test REST API connection"""
        try:
            if not self.client:
                await self.connect()
            
            response = await self.client.get(f"{self.base_url}/health")
            return response.status_code == 200
            
        except Exception as e:
            self.logger.error(f"REST API connection test failed: {str(e)}")
            return False
    
    async def get_equipment_data(self, equipment_id: str) -> Optional[EquipmentData]:
        """Get equipment data via REST API"""
        try:
            if not self.client:
                await self.connect()
            
            response = await self.client.get(f"{self.base_url}/api/equipment/{equipment_id}")
            
            if response.status_code == 200:
                data = response.json()
                return self._map_api_response_to_equipment_data(data)
            elif response.status_code == 404:
                return None
            else:
                self.logger.error(f"API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            self.logger.error(f"Error fetching equipment data via API: {str(e)}")
            return None
    
    async def get_equipment_list(self, filters: Dict[str, Any] = None, limit: int = 1000) -> List[EquipmentData]:
        """Get equipment list via REST API"""
        try:
            if not self.client:
                await self.connect()
            
            params = {"limit": limit}
            if filters:
                params.update(filters)
            
            response = await self.client.get(f"{self.base_url}/api/equipment", params=params)
            
            if response.status_code == 200:
                data = response.json()
                equipment_list = []
                
                for item in data.get("equipment", []):
                    equipment = self._map_api_response_to_equipment_data(item)
                    if equipment:
                        equipment_list.append(equipment)
                
                return equipment_list
            else:
                self.logger.error(f"API error: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            self.logger.error(f"Error fetching equipment list via API: {str(e)}")
            return []
    
    async def get_updated_equipment(self, since_timestamp: datetime) -> List[EquipmentData]:
        """Get updated equipment via REST API"""
        try:
            if not self.client:
                await self.connect()
            
            params = {"updated_since": since_timestamp.isoformat()}
            response = await self.client.get(f"{self.base_url}/api/equipment/updated", params=params)
            
            if response.status_code == 200:
                data = response.json()
                equipment_list = []
                
                for item in data.get("equipment", []):
                    equipment = self._map_api_response_to_equipment_data(item)
                    if equipment:
                        equipment_list.append(equipment)
                
                return equipment_list
            else:
                self.logger.error(f"API error: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            self.logger.error(f"Error fetching updated equipment via API: {str(e)}")
            return []
    
    async def update_equipment_data(self, equipment_data: EquipmentData) -> bool:
        """Update equipment data via REST API"""
        try:
            if not self.client:
                await self.connect()
            
            data = self._map_equipment_data_to_api_request(equipment_data)
            
            response = await self.client.put(
                f"{self.base_url}/api/equipment/{equipment_data.equipment_id}",
                json=data
            )
            
            return response.status_code in [200, 204]
            
        except Exception as e:
            self.logger.error(f"Error updating equipment data via API: {str(e)}")
            return False
    
    def _map_api_response_to_equipment_data(self, data: Dict[str, Any]) -> Optional[EquipmentData]:
        """Map API response to EquipmentData"""
        try:
            return EquipmentData(
                equipment_id=data["equipment_id"],
                equipment_type=EquipmentType(data["equipment_type"]),
                service_type=ServiceType(data["service_type"]),
                installation_date=datetime.fromisoformat(data["installation_date"]),
                design_pressure=float(data["design_pressure"]),
                design_temperature=float(data["design_temperature"]),
                material=data["material"],
                criticality_level=data.get("criticality_level", "Medium"),
                coating_type=data.get("coating_type"),
                location=data.get("location", "open_area"),
                inventory_size=float(data.get("inventory_size", 0.0))
            )
        except Exception as e:
            self.logger.error(f"Error mapping API response to EquipmentData: {str(e)}")
            return None
    
    def _map_equipment_data_to_api_request(self, equipment_data: EquipmentData) -> Dict[str, Any]:
        """Map EquipmentData to API request"""
        return {
            "equipment_id": equipment_data.equipment_id,
            "equipment_type": equipment_data.equipment_type.value,
            "service_type": equipment_data.service_type.value,
            "installation_date": equipment_data.installation_date.isoformat(),
            "design_pressure": equipment_data.design_pressure,
            "design_temperature": equipment_data.design_temperature,
            "material": equipment_data.material,
            "criticality_level": equipment_data.criticality_level,
            "coating_type": equipment_data.coating_type,
            "location": equipment_data.location,
            "inventory_size": equipment_data.inventory_size
        }


class EquipmentDatabaseIntegrationService:
    """Main service for equipment database integration"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.connectors: Dict[str, EquipmentDatabaseConnector] = {}
        self.sync_configurations: Dict[str, SyncConfiguration] = {}
        self.sync_tasks: Dict[str, asyncio.Task] = {}
    
    def register_connector(self, connection_id: str, connector: EquipmentDatabaseConnector):
        """Register a database connector"""
        self.connectors[connection_id] = connector
        self.logger.info(f"Registered connector: {connection_id}")
    
    def create_connector(self, connection: DatabaseConnection) -> EquipmentDatabaseConnector:
        """Create appropriate connector based on database type"""
        
        if connection.database_type == DatabaseType.SQL_SERVER:
            return SQLServerConnector(connection)
        elif connection.database_type == DatabaseType.REST_API:
            return RESTAPIConnector(connection)
        else:
            raise ValueError(f"Unsupported database type: {connection.database_type}")
    
    async def add_connection(self, connection: DatabaseConnection) -> bool:
        """Add and test a new database connection"""
        try:
            connector = self.create_connector(connection)
            
            # Test connection
            if await connector.connect():
                if await connector.test_connection():
                    self.register_connector(connection.connection_id, connector)
                    self.logger.info(f"Successfully added connection: {connection.connection_id}")
                    return True
                else:
                    await connector.disconnect()
                    self.logger.error(f"Connection test failed for: {connection.connection_id}")
                    return False
            else:
                self.logger.error(f"Failed to connect to: {connection.connection_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error adding connection {connection.connection_id}: {str(e)}")
            return False
    
    async def remove_connection(self, connection_id: str) -> bool:
        """Remove a database connection"""
        try:
            if connection_id in self.connectors:
                connector = self.connectors[connection_id]
                await connector.disconnect()
                del self.connectors[connection_id]
                
                # Stop any sync tasks
                if connection_id in self.sync_tasks:
                    self.sync_tasks[connection_id].cancel()
                    del self.sync_tasks[connection_id]
                
                self.logger.info(f"Removed connection: {connection_id}")
                return True
            else:
                self.logger.warning(f"Connection not found: {connection_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error removing connection {connection_id}: {str(e)}")
            return False
    
    async def get_equipment_data(self, equipment_id: str, connection_id: str = None) -> Optional[EquipmentData]:
        """Get equipment data from specified or all connections"""
        
        if connection_id:
            # Get from specific connection
            if connection_id in self.connectors:
                return await self.connectors[connection_id].get_equipment_data(equipment_id)
            else:
                self.logger.error(f"Connection not found: {connection_id}")
                return None
        else:
            # Try all connections until found
            for conn_id, connector in self.connectors.items():
                try:
                    equipment_data = await connector.get_equipment_data(equipment_id)
                    if equipment_data:
                        self.logger.info(f"Equipment {equipment_id} found in connection {conn_id}")
                        return equipment_data
                except Exception as e:
                    self.logger.warning(f"Error querying connection {conn_id}: {str(e)}")
                    continue
            
            self.logger.info(f"Equipment {equipment_id} not found in any connection")
            return None
    
    async def get_equipment_list(self, filters: Dict[str, Any] = None, limit: int = 1000, connection_id: str = None) -> List[EquipmentData]:
        """Get equipment list from specified or all connections"""
        
        equipment_list = []
        
        if connection_id:
            # Get from specific connection
            if connection_id in self.connectors:
                return await self.connectors[connection_id].get_equipment_list(filters, limit)
            else:
                self.logger.error(f"Connection not found: {connection_id}")
                return []
        else:
            # Get from all connections
            for conn_id, connector in self.connectors.items():
                try:
                    conn_equipment = await connector.get_equipment_list(filters, limit)
                    equipment_list.extend(conn_equipment)
                    
                    if len(equipment_list) >= limit:
                        equipment_list = equipment_list[:limit]
                        break
                        
                except Exception as e:
                    self.logger.warning(f"Error querying connection {conn_id}: {str(e)}")
                    continue
            
            return equipment_list
    
    def configure_sync(self, sync_config: SyncConfiguration):
        """Configure data synchronization"""
        self.sync_configurations[sync_config.sync_id] = sync_config
        self.logger.info(f"Configured sync: {sync_config.sync_id}")
        
        # Start sync task if enabled
        if sync_config.enabled and sync_config.sync_mode == SyncMode.SCHEDULED:
            self._start_sync_task(sync_config)
    
    def _start_sync_task(self, sync_config: SyncConfiguration):
        """Start scheduled synchronization task"""
        
        async def sync_task():
            while True:
                try:
                    await asyncio.sleep(sync_config.sync_interval_minutes * 60)
                    await self.perform_sync(sync_config.sync_id)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self.logger.error(f"Error in sync task {sync_config.sync_id}: {str(e)}")
        
        task = asyncio.create_task(sync_task())
        self.sync_tasks[sync_config.sync_id] = task
        self.logger.info(f"Started sync task: {sync_config.sync_id}")
    
    async def perform_sync(self, sync_id: str) -> SyncResult:
        """Perform data synchronization"""
        
        if sync_id not in self.sync_configurations:
            raise ValueError(f"Sync configuration not found: {sync_id}")
        
        sync_config = self.sync_configurations[sync_id]
        start_time = datetime.now()
        
        try:
            self.logger.info(f"Starting sync: {sync_id}")
            
            # Get connector for source
            source_conn_id = sync_config.source_connection.connection_id
            if source_conn_id not in self.connectors:
                raise ValueError(f"Source connection not found: {source_conn_id}")
            
            connector = self.connectors[source_conn_id]
            
            # Determine what data to sync
            if sync_config.last_sync_timestamp:
                # Incremental sync
                equipment_list = await connector.get_updated_equipment(sync_config.last_sync_timestamp)
            else:
                # Full sync
                equipment_list = await connector.get_equipment_list(
                    filters=sync_config.sync_filters,
                    limit=sync_config.batch_size
                )
            
            # Process equipment data
            records_processed = 0
            records_updated = 0
            records_inserted = 0
            records_failed = 0
            
            for equipment in equipment_list:
                try:
                    # Here you would update your local database
                    # For now, just count as processed
                    records_processed += 1
                    records_updated += 1  # Assume update for demo
                    
                except Exception as e:
                    self.logger.error(f"Error processing equipment {equipment.equipment_id}: {str(e)}")
                    records_failed += 1
            
            # Update sync timestamp
            sync_config.last_sync_timestamp = start_time
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = SyncResult(
                sync_id=sync_id,
                sync_timestamp=start_time,
                records_processed=records_processed,
                records_updated=records_updated,
                records_inserted=records_inserted,
                records_failed=records_failed,
                success=True,
                processing_time_seconds=processing_time
            )
            
            self.logger.info(f"Sync completed: {sync_id} - {records_processed} records processed")
            return result
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = SyncResult(
                sync_id=sync_id,
                sync_timestamp=start_time,
                records_processed=0,
                records_updated=0,
                records_inserted=0,
                records_failed=0,
                success=False,
                error_message=str(e),
                processing_time_seconds=processing_time
            )
            
            self.logger.error(f"Sync failed: {sync_id} - {str(e)}")
            return result
    
    async def test_all_connections(self) -> Dict[str, bool]:
        """Test all registered connections"""
        results = {}
        
        for conn_id, connector in self.connectors.items():
            try:
                results[conn_id] = await connector.test_connection()
            except Exception as e:
                self.logger.error(f"Error testing connection {conn_id}: {str(e)}")
                results[conn_id] = False
        
        return results
    
    async def get_connection_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all connections"""
        status = {}
        
        for conn_id, connector in self.connectors.items():
            try:
                is_connected = await connector.test_connection()
                status[conn_id] = {
                    "connected": is_connected,
                    "database_type": connector.connection.database_type.value,
                    "host": connector.connection.host,
                    "last_tested": datetime.now().isoformat()
                }
            except Exception as e:
                status[conn_id] = {
                    "connected": False,
                    "error": str(e),
                    "last_tested": datetime.now().isoformat()
                }
        
        return status
    
    async def shutdown(self):
        """Shutdown all connections and tasks"""
        self.logger.info("Shutting down equipment database integration service")
        
        # Cancel all sync tasks
        for task in self.sync_tasks.values():
            task.cancel()
        
        # Wait for tasks to complete
        if self.sync_tasks:
            await asyncio.gather(*self.sync_tasks.values(), return_exceptions=True)
        
        # Disconnect all connectors
        for connector in self.connectors.values():
            try:
                await connector.disconnect()
            except Exception as e:
                self.logger.error(f"Error disconnecting connector: {str(e)}")
        
        self.connectors.clear()
        self.sync_tasks.clear()
        
        self.logger.info("Equipment database integration service shutdown complete")