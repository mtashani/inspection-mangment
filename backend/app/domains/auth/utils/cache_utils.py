"""
Utility functions for cache management and monitoring
"""

import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from app.domains.auth.services.cache_service import CacheService
from app.core.database import get_db
from app.domains.auth.services.permission_service import PermissionService


class CacheUtils:
    """Utility class for cache management operations"""
    
    @staticmethod
    async def warm_all_inspector_caches():
        """Warm cache for all active inspectors"""
        from app.domains.inspector.models.inspector import Inspector
        from sqlmodel import Session, select
        
        db = next(get_db())
        try:
            # Get all active inspectors who can login
            result = db.exec(
                select(Inspector).where(
                    Inspector.active == True,
                    Inspector.can_login == True
                )
            )
            inspectors = result.all()
            
            success_count = 0
            failure_count = 0
            
            for inspector in inspectors:
                try:
                    # Get roles and permissions for this inspector
                    roles, permissions = await PermissionService.get_inspector_roles_and_permissions(
                        db, inspector.id
                    )
                    
                    # Warm the cache
                    success = await CacheService.warm_inspector_cache(
                        inspector.id, roles, permissions
                    )
                    
                    if success:
                        success_count += 1
                    else:
                        failure_count += 1
                        
                except Exception as e:
                    logging.error(f"Failed to warm cache for inspector {inspector.id}: {e}")
                    failure_count += 1
            
            logging.info(f"Cache warming completed: {success_count} success, {failure_count} failures")
            return {"success": success_count, "failures": failure_count}
            
        finally:
            db.close()
    
    @staticmethod
    async def monitor_cache_performance(duration_minutes: int = 60) -> Dict:
        """Monitor cache performance for a specified duration"""
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(minutes=duration_minutes)
        
        stats_history = []
        
        while datetime.utcnow() < end_time:
            try:
                stats = await CacheService.get_cache_stats()
                if stats:
                    stats["timestamp"] = datetime.utcnow().isoformat()
                    stats_history.append(stats)
                
                # Wait 5 minutes before next check
                await asyncio.sleep(300)
                
            except Exception as e:
                logging.error(f"Error monitoring cache: {e}")
                break
        
        return {
            "monitoring_period": f"{duration_minutes} minutes",
            "start_time": start_time.isoformat(),
            "end_time": datetime.utcnow().isoformat(),
            "stats_history": stats_history
        }
    
    @staticmethod
    async def cleanup_expired_caches():
        """Clean up expired cache entries (Redis handles this automatically, but useful for monitoring)"""
        try:
            health = await CacheService.health_check()
            if health["status"] == "healthy":
                logging.info("Cache cleanup: Redis is healthy, automatic expiration is working")
                return {"status": "healthy", "message": "Automatic expiration active"}
            else:
                logging.warning(f"Cache cleanup: Redis health check failed: {health}")
                return {"status": "unhealthy", "error": health.get("error")}
                
        except Exception as e:
            logging.error(f"Cache cleanup error: {e}")
            return {"status": "error", "error": str(e)}
    
    @staticmethod
    async def cache_maintenance():
        """Perform routine cache maintenance"""
        maintenance_results = {}
        
        try:
            # 1. Health check
            health = await CacheService.health_check()
            maintenance_results["health_check"] = health
            
            if health["status"] != "healthy":
                return maintenance_results
            
            # 2. Get current stats
            stats = await CacheService.get_cache_stats()
            maintenance_results["current_stats"] = stats
            
            # 3. Check for any issues and log them
            if stats:
                total_cached_items = (
                    stats.get("inspector_permissions", 0) +
                    stats.get("inspector_roles", 0) +
                    stats.get("role_permissions", 0)
                )
                
                maintenance_results["total_cached_items"] = total_cached_items
                
                if total_cached_items > 10000:  # Arbitrary threshold
                    logging.warning(f"High cache usage detected: {total_cached_items} items")
                    maintenance_results["warning"] = "High cache usage"
            
            # 4. Log maintenance completion
            logging.info("Cache maintenance completed successfully")
            maintenance_results["status"] = "completed"
            
        except Exception as e:
            logging.error(f"Cache maintenance error: {e}")
            maintenance_results["status"] = "error"
            maintenance_results["error"] = str(e)
        
        return maintenance_results
    
    @staticmethod
    async def invalidate_inspector_by_username(username: str) -> bool:
        """Invalidate cache for inspector by username"""
        from app.domains.inspector.models.inspector import Inspector
        from sqlmodel import Session, select
        
        db = next(get_db())
        try:
            # Find inspector by username
            result = db.exec(
                select(Inspector).where(Inspector.username == username)
            )
            inspector = result.first()
            
            if not inspector:
                logging.warning(f"Inspector not found with username: {username}")
                return False
            
            # Invalidate cache
            success = await CacheService.invalidate_inspector_cache(inspector.id)
            
            if success:
                logging.info(f"Cache invalidated for inspector {username} (ID: {inspector.id})")
            
            return success
            
        except Exception as e:
            logging.error(f"Error invalidating cache for username {username}: {e}")
            return False
        finally:
            db.close()
    
    @staticmethod
    async def bulk_invalidate_inspectors(inspector_ids: List[int]) -> Dict[str, int]:
        """Bulk invalidate cache for multiple inspectors"""
        success_count = 0
        failure_count = 0
        
        for inspector_id in inspector_ids:
            try:
                success = await CacheService.invalidate_inspector_cache(inspector_id)
                if success:
                    success_count += 1
                else:
                    failure_count += 1
            except Exception as e:
                logging.error(f"Failed to invalidate cache for inspector {inspector_id}: {e}")
                failure_count += 1
        
        logging.info(f"Bulk cache invalidation: {success_count} success, {failure_count} failures")
        return {"success": success_count, "failures": failure_count}
    
    @staticmethod
    async def get_cache_report() -> Dict:
        """Generate comprehensive cache report"""
        try:
            # Get basic stats
            stats = await CacheService.get_cache_stats()
            health = await CacheService.health_check()
            
            report = {
                "timestamp": datetime.utcnow().isoformat(),
                "health": health,
                "statistics": stats,
                "recommendations": []
            }
            
            if stats:
                total_items = (
                    stats.get("inspector_permissions", 0) +
                    stats.get("inspector_roles", 0) +
                    stats.get("role_permissions", 0)
                )
                
                report["total_cached_items"] = total_items
                
                # Add recommendations based on stats
                if total_items == 0:
                    report["recommendations"].append("Consider warming cache for better performance")
                elif total_items > 5000:
                    report["recommendations"].append("High cache usage - monitor memory consumption")
                
                if health["status"] != "healthy":
                    report["recommendations"].append("Redis health issues detected - check connection")
                else:
                    report["recommendations"].append("Cache system is healthy")
            
            return report
            
        except Exception as e:
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "status": "error"
            }


# CLI-style functions for easy script usage
async def warm_cache():
    """CLI function to warm all caches"""
    print("Starting cache warming...")
    result = await CacheUtils.warm_all_inspector_caches()
    print(f"Cache warming completed: {result}")

async def invalidate_all():
    """CLI function to invalidate all caches"""
    print("Invalidating all caches...")
    result = await CacheService.invalidate_all_caches()
    print(f"Cache invalidation result: {result}")

async def cache_status():
    """CLI function to check cache status"""
    print("Checking cache status...")
    report = await CacheUtils.get_cache_report()
    print(f"Cache report: {report}")

async def maintenance():
    """CLI function to run cache maintenance"""
    print("Running cache maintenance...")
    result = await CacheUtils.cache_maintenance()
    print(f"Maintenance result: {result}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python cache_utils.py [warm|invalidate|status|maintenance]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "warm":
        asyncio.run(warm_cache())
    elif command == "invalidate":
        asyncio.run(invalidate_all())
    elif command == "status":
        asyncio.run(cache_status())
    elif command == "maintenance":
        asyncio.run(maintenance())
    else:
        print(f"Unknown command: {command}")
        print("Available commands: warm, invalidate, status, maintenance")
        sys.exit(1)