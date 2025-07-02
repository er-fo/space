#!/usr/bin/env python3
"""
AI-Driven CAD Generator using CadQuery
Converts natural language instructions to 3D models via LLM -> CadQuery -> STEP export
"""

import os
import sys
import json
import traceback
from pathlib import Path
from typing import Optional, Dict, Any

# Third-party imports
try:
    # Try different import approaches for CadQuery
    try:
        import cadquery as cq
    except ImportError:
        # Try OCP version
        import OCP
        import cadquery as cq
    
    import anthropic
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Install with: pip install cadquery-ocp anthropic")
    print("If you're having issues, try: conda install -c conda-forge cadquery")
    sys.exit(1)


class CADGenerator:
    def __init__(self, api_key: str):
        """Initialize the CAD generator with Anthropic API key."""
        self.client = anthropic.Anthropic(api_key=api_key)
        self.output_dir = Path("generated_models")
        self.output_dir.mkdir(exist_ok=True)
    
    def generate_cadquery_code(self, user_instruction: str) -> str:
        """
        Use Anthropic Claude to generate CadQuery code from natural language.
        
        Args:
            user_instruction: Natural language description of the desired 3D model
            
        Returns:
            Generated Python/CadQuery code as string
        """
        
        system_prompt = """You are an expert CAD programmer specializing in CadQuery. 
Generate clean, executable Python code using the CadQuery library to create 3D models based on user descriptions.

Requirements:
1. Always import cadquery as cq at the top
2. Create a workplane and build the model step by step
3. Use proper CadQuery methods (box, cylinder, extrude, cut, etc.)
4. Include dimensional parameters clearly
5. End with a variable called 'result' containing the final model
6. Add comments explaining each step
7. Use millimeters as the default unit
8. Make models centered at origin when possible

Example structure:
```python
import cadquery as cq

# Create base shape
result = (cq.Workplane("XY")
    .box(10, 10, 5)  # 10x10x5mm box
    .faces(">Z")     # Select top face
    .circle(2)       # 2mm radius circle
    .cutThruAll()    # Cut hole through
)
```

Only return the Python code, no additional explanation."""

        user_prompt = f"""Create a CadQuery model for: {user_instruction}

Generate clean, executable Python code that creates this 3D model."""

        try:
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
            
            return message.content[0].text.strip()
            
        except Exception as e:
            raise Exception(f"Failed to generate code: {str(e)}")
    
    def execute_cadquery_code(self, code: str) -> cq.Workplane:
        """
        Execute the generated CadQuery code safely.
        
        Args:
            code: Python/CadQuery code string
            
        Returns:
            CadQuery Workplane object
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
            },
            'cq': cq,
            'cadquery': cq,
        }
        
        safe_locals = {}
        
        try:
            # Execute the generated code
            exec(code, safe_globals, safe_locals)
            
            # Look for the result variable
            if 'result' not in safe_locals:
                raise ValueError("Generated code must define a 'result' variable")
            
            result = safe_locals['result']
            
            # Validate it's a CadQuery object
            if not isinstance(result, (cq.Workplane, cq.Solid, cq.Shell, cq.Face)):
                raise ValueError(f"Result must be a CadQuery object, got {type(result)}")
            
            return result
            
        except Exception as e:
            raise Exception(f"Failed to execute generated code: {str(e)}\n\nCode:\n{code}")
    
    def export_to_step(self, model: cq.Workplane, filename: str) -> Path:
        """
        Export CadQuery model to STEP file.
        
        Args:
            model: CadQuery Workplane object
            filename: Output filename (without extension)
            
        Returns:
            Path to the exported STEP file
        """
        
        output_path = self.output_dir / f"{filename}.step"
        
        try:
            # Export to STEP format
            cq.exporters.export(model, str(output_path))
            return output_path
            
        except Exception as e:
            raise Exception(f"Failed to export STEP file: {str(e)}")
    
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
        
        try:
            print(f"🤖 Generating CadQuery code for: {instruction}")
            
            # Step 1: Generate CadQuery code
            code = self.generate_cadquery_code(instruction)
            results["generated_code"] = code
            
            print("📝 Generated code:")
            print("-" * 50)
            print(code)
            print("-" * 50)
            
            # Step 2: Execute the code
            print("⚙️  Executing CadQuery code...")
            model = self.execute_cadquery_code(code)
            
            # Step 3: Export to STEP
            print("💾 Exporting to STEP file...")
            step_path = self.export_to_step(model, filename)
            results["step_file"] = str(step_path)
            
            print(f"✅ Success! STEP file saved to: {step_path}")
            results["success"] = True
            
        except Exception as e:
            error_msg = str(e)
            results["error"] = error_msg
            print(f"❌ Error: {error_msg}")
            if "Failed to execute generated code" in error_msg:
                print("\n🔧 Tip: The LLM might have generated invalid CadQuery syntax.")
                print("Consider rephrasing your instruction or checking the generated code.")
        
        return results


def main():
    """Main function for command-line usage."""
    
    # Your Anthropic API key
    API_KEY = "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"
    
    # Initialize generator
    generator = CADGenerator(API_KEY)
    
    print("🚀 AI-Driven CAD Generator")
    print("=" * 50)
    
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