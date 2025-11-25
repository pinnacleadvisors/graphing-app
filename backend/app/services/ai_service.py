"""
AI integration service for graph generation
Supports both AI API integration and manual code generation via templates
"""
import os
from typing import Optional, Dict, Any
from app.services.code_executor import CodeExecutor


class AIService:
    """Service for AI-powered graph generation"""
    
    # Prompt templates for graph generation
    GENERATION_PROMPT_TEMPLATE = """Generate Python code to create a 3D graph structure based on this description:

{description}

Requirements:
1. Use networkx (imported as nx) and numpy (imported as np) for graph operations
2. Create nodes with 3D positions (x, y, z coordinates)
3. Create edges connecting nodes
4. Return a dictionary with 'nodes' and 'edges' keys

Node format:
- Each node should be a dict with: label (str), x (float), y (float), z (float), color (hex string, optional), size (float, optional)

Edge format:
- Each edge should be a dict with: source_id (int, index into nodes list), target_id (int), weight (float, optional), directed (bool, optional), color (hex string, optional)

Example output structure:
```python
result = {{
    "nodes": [
        {{"label": "Node 1", "x": 0.0, "y": 0.0, "z": 0.0, "color": "#3498db", "size": 1.0}},
        {{"label": "Node 2", "x": 1.0, "y": 1.0, "z": 1.0, "color": "#e74c3c", "size": 1.0}}
    ],
    "edges": [
        {{"source_id": 0, "target_id": 1, "weight": 1.0, "directed": False, "color": "#95a5a6"}}
    ]
}}
```

Generate ONLY the Python code (no markdown, no explanations). The code should assign the result to a variable called 'result'.
"""
    
    MODIFICATION_PROMPT_TEMPLATE = """Modify this existing graph structure based on the instruction:

Current graph:
- Nodes: {node_count} nodes
- Edges: {edge_count} edges
- Node labels: {node_labels}

Instruction: {instruction}

Requirements:
1. Use networkx (imported as nx) and numpy (imported as np) for graph operations
2. Modify the existing graph structure according to the instruction
3. Return a dictionary with 'nodes' and 'edges' keys in the same format as before

Node format:
- Each node should be a dict with: label (str), x (float), y (float), z (float), color (hex string, optional), size (float, optional)

Edge format:
- Each edge should be a dict with: source_id (int, index into nodes list), target_id (int), weight (float, optional), directed (bool, optional), color (hex string, optional)

Generate ONLY the Python code (no markdown, no explanations). The code should assign the result to a variable called 'result'.
"""
    
    @staticmethod
    def generate_prompt(description: str) -> str:
        """Generate a prompt for graph generation"""
        return AIService.GENERATION_PROMPT_TEMPLATE.format(description=description)
    
    @staticmethod
    def generate_modification_prompt(instruction: str, current_graph: Dict[str, Any]) -> str:
        """Generate a prompt for graph modification"""
        nodes = current_graph.get('nodes', [])
        edges = current_graph.get('edges', [])
        node_labels = [node.get('label', f'Node {i}') for i, node in enumerate(nodes)]
        
        return AIService.MODIFICATION_PROMPT_TEMPLATE.format(
            instruction=instruction,
            node_count=len(nodes),
            edge_count=len(edges),
            node_labels=', '.join(node_labels[:10]) + ('...' if len(node_labels) > 10 else '')
        )
    
    @staticmethod
    async def generate_graph_from_description(description: str) -> tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Generate graph from description using AI (if configured) or return prompt for manual generation
        
        Returns: (success, graph_data, error_or_prompt)
        If AI is not configured, returns the prompt that can be used with ChatGPT
        """
        # Check if AI API is configured
        ai_provider = os.getenv('AI_PROVIDER', '').lower()
        api_key = os.getenv('AI_API_KEY', '')
        
        if not ai_provider or not api_key:
            # Return prompt for manual generation
            prompt = AIService.generate_prompt(description)
            return False, None, prompt
        
        # TODO: Implement actual AI API calls (OpenAI, Ollama, etc.)
        # For now, return prompt for manual use
        prompt = AIService.generate_prompt(description)
        return False, None, prompt
    
    @staticmethod
    async def modify_graph_from_instruction(instruction: str, current_graph: Dict[str, Any]) -> tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Modify graph from instruction using AI (if configured) or return prompt for manual generation
        
        Returns: (success, graph_data, error_or_prompt)
        """
        # Check if AI API is configured
        ai_provider = os.getenv('AI_PROVIDER', '').lower()
        api_key = os.getenv('AI_API_KEY', '')
        
        if not ai_provider or not api_key:
            # Return prompt for manual generation
            prompt = AIService.generate_modification_prompt(instruction, current_graph)
            return False, None, prompt
        
        # TODO: Implement actual AI API calls
        prompt = AIService.generate_modification_prompt(instruction, current_graph)
        return False, None, prompt
    
    @staticmethod
    def execute_generated_code(code: str, graph_name: str = "AI Generated Graph") -> tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Execute AI-generated Python code and return graph data
        
        Returns: (success, graph_data, error_message)
        """
        success, graph_data, error = CodeExecutor.execute_code(code)
        
        if not success:
            return False, None, error
        
        # Convert to GraphSchema format
        graph_schema = CodeExecutor.convert_to_graph_schema(graph_data, graph_name)
        return True, graph_schema, None
