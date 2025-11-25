"""
Project management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.base import get_db
from app.models.project import Project
from app.schemas.project import (
    ProjectSchema,
    ProjectCreateSchema,
    ProjectUpdateSchema
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=List[ProjectSchema])
async def get_all_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all projects with optional search/filter"""
    projects = ProjectService.get_all_projects(db, skip=skip, limit=limit, search=search)
    return projects


@router.get("/{project_id}", response_model=ProjectSchema)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get project by ID with its graph"""
    project = ProjectService.get_project_with_graph(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.post("", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreateSchema,
    db: Session = Depends(get_db)
):
    """Create a new project"""
    project = ProjectService.create_project(db, project_data)
    return project


@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: int,
    project_data: ProjectUpdateSchema,
    db: Session = Depends(get_db)
):
    """Update an existing project"""
    project = ProjectService.update_project(db, project_id, project_data)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project"""
    success = ProjectService.delete_project(db, project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )


@router.get("/{project_id}/metadata")
async def get_project_metadata(project_id: int, db: Session = Depends(get_db)):
    """Get project metadata (node count, edge count, etc.)"""
    project = ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return ProjectService.get_project_metadata(project)


