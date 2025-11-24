"""
Graph CRUD endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.base import get_db
from app.models.graph import Graph, Node, Edge
from app.schemas.graph import (
    GraphSchema, 
    GraphCreateSchema, 
    GraphUpdateSchema,
    NodeSchema,
    EdgeSchema
)
from app.services.graph_service import GraphService

router = APIRouter(prefix="/api/graphs", tags=["graphs"])


@router.get("", response_model=List[GraphSchema])
async def get_all_graphs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all graphs with pagination"""
    graphs = GraphService.get_all_graphs(db, skip=skip, limit=limit)
    return graphs


@router.get("/{graph_id}", response_model=GraphSchema)
async def get_graph(graph_id: int, db: Session = Depends(get_db)):
    """Get graph by ID"""
    graph = GraphService.get_graph(db, graph_id)
    if not graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Graph not found"
        )
    return graph


@router.post("", response_model=GraphSchema, status_code=status.HTTP_201_CREATED)
async def create_graph(
    graph_data: GraphCreateSchema,
    db: Session = Depends(get_db)
):
    """Create a new graph"""
    graph_schema = GraphSchema(
        name=graph_data.name,
        nodes=graph_data.nodes,
        edges=graph_data.edges
    )
    graph = GraphService.create_graph(db, graph_schema)
    return graph


@router.put("/{graph_id}", response_model=GraphSchema)
async def update_graph(
    graph_id: int,
    graph_data: GraphUpdateSchema,
    db: Session = Depends(get_db)
):
    """Update an existing graph"""
    existing_graph = GraphService.get_graph(db, graph_id)
    if not existing_graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Graph not found"
        )
    
    # Merge update data with existing graph
    update_dict = graph_data.model_dump(exclude_unset=True)
    
    # Use provided nodes/edges or convert existing ones to schemas
    if "nodes" in update_dict:
        nodes = [NodeSchema.model_validate(node) for node in update_dict["nodes"]]
    else:
        nodes = [NodeSchema.model_validate(node) for node in existing_graph.nodes]
    
    if "edges" in update_dict:
        edges = [EdgeSchema.model_validate(edge) for edge in update_dict["edges"]]
    else:
        edges = [EdgeSchema.model_validate(edge) for edge in existing_graph.edges]
    
    name = update_dict.get("name", existing_graph.name)
    
    graph_schema = GraphSchema(
        name=name,
        nodes=nodes,
        edges=edges
    )
    
    graph = GraphService.update_graph(db, graph_id, graph_schema)
    return graph


@router.delete("/{graph_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_graph(graph_id: int, db: Session = Depends(get_db)):
    """Delete a graph"""
    success = GraphService.delete_graph(db, graph_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Graph not found"
        )


# Node endpoints
@router.post("/{graph_id}/nodes", response_model=NodeSchema, status_code=status.HTTP_201_CREATED)
async def add_node(
    graph_id: int,
    node_data: NodeSchema,
    db: Session = Depends(get_db)
):
    """Add a node to a graph"""
    node = GraphService.add_node(db, graph_id, node_data)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Graph not found"
        )
    return node


@router.put("/nodes/{node_id}", response_model=NodeSchema)
async def update_node(
    node_id: int,
    node_data: NodeSchema,
    db: Session = Depends(get_db)
):
    """Update a node"""
    node = GraphService.update_node(db, node_id, node_data)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    return node


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(node_id: int, db: Session = Depends(get_db)):
    """Delete a node"""
    success = GraphService.delete_node(db, node_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )


# Edge endpoints
@router.post("/{graph_id}/edges", response_model=EdgeSchema, status_code=status.HTTP_201_CREATED)
async def add_edge(
    graph_id: int,
    edge_data: EdgeSchema,
    db: Session = Depends(get_db)
):
    """Add an edge to a graph"""
    edge = GraphService.add_edge(db, graph_id, edge_data)
    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Graph not found or invalid source/target nodes"
        )
    return edge


@router.delete("/edges/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_edge(edge_id: int, db: Session = Depends(get_db)):
    """Delete an edge"""
    success = GraphService.delete_edge(db, edge_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edge not found"
        )
