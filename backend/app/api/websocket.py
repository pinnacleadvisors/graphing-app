"""
WebSocket handler for real-time updates
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json


class ConnectionManager:
    """Manages WebSocket connections per graph"""
    def __init__(self):
        # Map graph_id to set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, graph_id: int):
        """Accept connection and add to graph's connection set"""
        await websocket.accept()
        if graph_id not in self.active_connections:
            self.active_connections[graph_id] = set()
        self.active_connections[graph_id].add(websocket)

    def disconnect(self, websocket: WebSocket, graph_id: int):
        """Remove connection from graph's connection set"""
        if graph_id in self.active_connections:
            self.active_connections[graph_id].discard(websocket)
            # Clean up empty sets
            if not self.active_connections[graph_id]:
                del self.active_connections[graph_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to a specific connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")

    async def broadcast_to_graph(self, graph_id: int, message: dict):
        """Broadcast message to all connections for a specific graph"""
        if graph_id not in self.active_connections:
            return
        
        disconnected = set()
        for connection in self.active_connections[graph_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, graph_id)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, graph_id: int):
    """WebSocket endpoint for real-time graph updates"""
    await manager.connect(websocket, graph_id)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                # Handle different message types
                if message_type == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
                elif message_type in ["node_moved", "node_updated", "edge_updated", "graph_updated"]:
                    # Broadcast update to all other connections for this graph
                    await manager.broadcast_to_graph(graph_id, message)
                else:
                    # Echo back unknown message types
                    await manager.send_personal_message(
                        {"type": "error", "message": f"Unknown message type: {message_type}"},
                        websocket
                    )
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {"type": "error", "message": "Invalid JSON"},
                    websocket
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket, graph_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, graph_id)
