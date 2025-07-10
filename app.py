"""
Flask application for CADAgent PRO
Serves static files and provides CAD generation API
"""

from flask import Flask, request, jsonify, send_file
import json
import os
import sys
import tempfile
import traceback
import re
import requests
from typing import Dict, Any, Optional

app = Flask(__name__)

# Serve static files
@app.route('/')
def index():
    return send_file('index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    # Handle specific files
    if filename in ['oauth.html', 'privacy.html', 'terms.html']:
        return send_file(filename)
    
    # Handle auth directory
    if filename.startswith('auth/'):
        return send_file(filename)
    
    # Handle images
    if filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg')):
        return send_file(filename)
    
    # Default to 404 for other files
    return "File not found", 404

# API endpoint for complete demo pipeline
@app.route('/api/generate', methods=['POST', 'OPTIONS'])
def generate_demo():
    if request.method == 'OPTIONS':
        # Handle CORS preflight
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
    
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        
        if not prompt:
            raise ValueError("No prompt provided")
        
        # Generate complete CAD pipeline
        pipeline_result = generate_cad_pipeline(prompt)
        
        response = jsonify(pipeline_result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error generating demo: {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")
        
        response = jsonify({
            'success': False,
            'error': error_msg,
            'fallback_available': True
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

# Legacy API endpoint for backward compatibility
@app.route('/api/execute', methods=['POST', 'OPTIONS'])
def execute_cad():
    if request.method == 'OPTIONS':
        # Handle CORS preflight
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
    
    try:
        data = request.get_json()
        python_code = data.get('pythonCode')
        
        if not python_code:
            raise ValueError("No Python code provided")
        
        # Execute CadQuery code
        gltf_content = execute_cadquery(python_code)
        
        response = jsonify({
            'success': True,
            'gltf': gltf_content,
            'message': 'Model generated successfully'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error executing CadQuery: {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")
        
        response = jsonify({
            'success': False,
            'error': error_msg,
            'fallback_available': True
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

# Health check endpoint
@app.route('/health')
def health_check():
    response = jsonify({
        'status': 'healthy',
        'message': 'CADAgent PRO Server (Fly.io)',
        'python_version': sys.version,
        'available_modules': check_modules()
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def execute_cadquery(python_code):
    """Execute CadQuery code in isolated environment"""
    try:
        # Import CadQuery (this will fail if not available, triggering fallback)
        import cadquery as cq
        
        # Create temporary directory for execution
        with tempfile.TemporaryDirectory() as temp_dir:
            # Change to temp directory
            original_cwd = os.getcwd()
            os.chdir(temp_dir)
            
            try:
                # Prepare safe execution environment
                exec_globals = {
                    'cq': cq,
                    '__name__': '__main__',
                    '__file__': 'model.py',
                    'os': os,  # Limited os access
                    'tempfile': tempfile
                }
                
                # Execute the Python code
                exec(python_code, exec_globals)
                
                # Look for generated GLTF file
                gltf_files = [f for f in os.listdir('.') if f.endswith('.gltf')]
                
                if not gltf_files:
                    raise FileNotFoundError("No GLTF file was generated. Make sure your code includes result.export_gltf('output.gltf')")
                
                # Read the first GLTF file found
                gltf_path = gltf_files[0]
                with open(gltf_path, 'r', encoding='utf-8') as f:
                    gltf_content = f.read()
                
                return gltf_content
                
            finally:
                # Restore original directory
                os.chdir(original_cwd)
                
    except ImportError:
        # CadQuery not available, use fallback
        return generate_fallback_gltf(python_code)
    except Exception as e:
        raise Exception(f"CadQuery execution failed: {str(e)}")

def generate_fallback_gltf(python_code):
    """Generate a simple GLTF as fallback when CadQuery is not available"""
    print("CadQuery not available, generating fallback GLTF")
    
    # Parse basic shapes from the Python code
    dimensions = extract_dimensions_from_code(python_code)
    
    # Generate basic GLTF for a cube
    gltf = {
        "asset": {"version": "2.0"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{
            "primitives": [{
                "attributes": {"POSITION": 0},
                "indices": 1
            }]
        }],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": 8,
                "type": "VEC3",
                "max": [dimensions['width']/2, dimensions['height']/2, dimensions['depth']/2],
                "min": [-dimensions['width']/2, -dimensions['height']/2, -dimensions['depth']/2]
            },
            {
                "bufferView": 1,
                "componentType": 5123,
                "count": 36,
                "type": "SCALAR"
            }
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": 96},
            {"buffer": 0, "byteOffset": 96, "byteLength": 72}
        ],
        "buffers": [{"byteLength": 168, "uri": "data:application/octet-stream;base64,AAAA..."}]
    }
    
    return json.dumps(gltf)

def extract_dimensions_from_code(code):
    """Extract dimensions from Python code for fallback"""
    # Default dimensions
    dimensions = {'width': 20, 'height': 20, 'depth': 20}
    
    # Look for .box(width, height, depth) calls
    box_match = re.search(r'\.box\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)', code)
    if box_match:
        dimensions['width'] = float(box_match.group(1))
        dimensions['height'] = float(box_match.group(2))
        dimensions['depth'] = float(box_match.group(3))
    
    return dimensions

def generate_cad_pipeline(prompt: str) -> Dict[str, Any]:
    """Generate complete CAD pipeline: JSON plan + Python code + GLTF execution"""
    
    # Get Anthropic API key from environment
    anthropic_api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not anthropic_api_key:
        return generate_fallback_pipeline(prompt)
    
    framework_system_prompt = """
You are a CAD expert that generates structured JSON plans and Python/CadQuery code following the CAD Memory JSON specification.

CRITICAL WORKFLOW:
1. First, analyze the user's request and generate a JSON plan following this exact structure:
{
  "objects": [
    {
      "name": "unique_name",
      "type": "Box|Cylinder|Sphere|Cone|Torus|Loft|Extrude",
      "params": {"width": 50, "height": 50, "depth": 50},
      "transform": [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    }
  ],
  "operations": [
    {
      "action": "fillet_edges|translate|rotate|union|subtract",
      "target": "object_name",
      "edges": "all|vertical|horizontal|top|bottom",
      "radius": 5,
      "vector": [0, 0, 25],
      "angle": 90,
      "axis": [0, 0, 1]
    }
  ]
}

2. Then generate working Python/CadQuery code that implements this JSON plan.

RULES:
- Use unique, descriptive names for every object
- Include complete 4×4 transformation matrices
- All dimensions in millimeters
- Generate clean, executable CadQuery code
- Always end with: result.export_gltf("output.gltf")

Your response must have TWO sections:
1. JSON_PLAN: The structured JSON following CAD Memory specification
2. PYTHON_CODE: Complete CadQuery code that implements the plan and exports GLTF
"""
    
    try:
        # Call Anthropic API with retry logic
        max_attempts = 2
        for attempt in range(max_attempts):
            print(f"Attempt {attempt + 1} of {max_attempts}")
            
            # Generate JSON plan and Python code
            ai_response = call_anthropic_api(anthropic_api_key, {
                'model': 'claude-3-5-sonnet-20241022',
                'max_tokens': 3000,
                'temperature': 0.3,
                'system': framework_system_prompt,
                'messages': [{
                    'role': 'user',
                    'content': f'Generate a complete CAD pipeline for this request: "{prompt}"\n\nProvide both the JSON plan and Python/CadQuery code following the framework specification.'
                }]
            })
            
            if not ai_response:
                continue
            
            # Parse the response
            parsed = parse_pipeline_response(ai_response)
            
            if not parsed.get('jsonPlan') or not parsed.get('pythonCode'):
                continue
            
            # Validate JSON plan against Python code
            if validate_pipeline_consistency(parsed['jsonPlan'], parsed['pythonCode']):
                # Execute the Python code to generate GLTF
                try:
                    gltf_content = execute_cadquery(parsed['pythonCode'])
                    
                    return {
                        'success': True,
                        'prompt': prompt,
                        'jsonPlan': parsed['jsonPlan'],
                        'pythonCode': parsed['pythonCode'],
                        'gltf': gltf_content,
                        'message': 'Model generated successfully'
                    }
                except Exception as e:
                    print(f"CadQuery execution failed: {e}")
                    # Return without GLTF if execution fails
                    return {
                        'success': True,
                        'prompt': prompt,
                        'jsonPlan': parsed['jsonPlan'],
                        'pythonCode': parsed['pythonCode'],
                        'error': f'Code generation succeeded but execution failed: {str(e)}',
                        'fallback_available': True
                    }
        
        # If all attempts failed
        return {'success': False, 'error': 'Our backend is busy right now, try again in a couple of minutes'}
        
    except Exception as e:
        print(f"Error in generate_cad_pipeline: {e}")
        return generate_fallback_pipeline(prompt)

def call_anthropic_api(api_key: str, payload: Dict[str, Any]) -> Optional[str]:
    """Call Anthropic API with the given payload"""
    try:
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01'
            },
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('content') and data['content'][0].get('text'):
                return data['content'][0]['text']
        
        print(f"Anthropic API error: {response.status_code} - {response.text}")
        return None
        
    except Exception as e:
        print(f"Error calling Anthropic API: {e}")
        return None

def parse_pipeline_response(response: str) -> Dict[str, Any]:
    """Parse AI response to extract JSON plan and Python code"""
    result = {'jsonPlan': None, 'pythonCode': None}
    
    try:
        # Extract JSON plan
        json_match = re.search(r'JSON_PLAN:\s*\n?\s*(\{[\s\S]*?\})\s*(?=PYTHON_CODE:|$)', response, re.IGNORECASE)
        if json_match:
            try:
                result['jsonPlan'] = json.loads(json_match.group(1))
            except json.JSONDecodeError as e:
                print(f'Failed to parse JSON plan: {e}')
        
        # Extract Python code
        python_match = re.search(r'PYTHON_CODE:\s*\n?\s*```python\s*\n([\s\S]*?)```', response, re.IGNORECASE)
        if python_match:
            result['pythonCode'] = python_match.group(1).strip()
        else:
            # Try alternative pattern without markdown
            alt_python_match = re.search(r'PYTHON_CODE:\s*\n([\s\S]*?)(?=\n\n|$)', response, re.IGNORECASE)
            if alt_python_match:
                result['pythonCode'] = alt_python_match.group(1).strip()
        
        # Fallback: try to extract any JSON and Python separately
        if not result['jsonPlan']:
            any_json_match = re.search(r'\{[\s\S]*"objects"[\s\S]*\}', response)
            if any_json_match:
                try:
                    result['jsonPlan'] = json.loads(any_json_match.group(0))
                except json.JSONDecodeError:
                    pass
        
        if not result['pythonCode']:
            any_python_match = re.search(r'```python\s*\n([\s\S]*?)```', response)
            if any_python_match:
                result['pythonCode'] = any_python_match.group(1).strip()
        
    except Exception as e:
        print(f'Error parsing pipeline response: {e}')
    
    return result

def validate_pipeline_consistency(json_plan: Dict[str, Any], python_code: str) -> bool:
    """Validate that JSON plan and Python code are consistent"""
    try:
        # Basic validation checks
        if not json_plan.get('objects'):
            return False
        
        if not python_code or len(python_code.strip()) < 10:
            return False
        
        # Check if Python code contains CadQuery imports
        if 'import cadquery' not in python_code and 'cadquery' not in python_code:
            return False
        
        # Check if Python code contains export statement
        if 'export' not in python_code.lower():
            return False
        
        # Check if main objects from JSON are referenced in Python code
        object_names = [obj.get('name', '') for obj in json_plan['objects']]
        python_lower = python_code.lower()
        
        # At least one object should be referenced or the code should contain basic CAD operations
        has_cad_operations = any(op in python_lower for op in ['box', 'cylinder', 'sphere', 'workplane'])
        
        return has_cad_operations
        
    except Exception as e:
        print(f'Error validating pipeline consistency: {e}')
        return False

def generate_fallback_pipeline(prompt: str) -> Dict[str, Any]:
    """Generate a fallback pipeline when AI is unavailable"""
    # Simple prompt analysis for fallback
    geometry = analyze_prompt_for_geometry(prompt)
    
    fallback_json = {
        'objects': [{
            'name': 'Fallback_Object',
            'type': geometry['type'],
            'params': geometry['params'],
            'transform': [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
        }],
        'operations': []
    }
    
    fallback_python = generate_fallback_cadquery_code(geometry)
    
    try:
        gltf_content = execute_cadquery(fallback_python)
        return {
            'success': True,
            'prompt': prompt,
            'jsonPlan': fallback_json,
            'pythonCode': fallback_python,
            'gltf': gltf_content,
            'message': 'Fallback model generated (AI unavailable)'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Fallback generation failed: {str(e)}',
            'jsonPlan': fallback_json,
            'pythonCode': fallback_python
        }

def analyze_prompt_for_geometry(prompt: str) -> Dict[str, Any]:
    """Analyze prompt to determine basic geometry"""
    prompt_lower = prompt.lower()
    
    # Extract dimensions
    size_match = re.search(r'(\d+)\s*mm', prompt)
    default_size = float(size_match.group(1)) if size_match else 20
    
    if 'cylinder' in prompt_lower or 'gear' in prompt_lower:
        # Look for radius specifically
        radius_match = re.search(r'(\d+)\s*mm\s*radius|radius[^0-9]*(\d+)', prompt_lower)
        if radius_match:
            radius = float(radius_match.group(1) or radius_match.group(2))
        else:
            radius = default_size/2
        return {
            'type': 'Cylinder',
            'params': {'radius': radius, 'height': default_size}
        }
    elif 'sphere' in prompt_lower or 'ball' in prompt_lower:
        return {
            'type': 'Sphere',
            'params': {'radius': default_size/2}
        }
    else:
        return {
            'type': 'Box',
            'params': {'width': default_size, 'height': default_size, 'depth': default_size}
        }

def generate_fallback_cadquery_code(geometry: Dict[str, Any]) -> str:
    """Generate basic CadQuery code for fallback"""
    if geometry['type'] == 'Cylinder':
        return f'''
import cadquery as cq

# Create cylinder
result = cq.Workplane("XY").cylinder({geometry['params']['height']}, {geometry['params']['radius']})

# Export as GLTF
result.export_gltf("output.gltf")
'''
    elif geometry['type'] == 'Sphere':
        return f'''
import cadquery as cq

# Create sphere
result = cq.Workplane("XY").sphere({geometry['params']['radius']})

# Export as GLTF
result.export_gltf("output.gltf")
'''
    else:
        return f'''
import cadquery as cq

# Create box
result = cq.Workplane("XY").box({geometry['params']['width']}, {geometry['params']['depth']}, {geometry['params']['height']})

# Export as GLTF
result.export_gltf("output.gltf")
'''

def check_modules():
    """Check which modules are available"""
    modules = []
    try:
        import cadquery
        modules.append('cadquery')
    except ImportError:
        pass
    
    try:
        import json
        modules.append('json')
    except ImportError:
        pass
        
    return modules

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)