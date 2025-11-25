# Graph Generation Template for ChatGPT/Claude

This template helps you generate Python code for creating 3D graphs that can be used in the 3D Graphing App.

## How to Use

1. Copy the template below
2. Paste it into ChatGPT, Claude, or any AI chat interface
3. Describe the graph you want to create
4. Copy the generated Python code
5. Paste it into the "Generate Graph" dialog in the app

## Template

```
I need Python code to generate a 3D graph structure. The code should:

1. Use networkx (imported as nx) and numpy (imported as np) for graph operations
2. Create nodes with 3D positions (x, y, z coordinates)
3. Create edges connecting nodes
4. Return a dictionary with 'nodes' and 'edges' keys

Node format:
- Each node should be a dict with: label (str), x (float), y (float), z (float), color (hex string, optional), size (float, optional)

Edge format:
- Each edge should be a dict with: source_id (int, index into nodes list), target_id (int), weight (float, optional), directed (bool, optional), color (hex string, optional)

Example output structure:
```python
result = {
    "nodes": [
        {"label": "Node 1", "x": 0.0, "y": 0.0, "z": 0.0, "color": "#3498db", "size": 1.0},
        {"label": "Node 2", "x": 1.0, "y": 1.0, "z": 1.0, "color": "#e74c3c", "size": 1.0}
    ],
    "edges": [
        {"source_id": 0, "target_id": 1, "weight": 1.0, "directed": False, "color": "#95a5a6"}
    ]
}
```

Generate ONLY the Python code (no markdown, no explanations). The code should assign the result to a variable called 'result'.

Now, generate code for: [DESCRIBE YOUR GRAPH HERE]
```

## Example Prompts

### Example 1: Social Network Graph
```
Generate code for a social network graph with 10 nodes arranged in a circle, where each node is connected to its 2 nearest neighbors on each side.
```

### Example 2: Tree Structure
```
Generate code for a binary tree with 15 nodes, arranged in 4 levels. Use different colors for each level.
```

### Example 3: Random Graph
```
Generate code for a random graph with 20 nodes and 30 edges, with nodes positioned randomly in 3D space within a cube from -5 to 5.
```

### Example 4: Grid Graph
```
Generate code for a 3x3x3 3D grid graph (27 nodes total), where each node is connected to its 6 neighbors (up, down, left, right, forward, backward).
```

### Example 5: Star Graph
```
Generate code for a star graph with 1 central node and 8 surrounding nodes arranged in a sphere around it.
```

## Code Requirements

- **Allowed imports**: `networkx`, `numpy`, `math`, `random`, `json`
- **Output format**: Must assign result to variable `result`
- **Node indices**: Edge `source_id` and `target_id` must reference indices in the nodes list (0-based)
- **Coordinates**: All x, y, z values should be floats
- **Colors**: Use hex color codes (e.g., "#3498db")

## Tips

1. **Layout algorithms**: You can use networkx layout algorithms and convert them to 3D:
   ```python
   import networkx as nx
   import numpy as np
   
   G = nx.karate_club_graph()
   pos_2d = nx.spring_layout(G)
   
   # Convert to 3D by adding z=0 or using a 3D layout
   nodes = []
   for i, (node_id, (x, y)) in enumerate(pos_2d.items()):
       nodes.append({
           "label": f"Node {node_id}",
           "x": float(x),
           "y": float(y),
           "z": 0.0,
           "color": "#3498db"
       })
   ```

2. **3D layouts**: For true 3D layouts, you can:
   - Use spherical coordinates
   - Use random 3D positions
   - Use mathematical functions (sine waves, spirals, etc.)

3. **Visual variety**: Use different colors and sizes to make graphs more visually interesting

4. **Edge weights**: You can assign weights to edges to represent relationships

## Troubleshooting

- **"No output from code execution"**: Make sure your code assigns the result to a variable called `result`
- **"Import not allowed"**: Only use allowed imports (networkx, numpy, math, random, json)
- **"Blocked operation detected"**: Don't use file operations, system calls, or eval/exec
- **"Index out of range"**: Make sure edge source_id and target_id reference valid node indices

