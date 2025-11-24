"""
Initialize database and create tables
"""
import sys
from pathlib import Path

# Add backend directory to Python path if running as script
if __name__ == "__main__":
    backend_dir = Path(__file__).parent.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

from app.database.base import Base, engine
from app.models.graph import Graph, Node, Edge
from app.models.project import Project

def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()


