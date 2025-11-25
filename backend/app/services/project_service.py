"""
Project business logic service
"""
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.project import Project
from app.models.graph import Graph
from app.schemas.project import ProjectSchema, ProjectCreateSchema, ProjectUpdateSchema
from app.schemas.graph import GraphSchema
from datetime import datetime


class ProjectService:
    """Service for project operations"""
    
    @staticmethod
    def get_project(db: Session, project_id: int) -> Optional[Project]:
        """Get a project by ID with its graph"""
        project = db.query(Project).filter(Project.id == project_id).first()
        return project
    
    @staticmethod
    def get_all_projects(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> List[Project]:
        """Get all projects with optional search/filter"""
        query = db.query(Project)
        
        if search:
            query = query.filter(Project.name.ilike(f"%{search}%"))
        
        return query.order_by(Project.updated_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_project(db: Session, project_data: ProjectCreateSchema) -> Project:
        """Create a new project with an empty graph"""
        # Create an empty graph for the project
        graph = Graph(name=f"Graph for {project_data.name}")
        db.add(graph)
        db.flush()  # Get graph ID
        
        # Create project
        project = Project(
            name=project_data.name,
            description=project_data.description,
            graph_id=graph.id
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project
    
    @staticmethod
    def update_project(db: Session, project_id: int, project_data: ProjectUpdateSchema) -> Optional[Project]:
        """Update an existing project"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None
        
        update_dict = project_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(project, field, value)
        
        project.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(project)
        return project
    
    @staticmethod
    def delete_project(db: Session, project_id: int) -> bool:
        """Delete a project and its associated graph"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False
        
        # Delete the associated graph (cascade will handle nodes and edges)
        if project.graph_id:
            graph = db.query(Graph).filter(Graph.id == project.graph_id).first()
            if graph:
                db.delete(graph)
        
        db.delete(project)
        db.commit()
        return True
    
    @staticmethod
    def get_project_with_graph(db: Session, project_id: int) -> Optional[Project]:
        """Get a project with its graph data loaded"""
        project = db.query(Project).options(
            joinedload(Project.graph).joinedload(Graph.nodes),
            joinedload(Project.graph).joinedload(Graph.edges)
        ).filter(Project.id == project_id).first()
        return project
    
    @staticmethod
    def get_project_metadata(project: Project) -> dict:
        """Get project metadata (node count, edge count, etc.)"""
        metadata = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "node_count": 0,
            "edge_count": 0
        }
        
        if project.graph:
            metadata["node_count"] = len(project.graph.nodes) if project.graph.nodes else 0
            metadata["edge_count"] = len(project.graph.edges) if project.graph.edges else 0
            metadata["graph_id"] = project.graph.id
        
        return metadata

