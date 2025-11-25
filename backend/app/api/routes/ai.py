"""
AI generation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database.base import get_db
from app.services.ai_service import AIService
from app.services.graph_service import GraphService
from app.schemas.graph import GraphSchema


router = APIRouter(prefix="/api/ai", tags=["ai"])


class GenerateRequest(BaseModel):
    """Request for graph generation"""
    description: str
    graph_name: Optional[str] = "AI Generated Graph"


class ModifyRequest(BaseModel):
    """Request for graph modification"""
    graph_id: int
    instruction: str


class ExecuteCodeRequest(BaseModel):
    """Request to execute Python code directly"""
    code: str
    graph_name: Optional[str] = "AI Generated Graph"


class GenerateResponse(BaseModel):
    """Response for graph generation"""
    success: bool
    graph: Optional[GraphSchema] = None
    prompt: Optional[str] = None  # Prompt for manual generation if AI not configured
    error: Optional[str] = None


@router.post("/generate", response_model=GenerateResponse)
async def generate_graph(
    request: GenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a new graph from a text description.
    
    If AI is configured, it will generate the graph automatically.
    If not, it returns a prompt that can be used with ChatGPT/Claude.
    """
    try:
        success, graph_data, error_or_prompt = await AIService.generate_graph_from_description(
            request.description
        )
        
        if success and graph_data:
            # Create graph in database
            graph_schema = GraphSchema(**graph_data)
            graph = GraphService.create_graph(db, graph_schema)
            return GenerateResponse(
                success=True,
                graph=GraphSchema.model_validate(graph)
            )
        else:
            # AI not configured, return prompt for manual generation
            return GenerateResponse(
                success=False,
                prompt=error_or_prompt,
                error="AI service not configured. Use the provided prompt with ChatGPT/Claude."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate graph: {str(e)}"
        )


@router.post("/modify", response_model=GenerateResponse)
async def modify_graph(
    request: ModifyRequest,
    db: Session = Depends(get_db)
):
    """
    Modify an existing graph based on an instruction.
    
    If AI is configured, it will modify the graph automatically.
    If not, it returns a prompt that can be used with ChatGPT/Claude.
    """
    try:
        # Get current graph
        graph = GraphService.get_graph(db, request.graph_id)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Graph {request.graph_id} not found"
            )
        
        # Convert to dict format
        current_graph = {
            "nodes": [
                {
                    "label": node.label,
                    "x": node.x,
                    "y": node.y,
                    "z": node.z,
                    "color": node.color,
                    "size": node.size,
                    "extra_data": node.extra_data
                }
                for node in graph.nodes
            ],
            "edges": [
                {
                    "source_id": edge.source_id,
                    "target_id": edge.target_id,
                    "weight": edge.weight,
                    "directed": edge.directed,
                    "color": edge.color,
                    "extra_data": edge.extra_data
                }
                for edge in graph.edges
            ]
        }
        
        success, graph_data, error_or_prompt = await AIService.modify_graph_from_instruction(
            request.instruction,
            current_graph
        )
        
        if success and graph_data:
            # Update graph in database
            graph_schema = GraphSchema(**graph_data)
            graph = GraphService.update_graph(db, request.graph_id, graph_schema)
            return GenerateResponse(
                success=True,
                graph=GraphSchema.model_validate(graph)
            )
        else:
            # AI not configured, return prompt for manual generation
            return GenerateResponse(
                success=False,
                prompt=error_or_prompt,
                error="AI service not configured. Use the provided prompt with ChatGPT/Claude."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to modify graph: {str(e)}"
        )


@router.post("/execute-code", response_model=GenerateResponse)
async def execute_code(
    request: ExecuteCodeRequest,
    db: Session = Depends(get_db)
):
    """
    Execute Python code directly to generate a graph.
    
    This endpoint allows users to paste code generated from ChatGPT/Claude
    or write their own code.
    
    The code should assign a 'result' variable with 'nodes' and 'edges' keys.
    """
    try:
        success, graph_data, error = AIService.execute_generated_code(
            request.code,
            request.graph_name
        )
        
        if not success:
            return GenerateResponse(
                success=False,
                error=error
            )
        
        # Create graph in database
        graph_schema = GraphSchema(**graph_data)
        graph = GraphService.create_graph(db, graph_schema)
        
        return GenerateResponse(
            success=True,
            graph=GraphSchema.model_validate(graph)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute code: {str(e)}"
        )


@router.get("/template")
async def get_generation_template():
    """
    Get the template for manual code generation.
    Returns instructions and examples for generating code via ChatGPT/Claude.
    """
    return {
        "template": """
I need Python code to generate a 3D graph structure. The code should:

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
result = {
    "nodes": [
        {"label": "Node 1", "x": 0.0, "y": 0.0, "z": 0.0, "color": "#3498db", "size": 1.0},
        {"label": "Node 2", "x": 1.0, "y": 1.0, "z": 1.0, "color": "#e74c3c", "size": 1.0}
    ],
    "edges": [
        {"source_id": 0, "target_id": 1, "weight": 1.0, "directed": False, "color": "#95a5a6"}
    ]
}
```

Generate ONLY the Python code (no markdown, no explanations). The code should assign the result to a variable called 'result'.
""",
        "examples": [
            "Generate code for a social network graph with 10 nodes arranged in a circle",
            "Generate code for a binary tree with 15 nodes, arranged in 4 levels",
            "Generate code for a random graph with 20 nodes and 30 edges",
            "Generate code for a 3x3x3 3D grid graph (27 nodes total)",
            "Generate code for a star graph with 1 central node and 8 surrounding nodes"
        ],
        "allowed_imports": ["networkx", "numpy", "math", "random", "json"],
        "requirements": [
            "Code must assign result to variable 'result'",
            "Result must be a dict with 'nodes' and 'edges' keys",
            "Node indices in edges must reference valid node list indices",
            "Only use allowed imports"
        ]
    }
