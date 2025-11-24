"""
Pydantic schemas for Project API
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.graph import GraphSchema


class ProjectSchema(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    graph: Optional[GraphSchema] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


