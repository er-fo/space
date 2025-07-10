LLM Handbook: CAD Memory JSON Specification

This handbook defines how you, the LLM, must write structured JSON plans to describe 3D models, edits, and operations. It supports persistent, interpretable memory of geometry for a CAD system. You must follow these guidelines before generating any Python code.
1. OBJECT CREATION

Each solid must be logged as an entry in the "objects" list. This list fully defines all standalone solids and shapes in the model.

JSON Structure for Object Creation
{
  "objects": [
    {
      "name": "Cube_1",
      "type": "Box",
      "params": {
        "width": 50,
        "height": 50,
        "depth": 50
      },
      "transform": [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]
    }
  ]
}
Explanation of Each Field:
name: A unique identifier for the object. Must not be reused. Use clear, meaningful names (e.g. Base_Housing, Support_Pin).
type: The shape primitive or creation method. Supported values include:
Box, Cylinder, Sphere, Cone, Torus, Loft, Extrude, etc.
params: The defining parameters for the object type:
Box uses width, height, depth.
Cylinder uses radius, height.
Loft uses a list of profiles, each with a shape, dimensional values, and a position.
transform: A 4×4 matrix defining the object's position, orientation, and scaling in 3D space.
The last column [x, y, z] in rows 0–2 defines the translation.
The top-left 3×3 part defines orientation and scale.
The last row is always [0, 0, 0, 1] (homogeneous coordinate padding).
Always include a transform, even if it is identity (object at origin, no rotation).
2. GEOMETRIC OPERATIONS (MODIFICATIONS)

Each modification, transformation, or boolean operation must be defined in the "operations" list.

JSON Structure for Operations
{
  "operations": [
    {
      "action": "fillet_edges",
      "target": "Cube_1",
      "edges": "all",
      "radius": 5
    },
    {
      "action": "translate",
      "target": "Cube_1",
      "vector": [0, 0, 25]
    }
  ]
}
Explanation of Each Field:
action: What kind of operation to perform.
target: Name of the object being modified (or targets list if multiple).
edges: Edge selector. Use:
"all": all edges
"vertical", "horizontal", "top", "bottom", etc. for common patterns
advanced: an array of edge IDs (if available)
radius: Fillet/chamfer radius (in mm).
vector: Movement vector for translation [dx, dy, dz].
angle: Rotation angle in degrees (if used with rotate).
axis: Optional rotation axis [x, y, z].
result: Optional name for the output of a boolean (e.g. union).
Every operation must be tied to a known name created earlier in the objects section.
3. EXAMPLES

Simple Example: A Centered Cube
{
  "objects": [
    {
      "name": "Cube_1",
      "type": "Box",
      "params": {"width": 50, "height": 50, "depth": 50},
      "transform": [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    }
  ],
  "operations": []
}
Medium Example: Cylinder + Fillet + Translate
{
  "objects": [
    {
      "name": "Base_Cylinder",
      "type": "Cylinder",
      "params": {"radius": 25, "height": 10},
      "transform": [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    }
  ],
  "operations": [
    {
      "action": "fillet_edges",
      "target": "Base_Cylinder",
      "edges": "vertical",
      "radius": 2
    },
    {
      "action": "translate",
      "target": "Base_Cylinder",
      "vector": [0, 0, 10]
    }
  ]
}
Hard Example: Loft, Box, Union, Fillet
{
  "objects": [
    {
      "name": "Loft_1",
      "type": "Loft",
      "params": {
        "profiles": [
          {"shape": "Circle", "radius": 10, "position": [0, 0, 0]},
          {"shape": "Rectangle", "width": 20, "height": 20, "position": [0, 0, 40]}
        ]
      },
      "transform": [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    },
    {
      "name": "Mounting_Box",
      "type": "Box",
      "params": {"width": 40, "height": 20, "depth": 10},
      "transform": [[1,0,0,10],[0,1,0,0],[0,0,1,40],[0,0,0,1]]
    }
  ],
  "operations": [
    {
      "action": "union",
      "targets": ["Loft_1", "Mounting_Box"],
      "result": "Combined_Body"
    },
    {
      "action": "fillet_edges",
      "target": "Combined_Body",
      "edges": "all",
      "radius": 3
    }
  ]
}
4. GUIDELINES FOR GENERATING JSON

Always:
Use unique, descriptive names for every object.
Fully define shape parameters (params) based on object type.
Use complete 4×4 transformation matrices in every object.
Log every object and operation — nothing is implicit.
When modifying:
Match object names exactly (target must match an earlier name).
Include only relevant operation-specific fields (e.g., vector, radius).
If an operation creates a new shape (e.g., union), use the result field.
Edge Selectors:
Use string-based selectors for convenience: "all", "vertical", "top".
Avoid edge ID arrays unless precise control is needed.
If unsure:
Use "all" edges in operations unless explicitly filtering.
If no transform is needed, use the identity matrix.
5. Output Format

Your final JSON block must contain:

{
  "objects": [ … ],
  "operations": [ … ]
}
This block is parsed before code is executed.
It is treated as the single source of truth for scene memory.
Do not include Python code here — generate that only after the JSON.
Final Notes

You must generate a JSON plan before any code.
All geometry and operations are tracked using this structure.
This enables perfect memory of what’s been built and how.
JSON → persistent world model; code → execution.
Follow this handbook precisely.