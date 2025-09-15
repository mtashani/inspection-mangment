"""Cache service for permission and role caching using Redis."""

import json
import logging
from typing import Optional, Set, List, Any
import aioredis
from aioredis import Redis

from app.core.config import settings


class CacheService:
    """Service for handling Redis caching operations"""
    
    _redis: Optional[Redis] = None
    
    @classmethod
    async def get_redis(cls) -> Redis:
        """Get Redis connection"""
        if cls._redis is None:
            try:
                cls._redis = await aioredis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await cls._redis.ping()
                logging.info("Redis connection established")
            except Exception as e:
                logging.warning(f"Redis connection failed: {e}. Caching disabled.")
                cls._redis = None
        return cls._redis
    
    @classmethod
    async def close_redis(cls):
        """Close Redis connection"""
        if cls._redis:
            await cls._redis.close()
            cls._redis = None
    
    @classmethod
    async def get_inspector_permissions(cls, inspector_id: int) -> Optional[Set[str]]:
        """Get cached inspector permissions"""
        redis = await cls.get_redis()
        if not redis:
            return None
            
        try:
            cache_key = f"inspector_permissions:{inspector_id}"
            cached_data = await redis.get(cache_key)
            
            if cached_data:
                permissions_list = json.loads(cached_data)
                return set(permissions_list)
                
        except Exception as e:
            logging.error(f"Error getting cached permissions: {e}")
            
        return None
    
    @classmethod
    async def set_inspector_permissions(cls, inspector_id: int, permissions: Set[str], ttl: Optional[int] = None) -> bool:
        """Cache inspector permissions"""
        redis = await cls.get_redis()
        if not redis:
            return False
            
        try:
            cache_key = f"inspector_permissions:{inspector_id}"
            permissions_list = list(permissions)
            cache_value = json.dumps(permissions_list)
            
            ttl = ttl or settings.CACHE_TTL
            await redis.setex(cache_key, ttl, cache_value)
            
            logging.debug(f"Cached permissions for inspector {inspector_id}")
            return True
            
        except Exception as e:
            logging.error(f"Error caching permissions: {e}")
            return False
    
    @classmethod
    async def get_inspector_roles(cls, inspector_id: int) -> Optional[List[str]]:
        """Get cached inspector roles"""
        redis = await cls.get_redis()
        if not redis:
            return None
            
        try:
            cache_key = f"inspector_roles:{inspector_id}"
            cached_data = await redis.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
                
        except Exception as e:
            logging.error(f"Error getting cached roles: {e}")
            
        return None
    
    @classmethod
    async def set_inspector_roles(cls, inspector_id: int, roles: List[str], ttl: Optional[int] = None) -> bool:
        """Cache inspector roles"""
        redis = await cls.get_redis()
        if not redis:
            return False
            
        try:
            cache_key = f"inspector_roles:{inspector_id}"
            cache_value = json.dumps(roles)
            
            ttl = ttl or settings.CACHE_TTL
            await redis.setex(cache_key, ttl, cache_value)
            
            logging.debug(f"Cached roles for inspector {inspector_id}")
            return True
            
        except Exception as e:
            logging.error(f"Error caching roles: {e}")
            return False
    
    @classmethod
    async def invalidate_inspector_cache(cls, inspector_id: int) -> bool:
        """Invalidate all cache entries for an inspector"""
        redis = await cls.get_redis()
        if not redis:
            return False
            
        try:
            keys_to_delete = [
                f"inspector_permissions:{inspector_id}",
                f"inspector_roles:{inspector_id}"
            ]
            
            deleted_count = await redis.delete(*keys_to_delete)
            logging.info(f"Invalidated {deleted_count} cache entries for inspector {inspector_id}")
            return True
            
        except Exception as e:
            logging.error(f"Error invalidating cache: {e}")
            return False
    
    @classmethod
    async def invalidate_role_cache(cls, role_id: int) -> bool:
        """Invalidate cache for all inspectors with a specific role"""
        redis = await cls.get_redis()
        if not redis:
            return False
            
        try:
            # Find all inspector permission/role cache keys and delete them
            # This is a simple approach - in production, you might want to maintain
            # a mapping of roles to inspectors for more efficient invalidation
            pattern = "inspector_*"
            keys = await redis.keys(pattern)
            
            if keys:
                deleted_count = await redis.delete(*keys)
                logging.info(f"Invalidated {deleted_count} cache entries for role {role_id}")
                
            return True
            
        except Exception as e:
            logging.error(f"Error invalidating role cache: {e}")
            return False
    
    @classmethod
    async def invalidate_permission_cache(cls, permission_id: int) -> bool:
        """Invalidate cache for all inspectors with a specific permission"""
        redis = await cls.get_redis()
        if not redis:
            return False
            
        try:
            # Find all inspector permission/role cache keys and delete them
            # This is a simple approach - in production, you might want to maintain
            # a mapping of permissions to inspectors for more efficient invalidation
            pattern = "inspector_*"
            keys = await redis.keys(pattern)
            
            if keys:
                deleted_count = await redis.delete(*keys)
                logging.info(f"Invalidated {deleted_count} cache entries for permission {permission_id}")
                
            return True
            
        except Exception as e:
            logging.error(f"Error invalidating permission cache: {e}")
            return False
    
    @classmethod
    async def get_role_permissions(cls, role_id: int) -> Optional[Set[str]]:
        """Get cached role permissions"""
        redis = await cls.get_redis()
        if not redis:
            return None
            
        try:
            cache_key = f"role_permissions:{role_id}"
            cached_data = await redis.get(cache_key)
            
            if cached_data:
                permissions_list = json.loads(cached_data)
                return set(permissions_list)
                
        except Exception as e:
            logging.error(f"Error getting cached role permissions: {e}")
            
        return None
    
    @classmethod
    async def set_role_permissions(cls, role_id: int, permissions: Set[str], ttl: Optional[int] = None) -> bool:
        """Cache role permissions"""
        redis = await cls.get_redis()
        if not redis:
            return False
            
        try:
            cache_key = f"role_permissions:{role_id}"
            permissions_list = list(permissions)
            cache_value = json.dumps(permissions_list)
            
            ttl = ttl or settings.CACHE_TTL
            await redis.setex(cache_key, ttl, cache_value)
            
            logging.debug(f"Cached permissions for role {role_id}")
            return True
            
        except Exception as e:
            logging.error(f"Error caching role permissions: {e}")
            return False
    
    @classmethod
    async def invalidate_all_caches(cls) -> bool:
        """Invalidate all RBAC-related caches"""
        redis = await cls.get_redis()
        if not redis:
            return False
            
        try:
            patterns = [
                "inspector_permissions:*",
                "inspector_roles:*", 
                "role_permissions:*"
            ]
            
            total_deleted = 0
            for pattern in patterns:
                keys = await redis.keys(pattern)
                if keys:
                    deleted_count = await redis.delete(*keys)
                    total_deleted += deleted_count
            
            logging.info(f"Invalidated {total_deleted} total cache entries")
            return True
            
        except Exception as e:
            logging.error(f"Error invalidating all caches: {e}")
            return False
    
    @classmethod
    async def get_cache_stats(cls) -> Optional[dict]:
        """Get cache statistics"""
        redis = await cls.get_redis()
        if not redis:
            return None
            
        try:
            patterns = {
                "inspector_permissions": "inspector_permissions:*",
                "inspector_roles": "inspector_roles:*",
                "role_permissions": "role_permissions:*"
            }
            
            stats = {}
            for cache_type, pattern in patterns.items():
                keys = await redis.keys(pattern)
                stats[cache_type] = len(keys)
            
            # Get Redis info
            info = await redis.info()
            stats["redis_memory_used"] = info.get("used_memory_human", "unknown")
            stats["redis_connected_clients"] = info.get("connected_clients", 0)
            
            return stats
            
        except Exception as e:
            logging.error(f"Error getting cache stats: {e}")
            return None
    
    @classmethod
    async def warm_inspector_cache(cls, inspector_id: int, roles: List[str], permissions: Set[str]) -> bool:
        """Warm cache for an inspector with their roles and permissions"""
        try:
            # Cache both roles and permissions
            roles_cached = await cls.set_inspector_roles(inspector_id, roles)
            permissions_cached = await cls.set_inspector_permissions(inspector_id, permissions)
            
            success = roles_cached and permissions_cached
            if success:
                logging.info(f"Warmed cache for inspector {inspector_id}")
            
            return success
            
        except Exception as e:
            logging.error(f"Error warming cache for inspector {inspector_id}: {e}")
            return False
    
    @classmethod
    async def health_check(cls) -> dict:
        """Check Redis health and connectivity"""
        try:
            redis = await cls.get_redis()
            if not redis:
                return {
                    "status": "unhealthy",
                    "error": "Redis connection not available",
                    "connected": False
                }
            
            # Test basic operations
            test_key = "health_check_test"
            await redis.set(test_key, "test_value", ex=10)  # Expire in 10 seconds
            test_value = await redis.get(test_key)
            await redis.delete(test_key)
            
            if test_value == "test_value":
                return {
                    "status": "healthy",
                    "connected": True,
                    "operations": "working"
                }
            else:
                return {
                    "status": "unhealthy", 
                    "error": "Redis operations not working correctly",
                    "connected": True
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "connected": False
            }