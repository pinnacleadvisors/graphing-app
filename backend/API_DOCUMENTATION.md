# API Documentation

## Base URL
- Local: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`

## Graph Endpoints

### GET /api/graphs
Get all graphs with pagination.

**Query Parameters:**
- `skip` (int, default: 0): Number of graphs to skip
- `limit` (int, default: 100): Maximum number of graphs to return

**Response:** `List[GraphSchema]`

### GET /api/graphs/{graph_id}
Get a specific graph by ID.

**Response:** `GraphSchema`

### POST /api/graphs
Create a new graph.

**Request Body:** `GraphCreateSchema`
```json
{
  "name": "My Graph",
  "nodes": [
    {
      "label": "Node 1",
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "color": "#3498db",
      "size": 1.0
    }
  ],
  "edges": []
}
```

**Response:** `GraphSchema` (201 Created)

### PUT /api/graphs/{graph_id}
Update an existing graph.

**Request Body:** `GraphUpdateSchema` (all fields optional)
```json
{
  "name": "Updated Graph Name",
  "nodes": [...],
  "edges": [...]
}
```

**Response:** `GraphSchema`

### DELETE /api/graphs/{graph_id}
Delete a graph and all its nodes and edges.

**Response:** 204 No Content

## Node Endpoints

### POST /api/graphs/{graph_id}/nodes
Add a node to a graph.

**Request Body:** `NodeSchema`
```json
{
  "label": "New Node",
  "x": 1.0,
  "y": 2.0,
  "z": 3.0,
  "color": "#3498db",
  "size": 1.0
}
```

**Response:** `NodeSchema` (201 Created)

### PUT /api/nodes/{node_id}
Update a node.

**Request Body:** `NodeSchema`

**Response:** `NodeSchema`

### DELETE /api/nodes/{node_id}
Delete a node and its associated edges.

**Response:** 204 No Content

## Edge Endpoints

### POST /api/graphs/{graph_id}/edges
Add an edge to a graph.

**Request Body:** `EdgeSchema`
```json
{
  "source_id": 1,
  "target_id": 2,
  "weight": 1.0,
  "directed": false,
  "color": "#95a5a6"
}
```

**Response:** `EdgeSchema` (201 Created)

### DELETE /api/edges/{edge_id}
Delete an edge.

**Response:** 204 No Content

## WebSocket Endpoint

### WS /ws/{graph_id}
Real-time updates for a specific graph.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/1');
```

**Message Types:**

**Client → Server:**
- `{"type": "ping"}` - Keep-alive ping
- `{"type": "node_moved", "node_id": 1, "x": 1.0, "y": 2.0, "z": 3.0}` - Node position update
- `{"type": "node_updated", ...}` - Node property update
- `{"type": "edge_updated", ...}` - Edge update
- `{"type": "graph_updated", ...}` - Graph update

**Server → Client:**
- `{"type": "pong"}` - Response to ping
- `{"type": "node_moved", ...}` - Broadcast node movement
- `{"type": "node_updated", ...}` - Broadcast node update
- `{"type": "edge_updated", ...}` - Broadcast edge update
- `{"type": "graph_updated", ...}` - Broadcast graph update
- `{"type": "error", "message": "..."}` - Error message

**Note:** Messages are broadcast to all connected clients for the same graph_id.

## Data Schemas

### GraphSchema
```python
{
  "id": int,
  "name": str,
  "nodes": List[NodeSchema],
  "edges": List[EdgeSchema],
  "created_at": datetime,
  "updated_at": datetime
}
```

### NodeSchema
```python
{
  "id": int (optional),
  "label": str,
  "x": float,
  "y": float,
  "z": float,
  "color": str (default: "#3498db"),
  "size": float (default: 1.0),
  "extra_data": dict (optional)
}
```

### EdgeSchema
```python
{
  "id": int (optional),
  "source_id": int,
  "target_id": int,
  "weight": float (default: 1.0),
  "directed": bool (default: false),
  "color": str (default: "#95a5a6"),
  "extra_data": dict (optional)
}
```

