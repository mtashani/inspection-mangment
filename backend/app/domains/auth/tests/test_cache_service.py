"""Unit tests for CacheService"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import json

from app.domains.auth.services.cache_service import CacheService


class TestCacheService:
    """Test cases for CacheService"""

    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client"""
        redis_mock = AsyncMock()
        redis_mock.ping.return_value = True
        return redis_mock

    @pytest.fixture
    def sample_permissions(self):
        """Sample permissions set"""
        return {"ndt:create", "ndt:view", "psv:create"}

    @pytest.fixture
    def sample_roles(self):
        """Sample roles list"""
        return ["NDT Inspector", "PSV Operator"]

    @pytest.mark.asyncio
    async def test_get_redis_success(self, mock_redis):
        """Test successful Redis connection"""
        with patch('aioredis.from_url', return_value=mock_redis):
            redis_client = await CacheService.get_redis()
            
            assert redis_client == mock_redis
            mock_redis.ping.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_redis_connection_failure(self):
        """Test Redis connection failure"""
        with patch('aioredis.from_url', side_effect=Exception("Connection failed")):
            redis_client = await CacheService.get_redis()
            
            assert redis_client is None

    @pytest.mark.asyncio
    async def test_close_redis(self, mock_redis):
        """Test Redis connection closure"""
        CacheService._redis = mock_redis
        
        await CacheService.close_redis()
        
        mock_redis.close.assert_called_once()
        assert CacheService._redis is None

    @pytest.mark.asyncio
    async def test_get_inspector_permissions_cache_hit(self, mock_redis, sample_permissions):
        """Test getting inspector permissions from cache (hit)"""
        permissions_json = json.dumps(list(sample_permissions))
        mock_redis.get.return_value = permissions_json
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.get_inspector_permissions(1)
            
            assert result == sample_permissions
            mock_redis.get.assert_called_once_with("inspector_permissions:1")

    @pytest.mark.asyncio
    async def test_get_inspector_permissions_cache_miss(self, mock_redis):
        """Test getting inspector permissions from cache (miss)"""
        mock_redis.get.return_value = None
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.get_inspector_permissions(1)
            
            assert result is None
            mock_redis.get.assert_called_once_with("inspector_permissions:1")

    @pytest.mark.asyncio
    async def test_get_inspector_permissions_no_redis(self):
        """Test getting inspector permissions when Redis is unavailable"""
        with patch.object(CacheService, 'get_redis', return_value=None):
            result = await CacheService.get_inspector_permissions(1)
            
            assert result is None

    @pytest.mark.asyncio
    async def test_set_inspector_permissions_success(self, mock_redis, sample_permissions):
        """Test setting inspector permissions in cache"""
        with patch.object(CacheService, 'get_redis', return_value=mock_redis), \
             patch('app.domains.auth.services.cache_service.settings') as mock_settings:
            
            mock_settings.CACHE_TTL = 300
            
            result = await CacheService.set_inspector_permissions(1, sample_permissions)
            
            assert result is True
            mock_redis.setex.assert_called_once()
            
            # Check the call arguments
            call_args = mock_redis.setex.call_args
            assert call_args[0][0] == "inspector_permissions:1"  # key
            assert call_args[0][1] == 300  # ttl
            
            # Check that the cached value contains all permissions
            cached_value = json.loads(call_args[0][2])
            assert set(cached_value) == sample_permissions

    @pytest.mark.asyncio
    async def test_set_inspector_permissions_no_redis(self, sample_permissions):
        """Test setting inspector permissions when Redis is unavailable"""
        with patch.object(CacheService, 'get_redis', return_value=None):
            result = await CacheService.set_inspector_permissions(1, sample_permissions)
            
            assert result is False

    @pytest.mark.asyncio
    async def test_get_inspector_roles_success(self, mock_redis, sample_roles):
        """Test getting inspector roles from cache"""
        roles_json = json.dumps(sample_roles)
        mock_redis.get.return_value = roles_json
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.get_inspector_roles(1)
            
            assert result == sample_roles
            mock_redis.get.assert_called_once_with("inspector_roles:1")

    @pytest.mark.asyncio
    async def test_set_inspector_roles_success(self, mock_redis, sample_roles):
        """Test setting inspector roles in cache"""
        with patch.object(CacheService, 'get_redis', return_value=mock_redis), \
             patch('app.domains.auth.services.cache_service.settings') as mock_settings:
            
            mock_settings.CACHE_TTL = 300
            
            result = await CacheService.set_inspector_roles(1, sample_roles)
            
            assert result is True
            mock_redis.setex.assert_called_once()
            
            # Check the call arguments
            call_args = mock_redis.setex.call_args
            assert call_args[0][0] == "inspector_roles:1"  # key
            assert call_args[0][1] == 300  # ttl
            assert json.loads(call_args[0][2]) == sample_roles

    @pytest.mark.asyncio
    async def test_invalidate_inspector_cache_success(self, mock_redis):
        """Test invalidating inspector cache"""
        mock_redis.delete.return_value = 2  # 2 keys deleted
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.invalidate_inspector_cache(1)
            
            assert result is True
            mock_redis.delete.assert_called_once_with(
                "inspector_permissions:1",
                "inspector_roles:1"
            )

    @pytest.mark.asyncio
    async def test_invalidate_role_cache_success(self, mock_redis):
        """Test invalidating role cache"""
        mock_redis.keys.return_value = ["inspector_permissions:1", "inspector_roles:1", "inspector_permissions:2"]
        mock_redis.delete.return_value = 3
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.invalidate_role_cache(1)
            
            assert result is True
            mock_redis.keys.assert_called_once_with("inspector_*")
            mock_redis.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_invalidate_permission_cache_success(self, mock_redis):
        """Test invalidating permission cache"""
        mock_redis.keys.return_value = ["inspector_permissions:1", "inspector_roles:2"]
        mock_redis.delete.return_value = 2
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.invalidate_permission_cache(1)
            
            assert result is True
            mock_redis.keys.assert_called_once_with("inspector_*")
            mock_redis.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_role_permissions_success(self, mock_redis, sample_permissions):
        """Test getting role permissions from cache"""
        permissions_json = json.dumps(list(sample_permissions))
        mock_redis.get.return_value = permissions_json
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.get_role_permissions(1)
            
            assert result == sample_permissions
            mock_redis.get.assert_called_once_with("role_permissions:1")

    @pytest.mark.asyncio
    async def test_set_role_permissions_success(self, mock_redis, sample_permissions):
        """Test setting role permissions in cache"""
        with patch.object(CacheService, 'get_redis', return_value=mock_redis), \
             patch('app.domains.auth.services.cache_service.settings') as mock_settings:
            
            mock_settings.CACHE_TTL = 300
            
            result = await CacheService.set_role_permissions(1, sample_permissions)
            
            assert result is True
            mock_redis.setex.assert_called_once()

    @pytest.mark.asyncio
    async def test_invalidate_all_caches_success(self, mock_redis):
        """Test invalidating all caches"""
        # Mock keys method to return different keys for each pattern
        mock_redis.keys.side_effect = [
            ["inspector_permissions:1", "inspector_permissions:2"],  # First pattern
            ["inspector_roles:1"],  # Second pattern
            ["role_permissions:1", "role_permissions:2"]  # Third pattern
        ]
        mock_redis.delete.side_effect = [2, 1, 2]  # Return values for each delete call
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.invalidate_all_caches()
            
            assert result is True
            assert mock_redis.keys.call_count == 3
            assert mock_redis.delete.call_count == 3

    @pytest.mark.asyncio
    async def test_get_cache_stats_success(self, mock_redis):
        """Test getting cache statistics"""
        mock_redis.keys.side_effect = [
            ["inspector_permissions:1", "inspector_permissions:2"],  # 2 permission caches
            ["inspector_roles:1"],  # 1 role cache
            ["role_permissions:1"]  # 1 role permission cache
        ]
        mock_redis.info.return_value = {
            "used_memory_human": "1.5M",
            "connected_clients": 5
        }
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.get_cache_stats()
            
            expected_stats = {
                "inspector_permissions": 2,
                "inspector_roles": 1,
                "role_permissions": 1,
                "redis_memory_used": "1.5M",
                "redis_connected_clients": 5
            }
            
            assert result == expected_stats

    @pytest.mark.asyncio
    async def test_warm_inspector_cache_success(self, mock_redis, sample_roles, sample_permissions):
        """Test warming inspector cache"""
        with patch.object(CacheService, 'set_inspector_roles', return_value=True) as mock_set_roles, \
             patch.object(CacheService, 'set_inspector_permissions', return_value=True) as mock_set_perms:
            
            result = await CacheService.warm_inspector_cache(1, sample_roles, sample_permissions)
            
            assert result is True
            mock_set_roles.assert_called_once_with(1, sample_roles)
            mock_set_perms.assert_called_once_with(1, sample_permissions)

    @pytest.mark.asyncio
    async def test_warm_inspector_cache_partial_failure(self, sample_roles, sample_permissions):
        """Test warming inspector cache with partial failure"""
        with patch.object(CacheService, 'set_inspector_roles', return_value=True), \
             patch.object(CacheService, 'set_inspector_permissions', return_value=False):
            
            result = await CacheService.warm_inspector_cache(1, sample_roles, sample_permissions)
            
            assert result is False

    @pytest.mark.asyncio
    async def test_health_check_healthy(self, mock_redis):
        """Test health check when Redis is healthy"""
        mock_redis.set.return_value = True
        mock_redis.get.return_value = "test_value"
        mock_redis.delete.return_value = 1
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.health_check()
            
            expected = {
                "status": "healthy",
                "connected": True,
                "operations": "working"
            }
            
            assert result == expected
            mock_redis.set.assert_called_once()
            mock_redis.get.assert_called_once()
            mock_redis.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_health_check_no_connection(self):
        """Test health check when Redis connection is unavailable"""
        with patch.object(CacheService, 'get_redis', return_value=None):
            result = await CacheService.health_check()
            
            expected = {
                "status": "unhealthy",
                "error": "Redis connection not available",
                "connected": False
            }
            
            assert result == expected

    @pytest.mark.asyncio
    async def test_health_check_operations_failure(self, mock_redis):
        """Test health check when Redis operations fail"""
        mock_redis.set.return_value = True
        mock_redis.get.return_value = "wrong_value"  # Wrong value returned
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.health_check()
            
            assert result["status"] == "unhealthy"
            assert result["connected"] is True
            assert "not working correctly" in result["error"]

    @pytest.mark.asyncio
    async def test_health_check_exception(self, mock_redis):
        """Test health check when exception occurs"""
        mock_redis.set.side_effect = Exception("Redis error")
        
        with patch.object(CacheService, 'get_redis', return_value=mock_redis):
            result = await CacheService.health_check()
            
            assert result["status"] == "unhealthy"
            assert result["connected"] is False
            assert "Redis error" in result["error"]