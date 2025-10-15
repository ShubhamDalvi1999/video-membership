"""
Datadog monitoring utilities for the video membership application.
"""
import os
import time
import logging
from functools import wraps
from typing import Optional, Dict, Any
from datadog import statsd
from ddtrace import tracer

logger = logging.getLogger(__name__)

# Initialize Datadog if not already done
try:
    from datadog import initialize
    initialize(
        api_key=os.getenv('DD_API_KEY'),
        site=os.getenv('DD_SITE', 'datadoghq.com')
    )
except Exception as e:
    logger.warning(f"Failed to initialize Datadog: {e}")

def track_metrics(func_name: str, tags: Optional[Dict[str, str]] = None):
    """
    Decorator to track custom metrics for function execution.
    
    Args:
        func_name: Name of the function for metrics
        tags: Additional tags for the metrics
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            metric_tags = tags or {}
            
            try:
                result = await func(*args, **kwargs)
                statsd.increment(f'video_membership.{func_name}.success', tags=metric_tags)
                return result
            except Exception as e:
                statsd.increment(f'video_membership.{func_name}.error', tags=metric_tags)
                logger.error(f"Error in {func_name}: {e}")
                raise
            finally:
                duration = (time.time() - start_time) * 1000  # Convert to milliseconds
                statsd.timing(f'video_membership.{func_name}.duration', duration, tags=metric_tags)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            metric_tags = tags or {}
            
            try:
                result = func(*args, **kwargs)
                statsd.increment(f'video_membership.{func_name}.success', tags=metric_tags)
                return result
            except Exception as e:
                statsd.increment(f'video_membership.{func_name}.error', tags=metric_tags)
                logger.error(f"Error in {func_name}: {e}")
                raise
            finally:
                duration = (time.time() - start_time) * 1000  # Convert to milliseconds
                statsd.timing(f'video_membership.{func_name}.duration', duration, tags=metric_tags)
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    return decorator

def track_user_registration(user_id: str, email: str):
    """Track user registration metrics"""
    statsd.increment('video_membership.users.registered', tags={
        'user_id': user_id,
        'email_domain': email.split('@')[1] if '@' in email else 'unknown'
    })
    logger.info(f"User registered: {user_id}")

def track_user_login(user_id: str, success: bool):
    """Track user login metrics"""
    if success:
        statsd.increment('video_membership.users.login.success')
    else:
        statsd.increment('video_membership.users.login.failed')
    
    logger.info(f"User login attempt: {user_id}, success: {success}")

def track_video_views(video_id: str, user_id: str, video_title: str):
    """Track video view metrics"""
    statsd.increment('video_membership.videos.views', tags={
        'video_id': video_id,
        'user_id': user_id
    })
    logger.info(f"Video viewed: {video_id} by user {user_id}")

def track_course_enrollments(course_id: str, user_id: str, course_title: str):
    """Track course enrollment metrics"""
    statsd.increment('video_membership.courses.enrolled', tags={
        'course_id': course_id,
        'user_id': user_id
    })
    logger.info(f"Course enrolled: {course_id} by user {user_id}")

def track_playlist_creation(playlist_id: str, user_id: str, playlist_title: str):
    """Track playlist creation metrics"""
    statsd.increment('video_membership.playlists.created', tags={
        'playlist_id': playlist_id,
        'user_id': user_id
    })
    logger.info(f"Playlist created: {playlist_id} by user {user_id}")

def track_database_operation(operation_name: str, collection: str, duration_ms: float, success: bool):
    """Track database operation metrics"""
    tags = {
        'operation': operation_name,
        'collection': collection,
        'status': 'success' if success else 'error'
    }
    
    statsd.timing(f'video_membership.database.{operation_name}.duration', duration_ms, tags=tags)
    statsd.increment(f'video_membership.database.{operation_name}.count', tags=tags)
    
    if not success:
        statsd.increment('video_membership.database.errors', tags=tags)

def track_api_request(endpoint: str, method: str, status_code: int, duration_ms: float):
    """Track API request metrics"""
    tags = {
        'endpoint': endpoint,
        'method': method,
        'status_code': str(status_code),
        'status_class': f"{status_code // 100}xx"
    }
    
    statsd.increment('video_membership.api.requests', tags=tags)
    statsd.timing('video_membership.api.request.duration', duration_ms, tags=tags)
    
    if status_code >= 400:
        statsd.increment('video_membership.api.errors', tags=tags)

def track_search_queries(query: str, results_count: int, user_id: str):
    """Track search query metrics"""
    statsd.increment('video_membership.search.queries', tags={
        'user_id': user_id,
        'results_count': str(results_count)
    })
    logger.info(f"Search query: '{query}' by user {user_id}, results: {results_count}")

def track_watch_events(event_type: str, video_id: str, user_id: str, timestamp: int):
    """Track video watch events"""
    statsd.increment('video_membership.watch_events', tags={
        'event_type': event_type,
        'video_id': video_id,
        'user_id': user_id
    })
    logger.info(f"Watch event: {event_type} for video {video_id} by user {user_id}")

@tracer.wrap(service='video-membership', resource='database_query')
def track_database_query(operation: str, collection: str):
    """Track database queries with tracing"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                track_database_operation(operation, collection, duration, True)
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                track_database_operation(operation, collection, duration, False)
                raise
        return wrapper
    return decorator

def track_memory_usage():
    """Track application memory usage"""
    try:
        import psutil
        process = psutil.Process()
        memory_info = process.memory_info()
        
        statsd.gauge('video_membership.memory.rss', memory_info.rss)
        statsd.gauge('video_membership.memory.vms', memory_info.vms)
        statsd.gauge('video_membership.memory.percent', process.memory_percent())
    except ImportError:
        logger.warning("psutil not available for memory tracking")

def track_cpu_usage():
    """Track application CPU usage"""
    try:
        import psutil
        process = psutil.Process()
        cpu_percent = process.cpu_percent()
        
        statsd.gauge('video_membership.cpu.percent', cpu_percent)
    except ImportError:
        logger.warning("psutil not available for CPU tracking")

# Health check endpoint for monitoring
def get_health_metrics() -> Dict[str, Any]:
    """Get application health metrics"""
    try:
        import psutil
        process = psutil.Process()
        
        return {
            'memory_usage': process.memory_percent(),
            'cpu_usage': process.cpu_percent(),
            'open_files': len(process.open_files()),
            'threads': process.num_threads(),
            'status': 'healthy'
        }
    except Exception as e:
        logger.error(f"Error getting health metrics: {e}")
        return {'status': 'unhealthy', 'error': str(e)}
