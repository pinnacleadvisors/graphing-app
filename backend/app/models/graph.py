"""
Graph, Node, and Edge database models
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base


class Graph(Base):
    __tablename__ = "graphs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    nodes = relationship("Node", back_populates="graph", cascade="all, delete-orphan")
    edges = relationship("Edge", back_populates="graph", cascade="all, delete-orphan")
    project = relationship("Project", back_populates="graph", uselist=False)


class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("graphs.id"), nullable=False)
    label = Column(String, nullable=False)
    x = Column(Float, nullable=False, default=0.0)
    y = Column(Float, nullable=False, default=0.0)
    z = Column(Float, nullable=False, default=0.0)
    color = Column(String, default="#3498db")  # Hex color
    size = Column(Float, default=1.0)
    extra_data = Column(JSON, nullable=True)  # Additional properties
    
    # Relationships
    graph = relationship("Graph", back_populates="nodes")
    source_edges = relationship("Edge", foreign_keys="[Edge.source_id]", back_populates="source")
    target_edges = relationship("Edge", foreign_keys="[Edge.target_id]", back_populates="target")


class Edge(Base):
    __tablename__ = "edges"
    
    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("graphs.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    weight = Column(Float, default=1.0)
    directed = Column(Boolean, default=False)
    color = Column(String, default="#95a5a6")
    extra_data = Column(JSON, nullable=True)
    
    # Relationships
    graph = relationship("Graph", back_populates="edges")
    source = relationship("Node", foreign_keys=[source_id], back_populates="source_edges")
    target = relationship("Node", foreign_keys=[target_id], back_populates="target_edges")

