# CADAgent PRO Framework

## Workflow Overview

The CADAgent PRO framework uses a multi-step process to generate reliable 3D models from natural language descriptions:

1. **Intention Generation** - LLM generates structured JSON describing what should be built
2. **Code Generation** - LLM generates Python CadQuery code based on the intention
3. **Validation** - Third party compares intention vs. actual code implementation
4. **Retry Logic** - If validation fails, retry once with enhanced prompts
5. **Error Handling** - Show user-friendly error if both attempts fail

## Step 1: Intention Generation

The LLM first analyzes the user's prompt and generates a structured JSON describing the intended 3D model:

```json
{
  "description": "User's original prompt",
  "primary_shape": "cube|cylinder|sphere|custom",
  "dimensions": {
    "width": 20,
    "height": 20,
    "depth": 20,
    "radius": 10,
    "diameter": 20
  },
  "features": [
    "hole",
    "fillet",
    "chamfer",
    "thread",
    "gear_teeth",
    "angled_support"
  ],
  "materials": "default|metal|plastic|wood",
  "complexity": "simple|medium|complex",
  "special_instructions": "Additional notes for implementation"
}
```

## Step 2: Code Generation

Based on the intention JSON, the LLM generates CadQuery Python code:

```python
import cadquery as cq

# Create primary shape
result = cq.Workplane("XY").box(20, 20, 20)

# Add features
result = result.faces(">Z").workplane().hole(5)

# Apply finishing
result = result.edges().fillet(2)
```

## Step 3: Validation

A third party (separate LLM call) compares the intention JSON with the generated code and returns a validation result:

```json
{
  "valid": true,
  "issues": [],
  "missing_features": [],
  "incorrect_dimensions": [],
  "confidence": 0.95
}
```

## Step 4: Retry Logic

If validation fails (confidence < 0.8 or critical issues found):
1. Enhanced prompt with specific feedback
2. Second attempt at code generation
3. If second attempt also fails, show error to user

## Step 5: Error Handling

User-friendly error messages:
- "There was an issue at our backend, please try again"
- Fallback to demo model if available
- Log detailed errors for debugging

## Implementation Notes

- All steps happen server-side in Google Apps Script
- Frontend only sees final success/failure result
- Validation ensures code quality before showing to user
- Maximum 2 attempts to maintain reasonable response time