"""
Graph CRUD endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.base import get_db
from app.models.graph import Graph, Node, Edge
from app.schemas.graph import GraphSchema, NodeSchema, EdgeSchema

router = APIRouter(prefix="/api/graphs", tags=["graphs"])

# Placeholder routes - will be implemented in Phase 1.2
@router.get("/{graph_id}", response_model=GraphSchema)
async def get_graph(graph_id: int, db: Session = Depends(get_db)):
    """Get graph by ID"""
    graph = db.query(Graph).filter(Graph.id == graph_id).first()
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found")
    return graph


