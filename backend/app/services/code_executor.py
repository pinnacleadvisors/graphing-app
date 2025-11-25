"""
Safe Python code execution for AI-generated graphs
"""
import subprocess
import sys
import json
import tempfile
import os
from typing import Dict, List, Optional, Any
import ast


class CodeExecutor:
    """Safely execute Python code for graph generation"""
    
    # Allowed imports for security
    ALLOWED_IMPORTS = {
        'networkx', 'nx',  # Graph library
        'numpy', 'np',  # Numerical operations
        'math',  # Math functions
        'random',  # Random number generation
        'json',  # JSON handling
    }
    
    # Blocked dangerous operations
    BLOCKED_KEYWORDS = [
        'import os',
        'import sys',
        'import subprocess',
        'import __builtin__',
        'import builtins',
        '__import__',
        'eval(',
        'exec(',
        'open(',
        'file(',
        'input(',
        'raw_input(',
    ]
    
    EXECUTION_TIMEOUT = 10  # seconds
    
    @staticmethod
    def validate_code(code: str) -> tuple:
        """
        Validate code before execution
        Returns (is_valid, error_message)
        """
        # Check for blocked keywords
        code_lower = code.lower()
        for keyword in CodeExecutor.BLOCKED_KEYWORDS:
            if keyword.lower() in code_lower:
                return False, f"Blocked operation detected: {keyword}"
        
        # Try to parse the code
        try:
            ast.parse(code)
        except SyntaxError as e:
            return False, f"Syntax error: {str(e)}"
        
        # Check imports (basic check)
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name not in CodeExecutor.ALLOWED_IMPORTS:
                        return False, f"Import not allowed: {alias.name}"
            elif isinstance(node, ast.ImportFrom):
                if node.module and node.module.split('.')[0] not in CodeExecutor.ALLOWED_IMPORTS:
                    return False, f"Import not allowed: {node.module}"
        
        return True, None
    
    @staticmethod
    def execute_code(code: str) -> tuple:
        """
        Execute Python code and return graph data
        Returns (success, graph_data, error_message)
        
        Expected code format:
        ```python
        import networkx as nx
        import numpy as np
        
        # Create graph structure
        nodes = [...]
        edges = [...]
        
        # Return as JSON-serializable dict
        result = {
            "nodes": nodes,
            "edges": edges
        }
        ```
        """
        # Validate code first
        is_valid, error = CodeExecutor.validate_code(code)
        if not is_valid:
            return False, None, error
        
        # Create a temporary Python file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            # Wrap code in a safe execution context
            wrapped_code = f"""
import networkx as nx
import numpy as np
import math
import random
import json

# User code
{code}

# Ensure result exists
if 'result' not in locals():
    # Try to find nodes and edges
    if 'nodes' in locals() and 'edges' in locals():
        result = {{"nodes": nodes, "edges": edges}}
    else:
        result = {{"nodes": [], "edges": []}}

# Convert to JSON-serializable format
def convert_to_dict(obj):
    if isinstance(obj, (int, float, str, bool, type(None))):
        return obj
    elif isinstance(obj, (list, tuple)):
        return [convert_to_dict(item) for item in obj]
    elif isinstance(obj, dict):
        return {{k: convert_to_dict(v) for k, v in obj.items()}}
    elif hasattr(obj, '__dict__'):
        return convert_to_dict(obj.__dict__)
    else:
        return str(obj)

result = convert_to_dict(result)

# Output as JSON
import json
print(json.dumps(result))
"""
            f.write(wrapped_code)
            temp_file = f.name
        
        try:
            # Execute code with timeout
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=CodeExecutor.EXECUTION_TIMEOUT,
                env={**os.environ, 'PYTHONPATH': ''}  # Clear PYTHONPATH for safety
            )
            
            if result.returncode != 0:
                error_msg = result.stderr or "Code execution failed"
                return False, None, error_msg
            
            # Parse JSON output
            try:
                output = result.stdout.strip()
                # Extract JSON from output (in case there are print statements)
                if output:
                    # Try to find JSON in output
                    lines = output.split('\n')
                    json_line = None
                    for line in reversed(lines):
                        line = line.strip()
                        if line.startswith('{') or line.startswith('['):
                            json_line = line
                            break
                    
                    if json_line:
                        graph_data = json.loads(json_line)
                    else:
                        # Try parsing entire output
                        graph_data = json.loads(output)
                else:
                    return False, None, "No output from code execution"
                
                # Validate graph data structure
                if not isinstance(graph_data, dict):
                    return False, None, "Result must be a dictionary"
                
                if 'nodes' not in graph_data or 'edges' not in graph_data:
                    return False, None, "Result must contain 'nodes' and 'edges' keys"
                
                return True, graph_data, None
                
            except json.JSONDecodeError as e:
                return False, None, f"Failed to parse output as JSON: {str(e)}"
                
        except subprocess.TimeoutExpired:
            return False, None, f"Code execution timed out after {CodeExecutor.EXECUTION_TIMEOUT} seconds"
        except Exception as e:
            return False, None, f"Execution error: {str(e)}"
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file)
            except:
                pass
    
    @staticmethod
    def convert_to_graph_schema(graph_data: Dict[str, Any], graph_name: str = "AI Generated Graph") -> Dict[str, Any]:
        """
        Convert executed code result to GraphSchema format
        """
        nodes = []
        edges = []
        
        # Process nodes
        for i, node_data in enumerate(graph_data.get('nodes', [])):
            if isinstance(node_data, dict):
                node = {
                    'label': node_data.get('label', f'Node {i+1}'),
                    'x': float(node_data.get('x', 0.0)),
                    'y': float(node_data.get('y', 0.0)),
                    'z': float(node_data.get('z', 0.0)),
                    'color': node_data.get('color', '#3498db'),
                    'size': float(node_data.get('size', 1.0)),
                    'extra_data': node_data.get('extra_data')
                }
            else:
                # Handle simple formats (list of positions, etc.)
                node = {
                    'label': f'Node {i+1}',
                    'x': float(node_data[0]) if isinstance(node_data, (list, tuple)) and len(node_data) > 0 else 0.0,
                    'y': float(node_data[1]) if isinstance(node_data, (list, tuple)) and len(node_data) > 1 else 0.0,
                    'z': float(node_data[2]) if isinstance(node_data, (list, tuple)) and len(node_data) > 2 else 0.0,
                    'color': '#3498db',
                    'size': 1.0
                }
            nodes.append(node)
        
        # Process edges
        for i, edge_data in enumerate(graph_data.get('edges', [])):
            if isinstance(edge_data, dict):
                edge = {
                    'source_id': int(edge_data.get('source_id', 0)),
                    'target_id': int(edge_data.get('target_id', 0)),
                    'weight': float(edge_data.get('weight', 1.0)),
                    'directed': bool(edge_data.get('directed', False)),
                    'color': edge_data.get('color', '#95a5a6'),
                    'extra_data': edge_data.get('extra_data')
                }
            elif isinstance(edge_data, (list, tuple)) and len(edge_data) >= 2:
                # Handle simple format: [source_index, target_index]
                edge = {
                    'source_id': int(edge_data[0]),
                    'target_id': int(edge_data[1]),
                    'weight': float(edge_data[2]) if len(edge_data) > 2 else 1.0,
                    'directed': False,
                    'color': '#95a5a6'
                }
            else:
                continue
            
            # Validate edge indices
            if 0 <= edge['source_id'] < len(nodes) and 0 <= edge['target_id'] < len(nodes):
                edges.append(edge)
        
        return {
            'name': graph_name,
            'nodes': nodes,
            'edges': edges
        }
