#!/usr/bin/env python3
"""
Example usage of the AI-Driven CAD Generator
"""

from cad_ai_generator import CADGenerator

def main():
    # Initialize with your API key
    API_KEY = "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"
    generator = CADGenerator(API_KEY)
    
    # Example models to generate
    examples = [
        "Create a 20mm cube with a 5mm hole through the center",
        "Make a cylindrical pipe 50mm long, 15mm outer diameter, 3mm wall thickness",
        "Design a simple L-bracket 30mm x 30mm x 5mm thick with 4mm mounting holes",
        "Create a washer with 20mm outer diameter, 8mm inner diameter, 2mm thick"
    ]
    
    print("🚀 Generating example CAD models...")
    print("=" * 60)
    
    for i, instruction in enumerate(examples, 1):
        print(f"\n📝 Example {i}: {instruction}")
        print("-" * 40)
        
        # Generate the model
        results = generator.generate_model(instruction, f"example_{i}")
        
        if results["success"]:
            print(f"✅ Success! File: {results['step_file']}")
        else:
            print(f"❌ Failed: {results['error']}")
    
    print("\n🎉 All examples completed!")
    print(f"📁 Check the 'generated_models' folder for STEP files")

if __name__ == "__main__":
    main() 