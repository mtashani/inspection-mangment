"""Unit tests for PermissionService"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.services.permission_service import PermissionService
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole


class TestPermissionService:
    """Test cases for PermissionService"""

    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def mock_inspector(self):
        """Mock inspector"""
        inspector = MagicMock(spec=Inspector)
        inspector.id = 1
        inspector.active = True
        inspector.can_login = True
        return inspector

    @pytest.fixture
    def mock_role(self):
        """Mock role"""
        role = MagicMock(spec=Role)
        role.id = 1
        role.name = "NDT Inspector"
        role.description = "NDT inspection role"
        return role

    @pytest.fixture
    def mock_permission(self):
        """Mock permission"""
        permission = MagicMock(spec=Permission)
        permission.id = 1
        permission.name = "ndt_create"
        permission.resource = "ndt"
        permission.action = "create"
        return permission

    @pytest.mark.asyncio
    async def test_has_permission_specific_permission(self, mock_db, mock_inspector):
        """Test has_permission with specific permission"""
        with patch.object(PermissionService, 'get_inspector_permissions') as mock_get_perms:
            mock_get_perms.return_value = {"ndt:create", "psv:view"}
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "ndt", "create")
            assert result is True
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "ndt", "delete")
            assert result is False

    @pytest.mark.asyncio
    async def test_has_permission_wildcard_resource(self, mock_db, mock_inspector):
        """Test has_permission with wildcard resource permission"""
        with patch.object(PermissionService, 'get_inspector_permissions') as mock_get_perms:
            mock_get_perms.return_value = {"ndt:*", "psv:view"}
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "ndt", "create")
            assert result is True
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "ndt", "delete")
            assert result is True
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "psv", "create")
            assert result is False

    @pytest.mark.asyncio
    async def test_has_permission_wildcard_action(self, mock_db, mock_inspector):
        """Test has_permission with wildcard action permission"""
        with patch.object(PermissionService, 'get_inspector_permissions') as mock_get_perms:
            mock_get_perms.return_value = {"*:create", "psv:view"}
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "ndt", "create")
            assert result is True
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "mechanical", "create")
            assert result is True
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "ndt", "delete")
            assert result is False

    @pytest.mark.asyncio
    async def test_has_permission_superuser(self, mock_db, mock_inspector):
        """Test has_permission with superuser permission"""
        with patch.object(PermissionService, 'get_inspector_permissions') as mock_get_perms:
            mock_get_perms.return_value = {"*:*"}
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "ndt", "create")
            assert result is True
            
            result = await PermissionService.has_permission(mock_db, mock_inspector, "admin", "delete_all")
            assert result is True

    @pytest.mark.asyncio
    async def test_has_permission_inactive_inspector(self, mock_db):
        """Test has_permission with inactive inspector"""
        inactive_inspector = MagicMock(spec=Inspector)
        inactive_inspector.id = 1
        inactive_inspector.active = False
        inactive_inspector.can_login = True
        
        result = await PermissionService.has_permission(mock_db, inactive_inspector, "ndt", "create")
        assert result is False

    @pytest.mark.asyncio
    async def test_has_permission_no_login_inspector(self, mock_db):
        """Test has_permission with inspector who cannot login"""
        no_login_inspector = MagicMock(spec=Inspector)
        no_login_inspector.id = 1
        no_login_inspector.active = True
        no_login_inspector.can_login = False
        
        result = await PermissionService.has_permission(mock_db, no_login_inspector, "ndt", "create")
        assert result is False

    @pytest.mark.asyncio
    async def test_assign_role_to_inspector_success(self, mock_db):
        """Test successful role assignment to inspector"""
        # Mock database query to return None (no existing assignment)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        with patch.object(PermissionService, 'invalidate_inspector_cache') as mock_invalidate:
            result = await PermissionService.assign_role_to_inspector(mock_db, 1, 1)
            
            assert result is True
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_invalidate.assert_called_once_with(1)

    @pytest.mark.asyncio
    async def test_assign_role_to_inspector_already_exists(self, mock_db):
        """Test role assignment when assignment already exists"""
        # Mock database query to return existing assignment
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = MagicMock()
        mock_db.execute.return_value = mock_result
        
        result = await PermissionService.assign_role_to_inspector(mock_db, 1, 1)
        
        assert result is False
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_remove_role_from_inspector_success(self, mock_db):
        """Test successful role removal from inspector"""
        # Mock database query to return existing assignment
        mock_assignment = MagicMock()
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_assignment
        mock_db.execute.return_value = mock_result
        
        with patch.object(PermissionService, 'invalidate_inspector_cache') as mock_invalidate:
            result = await PermissionService.remove_role_from_inspector(mock_db, 1, 1)
            
            assert result is True
            mock_db.delete.assert_called_once_with(mock_assignment)
            mock_db.commit.assert_called_once()
            mock_invalidate.assert_called_once_with(1)

    @pytest.mark.asyncio
    async def test_remove_role_from_inspector_not_found(self, mock_db):
        """Test role removal when assignment doesn't exist"""
        # Mock database query to return None
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        result = await PermissionService.remove_role_from_inspector(mock_db, 1, 1)
        
        assert result is False
        mock_db.delete.assert_not_called()
        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_role(self, mock_db):
        """Test role creation"""
        result = await PermissionService.create_role(
            mock_db, 
            "Test Role", 
            "Test Description",
            "Test Display Label"
        )
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_permission(self, mock_db):
        """Test permission creation"""
        result = await PermissionService.create_permission(
            mock_db,
            "test_permission",
            "test",
            "action",
            "Test Description",
            "Test Display Label"
        )
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_assign_permission_to_role_success(self, mock_db):
        """Test successful permission assignment to role"""
        # Mock database query to return None (no existing assignment)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        with patch.object(PermissionService, 'invalidate_role_cache') as mock_invalidate_role, \
             patch.object(PermissionService, 'invalidate_all_inspector_caches') as mock_invalidate_all:
            
            result = await PermissionService.assign_permission_to_role(mock_db, 1, 1)
            
            assert result is True
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_invalidate_role.assert_called_once_with(1)
            mock_invalidate_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_assign_permission_to_role_already_exists(self, mock_db):
        """Test permission assignment when assignment already exists"""
        # Mock database query to return existing assignment
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = MagicMock()
        mock_db.execute.return_value = mock_result
        
        result = await PermissionService.assign_permission_to_role(mock_db, 1, 1)
        
        assert result is False
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    @patch('app.domains.auth.services.permission_service.aioredis')
    async def test_cache_operations(self, mock_aioredis):
        """Test Redis cache operations"""
        mock_redis = AsyncMock()
        mock_aioredis.from_url.return_value = mock_redis
        
        # Test cache invalidation
        await PermissionService.invalidate_inspector_cache(1)
        mock_redis.delete.assert_called_once()
        
        await PermissionService.invalidate_role_cache(1)
        assert mock_redis.delete.call_count == 2
        
        # Test bulk cache invalidation
        mock_redis.keys.return_value = ["key1", "key2", "key3"]
        await PermissionService.invalidate_all_inspector_caches()
        mock_redis.keys.assert_called_once()

    @pytest.mark.asyncio
    async def test_multiple_role_permissions(self, mock_db, mock_inspector):
        """Test inspector with multiple roles and overlapping permissions"""
        with patch.object(PermissionService, 'get_inspector_permissions') as mock_get_perms:
            # Inspector has permissions from multiple roles with some overlap
            mock_get_perms.return_value = {
                "ndt:create", "ndt:view", "ndt:edit_own",
                "mechanical:create", "mechanical:view",
                "report:approve"  # From manager role
            }
            
            # Test various permission checks
            assert await PermissionService.has_permission(mock_db, mock_inspector, "ndt", "create") is True
            assert await PermissionService.has_permission(mock_db, mock_inspector, "mechanical", "view") is True
            assert await PermissionService.has_permission(mock_db, mock_inspector, "report", "approve") is True
            assert await PermissionService.has_permission(mock_db, mock_inspector, "psv", "create") is False