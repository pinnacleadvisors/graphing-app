"""
Pydantic schemas for Graph API
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class NodeSchema(BaseModel):
    id: Optional[int] = None
    label: str
    x: float
    y: float
    z: float
    color: str = "#3498db"
    size: float = 1.0
    extra_data: Optional[dict] = None

    class Config:
        from_attributes = True


class EdgeSchema(BaseModel):
    id: Optional[int] = None
    source_id: int
    target_id: int
    weight: float = 1.0
    directed: bool = False
    color: str = "#95a5a6"
    extra_data: Optional[dict] = None

    class Config:
        from_attributes = True


class GraphSchema(BaseModel):
    id: Optional[int] = None
    name: str
    nodes: List[NodeSchema] = []
    edges: List[EdgeSchema] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GraphCreateSchema(BaseModel):
    name: str
    nodes: List[NodeSchema] = []
    edges: List[EdgeSchema] = []


class GraphUpdateSchema(BaseModel):
    name: Optional[str] = None
    nodes: Optional[List[NodeSchema]] = None
    edges: Optional[List[EdgeSchema]] = None


