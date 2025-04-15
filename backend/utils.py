"""
Compatibility utilities for langchain_huggingface
"""
import os
from typing import Any, Optional


def from_env(key: str, default: Optional[Any] = None) -> Optional[Any]:
    """Get a value from an environment variable.
    
    This is a compatibility function to replace the missing from_env in langchain_core.utils
    
    Args:
        key: The environment variable name.
        default: The default value to return if the environment variable is not set.
        
    Returns:
        The value of the environment variable, or the default value if not set.
    """
    return os.environ.get(key, default)
