#!/usr/bin/env python3
"""
AI-Driven CAD Generator using Build123d
Converts natural language instructions to 3D models via LLM -> Build123d -> STEP export
"""

import os
import sys
import json
import traceback
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

# Third-party imports
try:
    import build123d as bd
    import anthropic
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Install with: pip install build123d anthropic")
    sys.exit(1)


class CADGenerator:
    def __init__(self, api_key: str, enable_logging: bool = True):
        """Initialize the CAD generator with Anthropic API key."""
        self.client = anthropic.Anthropic(api_key=api_key)
        self.output_dir = Path("generated_models")
        self.output_dir.mkdir(exist_ok=True)
        
        # Set up logging
        self.enable_logging = enable_logging
        if enable_logging:
            self._setup_logging()
        else:
            # Create dummy loggers for when logging is disabled
            self.logger = logging.getLogger('CADGenerator_Dummy')
            self.logger.disabled = True
            self.llm_logger = logging.getLogger('LLM_Raw_Dummy') 
            self.llm_logger.disabled = True
    
    def _setup_logging(self):
        """Set up logging for LLM interactions and debugging."""
        # Create logs directory
        logs_dir = Path("logs")
        logs_dir.mkdir(exist_ok=True)
        
        # Set up main logger
        self.logger = logging.getLogger('CADGenerator')
        self.logger.setLevel(logging.DEBUG)
        
        # Remove existing handlers to avoid duplicates
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # Create file handler for detailed logs
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = logs_dir / f"cad_generator_{timestamp}.log"
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        
        # Create console handler for important messages
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        simple_formatter = logging.Formatter('%(levelname)s - %(message)s')
        
        file_handler.setFormatter(detailed_formatter)
        console_handler.setFormatter(simple_formatter)
        
        # Add handlers to logger
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
        self.logger.info(f"Logging initialized. Log file: {log_file}")
        
        # Set up separate logger for raw LLM interactions
        self.llm_logger = logging.getLogger('LLM_Raw')
        self.llm_logger.setLevel(logging.DEBUG)
        
        # Remove existing handlers
        for handler in self.llm_logger.handlers[:]:
            self.llm_logger.removeHandler(handler)
        
        # Create file handler for raw LLM logs
        llm_log_file = logs_dir / f"llm_raw_{timestamp}.log"
        llm_file_handler = logging.FileHandler(llm_log_file, encoding='utf-8')
        llm_file_handler.setLevel(logging.DEBUG)
        llm_file_handler.setFormatter(detailed_formatter)
        
        self.llm_logger.addHandler(llm_file_handler)
        self.llm_logger.propagate = False  # Don't propagate to parent logger
        
        self.logger.info(f"Raw LLM logging enabled. Log file: {llm_log_file}")
    
    def generate_build123d_code(self, user_instruction: str) -> str:
        """
        Use Anthropic Claude to generate Build123d code from natural language.
        
        Args:
            user_instruction: Natural language description of the desired 3D model
            
        Returns:
            Generated Python/Build123d code as string
        """
        
        system_prompt = """You are a CAD Engineering AI Assistant specializing in Build123d parametric modeling. Your mission is to transform natural language descriptions into precise, manufacturable 3D models using professional CAD practices.

═══════════════════════════════════════════════════════════════════════════════
🎯 PRIMARY OBJECTIVES
═══════════════════════════════════════════════════════════════════════════════

1. **PRECISION ENGINEERING**: Generate dimensionally accurate models suitable for manufacturing
2. **CAD BEST PRACTICES**: Apply industry-standard modeling methodologies and constraint-based design
3. **SEMANTIC UNDERSTANDING**: Interpret user intent beyond literal words, considering engineering context
4. **ERROR PREVENTION**: Anticipate and avoid common CAD modeling pitfalls
5. **STEP COMPATIBILITY**: Ensure models export cleanly to universal CAD interchange formats

═══════════════════════════════════════════════════════════════════════════════
🔧 CAD DOMAIN EXPERTISE
═══════════════════════════════════════════════════════════════════════════════

**Geometric Fundamentals:**
• Solid modeling: Understand feature-based, parametric design workflows
• Boolean operations: Union (+), subtraction (-), intersection (&)
• Geometric constraints: Concentric, tangent, perpendicular, parallel relationships
• Coordinate systems: Right-hand rule (X=width, Y=depth, Z=height), origin-centered design
• Manufacturing considerations: Draft angles, fillets, minimum wall thickness

**Engineering Units & Precision:**
• Default unit system: Millimeters (mm) - state clearly in comments
• Tolerance understanding: ±0.1mm standard, ±0.01mm precision work
• Scale awareness: Part size impacts modeling approach (nano vs. architectural scales)
• Material considerations: Wall thickness, stress concentrations, tool access

**Common CAD Terminology Mapping:**
• "Pipe" → Hollow cylinder (specify inner/outer diameter + wall thickness)
• "Bracket" → L-shaped or angled support structure with mounting features  
• "Housing/Enclosure" → Hollow container with access features (screws, vents)
• "Flange" → Radial projection for bolted connections
• "Boss" → Raised cylindrical feature, often threaded
• "Chamfer" → Angled edge cut (45° typical)
• "Fillet" → Rounded internal corner
• "Round" → Rounded external corner

═══════════════════════════════════════════════════════════════════════════════
💻 BUILD123D TECHNICAL MASTERY
═══════════════════════════════════════════════════════════════════════════════

**CRITICAL BUILD123D SYNTAX PATTERNS:**

```python
# Import statement (mandatory)
import build123d as bd

# Simple primitives (preferred for basic geometry)
box = bd.Box(width, depth, height)  # X, Y, Z dimensions
cylinder = bd.Cylinder(radius, height)
sphere = bd.Sphere(radius)

# Complex operations using context managers
with bd.BuildPart() as part:
    bd.Box(20, 15, 10)  # Base feature
    
    # Subtractive operations (holes, pockets)
    with bd.BuildSketch(bd.Plane.XY.offset(10)) as hole_sketch:
        bd.Circle(3)  # 6mm diameter hole
    bd.extrude(amount=-10)  # Cut through (negative depth)
    
    # Additive operations (bosses, ribs)
    with bd.BuildSketch(bd.Plane.YZ) as boss_sketch:
        bd.Circle(5)
    bd.extrude(amount=8)  # Add material (positive depth)

result = part.part  # Always assign to 'result' variable
```

**CORRECT Build123d Movement/Translation:**
```python
# For simple primitives - use during creation
box1 = bd.Box(10, 10, 5).translate(bd.Vector(20, 0, 0))

# For complex parts - combine using boolean operations
part1 = bd.Box(30, 5, 20)  # Vertical leg
part2 = bd.Box(30, 20, 5).translate(bd.Vector(0, 12.5, -7.5))  # Horizontal leg
result = part1 + part2  # Boolean union
```

**Boolean Operations (PREFERRED METHOD):**
```python
# Union (addition) - ALWAYS use + operator
result = part1 + part2
# Subtraction (cutting) - ALWAYS use - operator
result = part1 - part2
# Intersection
result = part1 & part2
```

**CRITICAL BUILD123D ANTIPATTERNS TO AVOID:**
❌ `.move()` method → Use `.translate()` or boolean unions
❌ `bracket.add()` method → Use `+` operator for boolean union
❌ `extrude(sketch, amount)` → Use `extrude(amount=X)` inside context
❌ Complex nested BuildPart → Use simple primitives + boolean operations
❌ `Polygon([(0,0), (1,1)])` → NEVER use lists or tuples with Polygon
❌ `Polygon([bd.Vector(0,0), bd.Vector(1,1)])` → NEVER use lists, even with Vectors
✅ `Polygon(bd.Vector(0,0), bd.Vector(1,1), bd.Vector(2,0), bd.Vector(0,0))` → Use individual Vector arguments

**POLYGON SYNTAX - CRITICAL:**
WRONG: `bd.Polygon([bd.Vector(0,0), bd.Vector(1,1)])`  # Will cause "Expected floats" error
RIGHT: `bd.Polygon(bd.Vector(0,0), bd.Vector(1,1), bd.Vector(2,0), bd.Vector(0,0))`  # Individual arguments

═══════════════════════════════════════════════════════════════════════════════
🎯 PROMPT INTERPRETATION STRATEGY
═══════════════════════════════════════════════════════════════════════════════

**Parse User Intent:**
1. **Extract dimensions**: Look for numbers + units (convert to mm if needed)
2. **Identify primary geometry**: Box, cylinder, L-shape, U-channel, etc.
3. **Recognize features**: Holes, slots, fillets, chamfers, threads
4. **Understand relationships**: "through", "centered", "offset by", "tangent to"
5. **Infer missing details**: Standard hole sizes, typical wall thickness, material considerations

**Ambiguity Resolution:**
• When dimensions unclear → Use engineering standards (5-10mm typical wall thickness)
• When orientation ambiguous → Default to logical engineering orientation
• When tolerances unspecified → Apply ±0.1mm general tolerance
• When features undefined → Add practical details (chamfered edges, reasonable fillets)

**Engineering Context Examples:**
• "Pipe 50mm long" → Requires inner/outer diameter specification → Assume standard pipe ratios
• "Mounting holes" → Standard M4 clearance holes (4.5mm diameter) unless specified
• "Bracket" → Include mounting holes, appropriate thickness (3-5mm), fillets for stress relief
• "Housing" → Add wall thickness, mounting features, access considerations

═══════════════════════════════════════════════════════════════════════════════
⚙️ MODEL COMPLEXITY MANAGEMENT
═══════════════════════════════════════════════════════════════════════════════

**Complexity Scaling:**
• **Simple request** → Single primitive or basic boolean operation
• **Moderate request** → Multiple features, one or two boolean operations
• **Complex request** → Break into logical sub-assemblies, use descriptive comments

**Code Organization:**
```python
import build123d as bd

# === MAIN GEOMETRY ===
base = bd.Box(50, 30, 10)  # 50x30x10mm base plate

# === MOUNTING FEATURES ===
with bd.BuildPart() as holes:
    bd.Box(50, 30, 10)  # Reference geometry
    # 4x M4 mounting holes in corners
    for x in [-20, 20]:
        for y in [-10, 10]:
            with bd.BuildSketch(bd.Plane.XY.offset(10)) as hole:
                bd.Circle(2.25).moved(bd.Vector(x, y))  # M4 clearance
            bd.extrude(amount=-10)

result = holes.part
```

**Performance Considerations:**
• Minimize nested operations for faster execution
• Group similar features (all holes in one operation)
• Use comments to explain engineering reasoning
• Prefer simple primitives over complex sketched profiles when possible

═══════════════════════════════════════════════════════════════════════════════
📐 UNITS, PRECISION & STEP EXPORT COMPLIANCE
═══════════════════════════════════════════════════════════════════════════════

**Unit Standards:**
• ALL dimensions in millimeters (mm) - state explicitly in comments
• Coordinate system: X=width, Y=depth, Z=height (right-hand rule)
• Origin placement: Centered for symmetric parts, logical reference for assemblies

**Precision Guidelines:**
• Standard tolerance: ±0.1mm (general machining)
• Precision work: ±0.01mm (use decimal places accordingly)
• Minimum feature size: 0.5mm (manufacturing constraint)
• Wall thickness: 2-5mm typical, 1mm minimum for plastic, 3mm minimum for metal

**STEP Export Optimization:**
• Generate clean solid geometry (no self-intersections)
• Ensure manifold topology (closed, watertight solids)
• Avoid micro-features that don't export properly
• Use parametric relationships rather than absolute coordinates when logical

═══════════════════════════════════════════════════════════════════════════════
🚨 ERROR PREVENTION & VALIDATION
═══════════════════════════════════════════════════════════════════════════════

**Pre-flight Checks:**
✓ Import statement present
✓ All dimensions positive and reasonable
✓ 'result' variable assigned
✓ Context managers properly nested
✓ Vector objects used for polygon vertices
✓ Boolean operations use correct operators (+, -, &)

**Common Error Patterns:**
• Division by zero in parametric calculations
• Negative extrusion depths without proper sign handling
• Sketch plane misalignment causing failed operations
• Missing intermediate variables causing reference errors
• Improper context manager nesting

**Validation Strategy:**
```python
# Example with error checking
try:
    with bd.BuildPart() as part:
        if length > 0 and width > 0 and height > 0:  # Validate inputs
            bd.Box(length, width, height)
        else:
            raise ValueError("All dimensions must be positive")
except Exception as e:
    # Fallback to simple geometry
    result = bd.Box(10, 10, 10)  # 10mm cube default
```

═══════════════════════════════════════════════════════════════════════════════
📋 OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

**Code Structure:**
1. Import statement: `import build123d as bd`
2. Dimensional comments: `# 50x30x10mm base plate`
3. Logical sections with comments
4. Final assignment: `result = final_model`
5. NO additional explanation text

**Engineering Documentation:**
• Include dimensional specifications in comments
• Explain non-obvious geometric relationships
• Note manufacturing considerations when relevant
• Use clear variable names reflecting function

**PREFERRED SIMPLE APPROACH (Most Reliable):**
```python
import build123d as bd

# Simple house with triangular roof using primitives only
house_base = bd.Box(50, 40, 30)  # 50x40x30mm house base

# Create roof as a rotated box (approximating triangular prism)
roof = bd.Box(60, 40, 20).rotate(bd.Axis.Y, 45).translate(bd.Vector(0, 0, 40))

# Create door cutout as box to subtract
door = bd.Box(8, 15, 20).translate(bd.Vector(0, -20, 10))

# Combine: house + roof - door
result = house_base + roof - door
```

```python
import build123d as bd

# Alternative: L-bracket using simple primitives + boolean operations
vertical_leg = bd.Box(30, 5, 20)  # 30x5x20mm vertical leg
horizontal_leg = bd.Box(30, 20, 5).translate(bd.Vector(0, 12.5, -7.5))  # Horizontal leg

# Combine parts
bracket = vertical_leg + horizontal_leg

# Create mounting holes as cylinders to subtract
hole1 = bd.Cylinder(2.25, 6).translate(bd.Vector(-10, 0, 5))  # M4 clearance hole
hole2 = bd.Cylinder(2.25, 6).translate(bd.Vector(10, 0, 5))   # M4 clearance hole

# Subtract holes from bracket
result = bracket - hole1 - hole2
```

**Alternative Complex Context Approach (Use Only If Simple Fails):**
```python
import build123d as bd

# Create 50x30x10mm mounting bracket with M4 holes
with bd.BuildPart() as bracket:
    # Main body - 50x30x10mm
    bd.Box(50, 30, 10)
    
    # M4 clearance holes (4.5mm) in corners
    hole_positions = [(-20, -10), (20, -10), (-20, 10), (20, 10)]
    for x, y in hole_positions:
        with bd.BuildSketch(bd.Plane.XY.offset(10)) as hole:
            bd.Circle(2.25).moved(bd.Vector(x, y))
        bd.extrude(amount=-10)  # Through hole

result = bracket.part
```

Generate ONLY the Python code. No explanations, no markdown formatting, no additional text."""

        user_prompt = f"""Create a Build123d model for: {user_instruction}

Generate clean, executable Python code that creates this 3D model using Build123d."""

        try:
            if self.enable_logging:
                self.logger.info(f"Generating Build123d code for instruction: {user_instruction[:100]}...")
                self.llm_logger.debug("=" * 80)
                self.llm_logger.debug("LLM REQUEST")
                self.llm_logger.debug("=" * 80)
                self.llm_logger.debug(f"Model: claude-3-5-sonnet-20241022")
                self.llm_logger.debug(f"Max tokens: 2000")
                self.llm_logger.debug(f"Temperature: 0.1")
                self.llm_logger.debug(f"User instruction: {user_instruction}")
                self.llm_logger.debug(f"System prompt length: {len(system_prompt)} characters")
                self.llm_logger.debug("System prompt:")
                self.llm_logger.debug(system_prompt)
                self.llm_logger.debug("-" * 40)
                self.llm_logger.debug("User prompt:")
                self.llm_logger.debug(user_prompt)
            
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.1,
                system=system_prompt,
                messages=[{
                    "role": "user",
                    "content": user_prompt
                }]
            )
            
            # Log raw LLM response
            if self.enable_logging:
                self.llm_logger.debug("=" * 80)
                self.llm_logger.debug("LLM RESPONSE")
                self.llm_logger.debug("=" * 80)
                self.llm_logger.debug(f"Response type: {type(message)}")
                self.llm_logger.debug(f"Message ID: {getattr(message, 'id', 'N/A')}")
                self.llm_logger.debug(f"Model: {getattr(message, 'model', 'N/A')}")
                self.llm_logger.debug(f"Role: {getattr(message, 'role', 'N/A')}")
                self.llm_logger.debug(f"Usage: {getattr(message, 'usage', 'N/A')}")
                self.llm_logger.debug(f"Content length: {len(message.content) if message.content else 0}")
                self.llm_logger.debug("Raw content:")
                for i, content_block in enumerate(message.content):
                    self.llm_logger.debug(f"Content block {i}: {type(content_block)}")
                    self.llm_logger.debug(f"Content block {i} text:")
                    self.llm_logger.debug(content_block.text)
            
            code = message.content[0].text.strip()
            
            # Log code processing
            if self.enable_logging:
                self.logger.debug(f"Raw code length: {len(code)} characters")
                self.logger.debug("Processing markdown code blocks...")
            
            # Remove markdown code blocks if present
            original_code = code
            if code.startswith('```python') and code.endswith('```'):
                code = code[9:-3].strip()
                if self.enable_logging:
                    self.logger.debug("Removed python markdown code blocks")
            elif code.startswith('```') and code.endswith('```'):
                code = code[3:-3].strip()
                if self.enable_logging:
                    self.logger.debug("Removed generic markdown code blocks")
            
            if self.enable_logging:
                self.logger.debug(f"Final code length: {len(code)} characters")
                self.llm_logger.debug("=" * 80)
                self.llm_logger.debug("PROCESSED CODE")
                self.llm_logger.debug("=" * 80)
                self.llm_logger.debug("Original raw code:")
                self.llm_logger.debug(original_code)
                self.llm_logger.debug("-" * 40)
                self.llm_logger.debug("Final processed code:")
                self.llm_logger.debug(code)
                self.llm_logger.debug("=" * 80)
                self.logger.info("Code generation completed successfully")
            
            return code
            
        except Exception as e:
            error_msg = f"Failed to generate code: {str(e)}"
            if self.enable_logging:
                self.logger.error(error_msg)
                self.logger.error(f"Exception type: {type(e)}")
                self.logger.error(f"Exception details: {traceback.format_exc()}")
            raise Exception(error_msg)
    
    def execute_build123d_code(self, code: str) -> Any:
        """
        Execute the generated Build123d code safely.
        
        Args:
            code: Python/Build123d code string
            
        Returns:
            Build123d object (Part, Compound, etc.)
        """
        
        # Create a safe execution environment
        safe_globals = {
            '__builtins__': {
                'range': range,
                'len': len,
                'max': max,
                'min': min,
                'abs': abs,
                'round': round,
                'int': int,
                'float': float,
                'str': str,
                'bool': bool,
                'list': list,
                'dict': dict,
                'tuple': tuple,
                '__import__': __import__,  # Allow import statements
            },
            'bd': bd,
            'build123d': bd,
        }
        
        safe_locals = {}
        
        try:
            if self.enable_logging:
                self.logger.info("Executing Build123d code...")
                self.logger.debug(f"Code to execute ({len(code)} chars):")
                self.logger.debug(code)
            
            # Execute the generated code
            exec(code, safe_globals, safe_locals)
            
            if self.enable_logging:
                self.logger.debug(f"Code execution completed. Local variables: {list(safe_locals.keys())}")
            
            # Look for the result variable
            if 'result' not in safe_locals:
                error_msg = "Generated code must define a 'result' variable"
                if self.enable_logging:
                    self.logger.error(error_msg)
                    self.logger.error(f"Available variables: {list(safe_locals.keys())}")
                raise ValueError(error_msg)
            
            result = safe_locals['result']
            
            if self.enable_logging:
                self.logger.debug(f"Result variable found: {type(result)}")
                self.logger.debug(f"Result has 'wrapped' attribute: {hasattr(result, 'wrapped')}")
            
            # Validate it's a Build123d object
            if not hasattr(result, 'wrapped'):  # Build123d objects have 'wrapped' attribute
                error_msg = f"Result must be a Build123d object, got {type(result)}"
                if self.enable_logging:
                    self.logger.error(error_msg)
                    self.logger.error(f"Result object attributes: {dir(result) if hasattr(result, '__dict__') else 'No attributes'}")
                raise ValueError(error_msg)
            
            if self.enable_logging:
                self.logger.info("Code execution successful - valid Build123d object created")
            
            return result
            
        except Exception as e:
            error_msg = f"Failed to execute generated code: {str(e)}\n\nCode:\n{code}"
            if self.enable_logging:
                self.logger.error("Code execution failed")
                self.logger.error(f"Exception type: {type(e)}")
                self.logger.error(f"Exception details: {traceback.format_exc()}")
                self.logger.error("Code that failed:")
                self.logger.error(code)
            raise Exception(error_msg)
    
    def export_to_step(self, model: Any, filename: str) -> Path:
        """
        Export Build123d model to STEP file.
        
        Args:
            model: Build123d object
            filename: Output filename (without extension)
            
        Returns:
            Path to the exported STEP file
        """
        
        output_path = self.output_dir / f"{filename}.step"
        
        try:
            if self.enable_logging:
                self.logger.info(f"Exporting model to STEP file: {output_path}")
                self.logger.debug(f"Model type: {type(model)}")
                self.logger.debug(f"Output directory exists: {self.output_dir.exists()}")
            
            # Export to STEP format using Build123d
            bd.export_step(model, str(output_path))
            
            if self.enable_logging:
                self.logger.info(f"STEP export successful: {output_path}")
                self.logger.debug(f"File size: {output_path.stat().st_size if output_path.exists() else 'File not found'} bytes")
            
            return output_path
            
        except Exception as e:
            error_msg = f"Failed to export STEP file: {str(e)}"
            if self.enable_logging:
                self.logger.error(error_msg)
                self.logger.error(f"Exception type: {type(e)}")
                self.logger.error(f"Exception details: {traceback.format_exc()}")
                self.logger.error(f"Output path: {output_path}")
                self.logger.error(f"Model type: {type(model)}")
            raise Exception(error_msg)
    
    def generate_model(self, instruction: str, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Complete workflow: instruction -> code -> model -> STEP file.
        
        Args:
            instruction: Natural language description of desired model
            filename: Optional output filename (auto-generated if None)
            
        Returns:
            Dictionary with results and metadata
        """
        
        if filename is None:
            # Generate filename from instruction
            filename = instruction.lower().replace(" ", "_")[:30]
            filename = "".join(c for c in filename if c.isalnum() or c == "_")
        
        results = {
            "instruction": instruction,
            "filename": filename,
            "success": False,
            "generated_code": "",
            "step_file": None,
            "error": None
        }
        
        if self.enable_logging:
            self.logger.info(f"Starting model generation workflow for: {instruction}")
            self.logger.debug(f"Filename: {filename}")
        
        try:
            print(f"🤖 Generating Build123d code for: {instruction}")
            
            # Step 1: Generate Build123d code
            if self.enable_logging:
                self.logger.info("Step 1: Generating Build123d code")
            code = self.generate_build123d_code(instruction)
            results["generated_code"] = code
            
            print("📝 Generated code:")
            print("-" * 50)
            print(code)
            print("-" * 50)
            
            # Step 2: Execute the code
            print("⚙️  Executing Build123d code...")
            if self.enable_logging:
                self.logger.info("Step 2: Executing generated code")
            model = self.execute_build123d_code(code)
            
            # Step 3: Export to STEP
            print("💾 Exporting to STEP file...")
            if self.enable_logging:
                self.logger.info("Step 3: Exporting to STEP file")
            step_path = self.export_to_step(model, filename)
            results["step_file"] = str(step_path)
            
            print(f"✅ Success! STEP file saved to: {step_path}")
            results["success"] = True
            
            if self.enable_logging:
                self.logger.info(f"Model generation workflow completed successfully")
                self.logger.info(f"Final results: {results}")
            
        except Exception as e:
            error_msg = str(e)
            results["error"] = error_msg
            print(f"❌ Error: {error_msg}")
            
            if self.enable_logging:
                self.logger.error(f"Model generation workflow failed: {error_msg}")
                self.logger.error(f"Final results: {results}")
            
            if "Failed to execute generated code" in error_msg:
                print("\n🔧 Tip: The LLM might have generated invalid Build123d syntax.")
                print("Consider rephrasing your instruction or checking the generated code.")
        
        return results


def main():
    """Main function for command-line usage."""
    
    # Your Anthropic API key
    API_KEY = "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"
    
    # Check for --no-logging flag
    enable_logging = "--no-logging" not in sys.argv
    if not enable_logging:
        sys.argv.remove("--no-logging")
    
    # Initialize generator
    generator = CADGenerator(API_KEY, enable_logging=enable_logging)
    
    print("🚀 AI-Driven CAD Generator (Build123d)")
    print("=" * 55)
    
    if len(sys.argv) > 1:
        # Use command line argument
        instruction = " ".join(sys.argv[1:])
        results = generator.generate_model(instruction)
    else:
        # Interactive mode
        print("Enter your 3D model description (or 'quit' to exit):")
        print("Examples:")
        print("  - Create a 50mm cube with a 10mm hole through the center")
        print("  - Make a cylindrical pipe 100mm long, 20mm outer diameter, 5mm thick")
        print("  - Design a simple bracket with mounting holes")
        print()
        print("Options:")
        print("  --no-logging    Disable logging (no log files will be created)")
        print()
        
        while True:
            try:
                instruction = input("📝 Description: ").strip()
                
                if instruction.lower() in ['quit', 'exit', 'q']:
                    break
                
                if not instruction:
                    continue
                
                print()
                results = generator.generate_model(instruction)
                print()
                
                if results["success"]:
                    print("🎉 Model generated successfully!")
                    print(f"📁 File location: {results['step_file']}")
                else:
                    print("💡 Try rephrasing your description or being more specific.")
                
                print("-" * 50)
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    main() 