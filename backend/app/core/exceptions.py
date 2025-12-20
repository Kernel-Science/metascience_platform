import functools
import logging
import asyncio
from typing import Any, Callable, TypeVar, Union

logger = logging.getLogger(__name__)

T = TypeVar("T")

def safe_execution(context: str, default_val: Any = None, silent: bool = False):
    """
    Standardized decorator for executing functions with error handling.
    Logs errors to the logger and returns a default value.
    
    Args:
        context: Human-readable context for the error log
        default_val: Value to return on failure
        silent: If True, only logs as DEBUG or info instead of ERROR (optional refinement)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., Union[T, Any]]:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> Union[T, Any]:
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                return func(*args, **kwargs)
            except Exception as e:
                log_msg = f"[{context}] Error in {func.__name__}: {str(e)}"
                if silent:
                    logger.debug(log_msg)
                else:
                    logger.error(log_msg, exc_info=True)
                return default_val
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> Union[T, Any]:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                log_msg = f"[{context}] Error in {func.__name__}: {str(e)}"
                if silent:
                    logger.debug(log_msg)
                else:
                    logger.error(log_msg, exc_info=True)
                return default_val
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator
