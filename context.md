# 3D Graphing Web App - Technical Context

## Project Overview

A web application for creating, editing, and visualizing 3D graphs interactively, with AI-assisted graph generation capabilities. The application allows users to manipulate nodes and edges in a 3D space, save projects, and leverage AI to generate or modify graph structures.

## File Structure

```
graphing-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py            # Graph, Node, Edge SQLAlchemy models
│   │   │   └── project.py           # Project model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py            # Pydantic schemas for API
│   │   │   └── project.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── graphs.py       # Graph CRUD endpoints
│   │   │   │   ├── projects.py     # Project management endpoints
│   │   │   │   └── ai.py           # AI generation endpoints
│   │   │   └── websocket.py        # WebSocket handler
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── graph_service.py    # Graph business logic
│   │   │   ├── ai_service.py       # AI integration
│   │   │   └── code_executor.py    # Safe Python code execution
│   │   └── database/
│   │       ├── __init__.py
│   │       ├── base.py             # Database base and session
│   │       └── init_db.py          # Database initialization
│   ├── requirements.txt
│   ├── .env.example
│   └── alembic/                    # Database migrations
│       ├── versions/
│       └── env.py
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css
│   │   └── sidebar.css
│   ├── js/
│   │   ├── main.js                 # Main application entry
│   │   ├── scene.js                # Three.js scene setup
│   │   ├── graph-renderer.js       # Graph rendering logic
│   │   ├── node-manager.js         # Node creation/editing
│   │   ├── edge-manager.js         # Edge creation/editing
│   │   ├── ui-controller.js        # UI event handling
│   │   ├── api-client.js           # Backend API communication
│   │   ├── websocket-client.js     # WebSocket client
│   │   └── sidebar.js              # Sidebar project management
│   ├── assets/
│   │   └── (icons, images if needed)
│   └── package.json                # (if using npm for Three.js)
│
├── tests/
│   ├── backend/
│   │   ├── test_api.py
│   │   └── test_services.py
│   └── frontend/
│       └── (test files if needed)
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── nginx/
│   └── nginx.conf                   # Production nginx config
│
├── .gitignore
├── README.md
├── roadmap.md
├── context.md
└── requirements.txt                 # Root requirements (if needed)
```

## Data Schema

### Database Models

#### Project Table
```python
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    graph_id = Column(Integer, ForeignKey("graphs.id"), nullable=True)
    
    # Relationship
    graph = relationship("Graph", back_populates="project")
```

#### Graph Table
```python
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
```

#### Node Table
```python
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
    metadata = Column(JSON, nullable=True)  # Additional properties
    
    # Relationship
    graph = relationship("Graph", back_populates="nodes")
    source_edges = relationship("Edge", foreign_keys="Edge.source_id", back_populates="source")
    target_edges = relationship("Edge", foreign_keys="Edge.target_id", back_populates="target")
```

#### Edge Table
```python
class Edge(Base):
    __tablename__ = "edges"
    
    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("graphs.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    weight = Column(Float, default=1.0)
    directed = Column(Boolean, default=False)
    color = Column(String, default="#95a5a6")
    metadata = Column(JSON, nullable=True)
    
    # Relationships
    graph = relationship("Graph", back_populates="edges")
    source = relationship("Node", foreign_keys=[source_id], back_populates="source_edges")
    target = relationship("Node", foreign_keys=[target_id], back_populates="target_edges")
```

### API Data Schemas (Pydantic)

#### Graph Schema
```python
class NodeSchema(BaseModel):
    id: Optional[int] = None
    label: str
    x: float
    y: float
    z: float
    color: str = "#3498db"
    size: float = 1.0
    metadata: Optional[dict] = None

class EdgeSchema(BaseModel):
    id: Optional[int] = None
    source_id: int
    target_id: int
    weight: float = 1.0
    directed: bool = False
    color: str = "#95a5a6"
    metadata: Optional[dict] = None

class GraphSchema(BaseModel):
    id: Optional[int] = None
    name: str
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProjectSchema(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    graph: Optional[GraphSchema] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
```

## API Endpoints

### REST Endpoints

#### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/{project_id}` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/{project_id}` - Update project
- `DELETE /api/projects/{project_id}` - Delete project

#### Graphs
- `GET /api/graphs/{graph_id}` - Get graph data
- `POST /api/graphs` - Create new graph
- `PUT /api/graphs/{graph_id}` - Update graph
- `DELETE /api/graphs/{graph_id}` - Delete graph
- `POST /api/graphs/{graph_id}/nodes` - Add node to graph
- `PUT /api/nodes/{node_id}` - Update node
- `DELETE /api/nodes/{node_id}` - Delete node
- `POST /api/graphs/{graph_id}/edges` - Add edge to graph
- `DELETE /api/edges/{edge_id}` - Delete edge

#### AI
- `POST /api/ai/generate` - Generate new graph from description
  - Request: `{ "description": "Create a social network graph with 10 nodes" }`
  - Response: `GraphSchema`
- `POST /api/ai/modify` - Modify existing graph
  - Request: `{ "graph_id": 1, "instruction": "Add clustering layout" }`
  - Response: `GraphSchema`

### WebSocket Endpoint

- `WS /ws/{graph_id}` - Real-time updates for specific graph
  - Client can send: `{ "type": "node_moved", "node_id": 1, "x": 1.0, "y": 2.0, "z": 3.0 }`
  - Server broadcasts: `{ "type": "graph_updated", "data": {...} }`

## Technology Stack Details

### Backend

#### FastAPI
- **Why**: Modern, fast, async support, automatic API docs, WebSocket support
- **Installation**: `pip install fastapi uvicorn[standard]`
- **Key Features**: 
  - Automatic OpenAPI documentation
  - Type validation with Pydantic
  - Async/await support for WebSockets

#### SQLAlchemy
- **Why**: Mature ORM, supports SQLite and PostgreSQL
- **Installation**: `pip install sqlalchemy`
- **Database**: SQLite for local, PostgreSQL for production

#### WebSockets
- **Why**: Real-time bidirectional communication
- **Implementation**: FastAPI's built-in WebSocket support

### Frontend

#### Three.js
- **Why**: Most popular 3D library, excellent documentation, active community
- **Installation**: CDN or `npm install three`
- **Key Components**:
  - `Scene` - Container for 3D objects
  - `PerspectiveCamera` - 3D camera
  - `WebGLRenderer` - Rendering engine
  - `OrbitControls` - Mouse/touch controls
  - `SphereGeometry` / `BoxGeometry` - Node shapes
  - `Line` / `CylinderGeometry` - Edge visualization

#### Vanilla JavaScript
- **Why**: No framework overhead, full control, easier deployment
- **Alternative**: Could use React/Vue if needed later

### AI Integration

#### Option 1: OpenAI API
- **Pros**: High quality, easy integration
- **Cons**: Requires API key, costs money
- **Usage**: Generate Python code for graph layouts

#### Option 2: Ollama (Local)
- **Pros**: Free, runs locally, privacy
- **Cons**: Requires local setup, may be slower
- **Usage**: Same as OpenAI but local

#### Option 3: Hugging Face
- **Pros**: Open source models, free tier
- **Cons**: May require more setup

### Code Execution Safety

For executing AI-generated Python code:
- Use `subprocess` with restricted environment
- Timeout execution (e.g., 5 seconds)
- Limit imports (only allow networkx, numpy, etc.)
- Run in isolated process
- Validate output before applying to graph

## User Flow

1. **Initial Load**
   - User opens website
   - Frontend loads project list from API
   - If projects exist, show in sidebar
   - Initialize empty 3D scene

2. **Create/Edit Graph**
   - User clicks "New Project" or selects existing
   - 3D scene renders graph (or empty scene)
   - User clicks "Add Node" → node appears at cursor position
   - User drags node → position updates in real-time
   - User clicks two nodes → edge created between them
   - Changes auto-save to backend via API

3. **AI Generation**
   - User clicks "Generate Graph"
   - Modal opens with text input
   - User enters description: "Create a tree graph with 15 nodes"
   - Frontend sends request to `/api/ai/generate`
   - Backend calls AI service, generates Python code
   - Code executes, creates graph structure
   - Graph data returned to frontend
   - 3D scene updates with new graph

4. **Project Management**
   - Sidebar shows list of projects
   - User clicks project → loads graph
   - User can delete, rename projects
   - Projects persist in database

## Security Considerations

### Local Development
- SQLite database (file-based)
- No authentication needed
- CORS allows localhost only

### Production Deployment
- PostgreSQL with connection pooling
- JWT authentication (if multi-user)
- Input validation on all endpoints
- Rate limiting on AI endpoints
- Sanitize AI-generated code before execution
- HTTPS only
- Environment variables for secrets

## Performance Considerations

### Frontend
- Use `requestAnimationFrame` for smooth rendering
- Implement frustum culling (only render visible nodes)
- Use instanced rendering for many similar nodes
- Debounce auto-save API calls
- Lazy load project thumbnails

### Backend
- Database connection pooling
- Index database columns (graph_id, project_id)
- Cache frequently accessed graphs
- Use async endpoints where possible
- Batch WebSocket updates

### Graph Size Limits
- Recommend max 500 nodes for smooth performance
- Warn user if graph exceeds 1000 nodes
- Offer graph simplification options

## Development Workflow

### Local Setup
1. Create virtual environment: `python -m venv venv`
2. Activate: `source venv/bin/activate` (Mac/Linux)
3. Install backend: `pip install -r backend/requirements.txt`
4. Initialize database: `python backend/app/database/init_db.py`
5. Run backend: `uvicorn backend.app.main:app --reload`
6. Open frontend: Serve `frontend/` with simple HTTP server or open `index.html`

### Testing
- Use FastAPI's TestClient for API tests
- Test with various graph sizes
- Test AI generation with different prompts
- Test WebSocket connections

### Deployment
- Use Docker for consistent environments
- Set up CI/CD pipeline
- Use managed PostgreSQL (e.g., Supabase, Railway)
- Deploy backend to cloud platform
- Serve frontend via CDN or same server with Nginx

## Future Enhancements

- Graph algorithms visualization (BFS, DFS, shortest path)
- Export graphs as images/3D models
- Collaborative editing (multiple users on same graph)
- Graph templates and presets
- Advanced AI features (graph analysis, recommendations)
- Mobile app version
- Graph animation and transitions
- Custom node/edge styling options

