"""
Patch for langchain_huggingface to fix the missing from_env function
"""
import sys
import importlib.util
import os
from typing import Any, Optional

# Check if langchain_huggingface is installed
if importlib.util.find_spec("langchain_huggingface") is not None:
    # Get the path to the langchain_huggingface module
    langchain_huggingface_path = importlib.util.find_spec("langchain_huggingface").submodule_search_locations[0]
    
    # Path to the file that imports from_env
    llms_init_path = os.path.join(langchain_huggingface_path, "llms", "__init__.py")
    huggingface_endpoint_path = os.path.join(langchain_huggingface_path, "llms", "huggingface_endpoint.py")
    
    # Check if the file exists
    if os.path.exists(huggingface_endpoint_path):
        # Read the file
        with open(huggingface_endpoint_path, "r") as f:
            content = f.read()
        
        # Replace the import
        if "from langchain_core.utils import from_env" in content:
            # Create a backup
            with open(huggingface_endpoint_path + ".bak", "w") as f:
                f.write(content)
            
            # Get the absolute path to our utils.py file
            utils_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "utils.py")
            utils_dir = os.path.dirname(utils_path)
            
            # Create a custom import that doesn't rely on the 'backend' module name
            custom_import = f"""
# Custom from_env implementation to fix compatibility issues
import os
from typing import Any, Optional

def from_env(key: str, default: Optional[Any] = None) -> Optional[Any]:
    \"\"\"Get a value from an environment variable.\"\"\"
    return os.environ.get(key, default)

# Original import that caused the error:
# from langchain_core.utils import from_env, get_pydantic_field_names
from langchain_core.utils import get_pydantic_field_names
"""
            
            # Replace the import
            content = content.replace(
                "from langchain_core.utils import from_env, get_pydantic_field_names",
                custom_import
            )
            
            # Write the modified file
            with open(huggingface_endpoint_path, "w") as f:
                f.write(content)
            
            print("✅ Successfully patched langchain_huggingface to use custom from_env function")
        else:
            print("⚠️ Could not find the import statement to patch in huggingface_endpoint.py")
    else:
        print(f"⚠️ File not found: {huggingface_endpoint_path}")
else:
    print("⚠️ langchain_huggingface module not found")
