"""
FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import graphs, projects, ai

app = FastAPI(title="3D Graphing API", version="0.1.0")

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(graphs.router)
app.include_router(projects.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    return {"message": "3D Graphing API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

