# AI-Driven CAD Generator Setup Guide

This script implements the LLM + Python + CadQuery model generation workflow from your core idea. It converts natural language instructions into 3D CAD models and exports them as STEP files.

## Prerequisites

- Python 3.8 or higher
- pip package manager

## Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Verify CadQuery installation:**
   ```bash
   python -c "import cadquery as cq; print('CadQuery installed successfully')"
   ```

## Usage

### Interactive Mode
Run the script without arguments for interactive mode:
```bash
python cad_ai_generator.py
```

Then enter natural language descriptions like:
- "Create a 50mm cube with a 10mm hole through the center"
- "Make a cylindrical pipe 100mm long, 20mm outer diameter, 5mm thick"
- "Design a simple bracket with mounting holes"

### Command Line Mode
Pass the description as command line arguments:
```bash
python cad_ai_generator.py "Create a 20mm cube with 5mm holes on each face"
```

### Programmatic Usage
Use the `CADGenerator` class in your own code:
```python
from cad_ai_generator import CADGenerator

generator = CADGenerator("your-api-key-here")
results = generator.generate_model("Create a gear with 20 teeth")

if results["success"]:
    print(f"STEP file saved to: {results['step_file']}")
```

### Run Examples
Execute the example script to generate several test models:
```bash
python example_usage.py
```

## How It Works

1. **Input**: Natural language description of desired 3D model
2. **LLM Generation**: Claude generates CadQuery Python code
3. **Execution**: Code is safely executed to create the 3D model
4. **Export**: Model is exported as a STEP file
5. **Output**: STEP file saved in `generated_models/` directory

## Output

- Generated STEP files are saved in the `generated_models/` folder
- STEP files can be imported into any CAD software:
  - AutoCAD
  - SolidWorks
  - Fusion 360
  - FreeCAD
  - OnShape
  - And many others

## File Structure

```
.
├── cad_ai_generator.py     # Main script
├── example_usage.py        # Example usage
├── requirements.txt        # Dependencies
├── SETUP.md               # This file
└── generated_models/      # Output directory (created automatically)
    ├── example_1.step
    ├── example_2.step
    └── ...
```

## Troubleshooting

### CadQuery Installation Issues
If you have trouble installing CadQuery:
```bash
# Try conda instead of pip
conda install -c conda-forge cadquery

# Or use the OCP variant
pip install cadquery-ocp
```

### API Key Issues
- Ensure your Anthropic API key is valid and has credits
- The key is embedded in the script - consider using environment variables for production use

### Generated Code Errors
- The LLM occasionally generates invalid CadQuery syntax
- Try rephrasing your description to be more specific
- Check the generated code output for obvious syntax errors

## Security Note

The script uses `exec()` to run generated code in a restricted environment. For production use, consider additional sandboxing measures.

## Future Enhancements

Based on your dev ideas, potential improvements include:
- Automatic conversion to OBJ for broader CAD software compatibility
- Parametric history tracking for version control
- Integration with STEP1X-3D for image-to-3D generation
- KCL code generation as an alternative to direct STEP editing 