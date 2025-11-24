"""
Graph business logic service
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.graph import Graph, Node, Edge
from app.schemas.graph import GraphSchema, NodeSchema, EdgeSchema
from datetime import datetime


class GraphService:
    """Service for graph operations"""
    
    @staticmethod
    def get_graph(db: Session, graph_id: int) -> Optional[Graph]:
        """Get a graph by ID"""
        return db.query(Graph).filter(Graph.id == graph_id).first()
    
    @staticmethod
    def get_all_graphs(db: Session, skip: int = 0, limit: int = 100) -> List[Graph]:
        """Get all graphs with pagination"""
        return db.query(Graph).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_graph(db: Session, graph_data: GraphSchema) -> Graph:
        """Create a new graph with nodes and edges"""
        # Create graph
        graph = Graph(name=graph_data.name)
        db.add(graph)
        db.flush()  # Get graph ID
        
        # Create nodes
        node_map = {}  # Map old node IDs to new node objects
        for node_data in graph_data.nodes:
            node = Node(
                graph_id=graph.id,
                label=node_data.label,
                x=node_data.x,
                y=node_data.y,
                z=node_data.z,
                color=node_data.color,
                size=node_data.size,
                extra_data=node_data.extra_data
            )
            db.add(node)
            db.flush()
            # Store mapping if original node had an ID
            if node_data.id is not None:
                node_map[node_data.id] = node
        
        # Create edges
        for edge_data in graph_data.edges:
            # Map source and target IDs
            source_node = node_map.get(edge_data.source_id)
            target_node = node_map.get(edge_data.target_id)
            
            if source_node and target_node:
                edge = Edge(
                    graph_id=graph.id,
                    source_id=source_node.id,
                    target_id=target_node.id,
                    weight=edge_data.weight,
                    directed=edge_data.directed,
                    color=edge_data.color,
                    extra_data=edge_data.extra_data
                )
                db.add(edge)
        
        db.commit()
        db.refresh(graph)
        return graph
    
    @staticmethod
    def update_graph(db: Session, graph_id: int, graph_data: GraphSchema) -> Optional[Graph]:
        """Update an existing graph"""
        graph = db.query(Graph).filter(Graph.id == graph_id).first()
        if not graph:
            return None
        
        graph.name = graph_data.name
        graph.updated_at = datetime.utcnow()
        
        # Delete existing nodes and edges
        db.query(Node).filter(Node.graph_id == graph_id).delete()
        db.query(Edge).filter(Edge.graph_id == graph_id).delete()
        
        # Create new nodes
        node_map = {}
        for node_data in graph_data.nodes:
            node = Node(
                graph_id=graph.id,
                label=node_data.label,
                x=node_data.x,
                y=node_data.y,
                z=node_data.z,
                color=node_data.color,
                size=node_data.size,
                extra_data=node_data.extra_data
            )
            db.add(node)
            db.flush()
            if node_data.id is not None:
                node_map[node_data.id] = node
        
        # Create new edges
        for edge_data in graph_data.edges:
            source_node = node_map.get(edge_data.source_id)
            target_node = node_map.get(edge_data.target_id)
            
            if source_node and target_node:
                edge = Edge(
                    graph_id=graph.id,
                    source_id=source_node.id,
                    target_id=target_node.id,
                    weight=edge_data.weight,
                    directed=edge_data.directed,
                    color=edge_data.color,
                    extra_data=edge_data.extra_data
                )
                db.add(edge)
        
        db.commit()
        db.refresh(graph)
        return graph
    
    @staticmethod
    def delete_graph(db: Session, graph_id: int) -> bool:
        """Delete a graph and all its nodes and edges"""
        graph = db.query(Graph).filter(Graph.id == graph_id).first()
        if not graph:
            return False
        
        db.delete(graph)
        db.commit()
        return True
    
    @staticmethod
    def add_node(db: Session, graph_id: int, node_data: NodeSchema) -> Optional[Node]:
        """Add a node to a graph"""
        graph = db.query(Graph).filter(Graph.id == graph_id).first()
        if not graph:
            return None
        
        node = Node(
            graph_id=graph_id,
            label=node_data.label,
            x=node_data.x,
            y=node_data.y,
            z=node_data.z,
            color=node_data.color,
            size=node_data.size,
            extra_data=node_data.extra_data
        )
        db.add(node)
        graph.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(node)
        return node
    
    @staticmethod
    def update_node(db: Session, node_id: int, node_data: NodeSchema) -> Optional[Node]:
        """Update a node"""
        node = db.query(Node).filter(Node.id == node_id).first()
        if not node:
            return None
        
        node.label = node_data.label
        node.x = node_data.x
        node.y = node_data.y
        node.z = node_data.z
        node.color = node_data.color
        node.size = node_data.size
        node.extra_data = node_data.extra_data
        
        # Update graph's updated_at
        graph = db.query(Graph).filter(Graph.id == node.graph_id).first()
        if graph:
            graph.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(node)
        return node
    
    @staticmethod
    def delete_node(db: Session, node_id: int) -> bool:
        """Delete a node and its associated edges"""
        node = db.query(Node).filter(Node.id == node_id).first()
        if not node:
            return False
        
        graph_id = node.graph_id
        db.delete(node)
        
        # Update graph's updated_at
        graph = db.query(Graph).filter(Graph.id == graph_id).first()
        if graph:
            graph.updated_at = datetime.utcnow()
        
        db.commit()
        return True
    
    @staticmethod
    def add_edge(db: Session, graph_id: int, edge_data: EdgeSchema) -> Optional[Edge]:
        """Add an edge to a graph"""
        graph = db.query(Graph).filter(Graph.id == graph_id).first()
        if not graph:
            return None
        
        # Verify source and target nodes exist and belong to the graph
        source = db.query(Node).filter(
            Node.id == edge_data.source_id,
            Node.graph_id == graph_id
        ).first()
        target = db.query(Node).filter(
            Node.id == edge_data.target_id,
            Node.graph_id == graph_id
        ).first()
        
        if not source or not target:
            return None
        
        edge = Edge(
            graph_id=graph_id,
            source_id=edge_data.source_id,
            target_id=edge_data.target_id,
            weight=edge_data.weight,
            directed=edge_data.directed,
            color=edge_data.color,
            extra_data=edge_data.extra_data
        )
        db.add(edge)
        graph.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(edge)
        return edge
    
    @staticmethod
    def delete_edge(db: Session, edge_id: int) -> bool:
        """Delete an edge"""
        edge = db.query(Edge).filter(Edge.id == edge_id).first()
        if not edge:
            return False
        
        graph_id = edge.graph_id
        db.delete(edge)
        
        # Update graph's updated_at
        graph = db.query(Graph).filter(Graph.id == graph_id).first()
        if graph:
            graph.updated_at = datetime.utcnow()
        
        db.commit()
        return True
