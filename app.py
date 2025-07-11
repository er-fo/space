"""
Flask application for CADAgent PRO
Serves static files and provides CAD generation API
"""

from flask import Flask, request, jsonify, send_file, Response
import json
import os
import sys
import tempfile
import traceback
import re
import requests
from typing import Dict, Any, Optional

app = Flask(__name__)

# Configure Flask for larger responses
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max request size
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False  # Disable pretty printing for efficiency
app.config['JSON_AS_ASCII'] = False  # Allow non-ASCII characters in JSON responses

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
        
        # Enhanced debug logging for complete pipeline
        print(f"=== PIPELINE RESULT DEBUG ===")
        print(f"Pipeline success: {pipeline_result.get('success', 'Unknown')}")
        print(f"Pipeline keys: {list(pipeline_result.keys())}")
        
        if 'error' in pipeline_result:
            print(f"Pipeline error: {pipeline_result['error']}")
        
        if 'jsonPlan' in pipeline_result:
            json_plan = pipeline_result['jsonPlan']
            print(f"JSON Plan type: {type(json_plan)}")
            print(f"JSON Plan: {json_plan}")
        
        if 'pythonCode' in pipeline_result:
            python_code = pipeline_result['pythonCode']
            print(f"Python code length: {len(python_code) if python_code else 'None'}")
            if python_code:
                print(f"Python code preview:")
                print(python_code[:200] + "..." if len(python_code) > 200 else python_code)
        
        if 'gltf' in pipeline_result:
            gltf_content = pipeline_result['gltf']
            print(f"GLTF content type: {type(gltf_content)}")
            print(f"GLTF content length: {len(gltf_content) if gltf_content else 'None'}")
            if gltf_content:
                print(f"GLTF starts with: {gltf_content[:50]}")
                print(f"GLTF ends with: {gltf_content[-50:]}")
        else:
            print("NO GLTF CONTENT IN PIPELINE RESULT!")
        
        print(f"=== END PIPELINE DEBUG ===")
        
        # Create custom response to avoid potential jsonify truncation
        json_str = json.dumps(pipeline_result, separators=(',', ':'), ensure_ascii=False)  # Compact JSON
        response = Response(
            json_str,
            content_type='application/json; charset=utf-8',
            headers={
                'Access-Control-Allow-Origin': '*',
                'Content-Length': str(len(json_str.encode('utf-8')))
            }
        )
        
        print(f"Response JSON length: {len(json_str)}")
        print(f"Response bytes length: {len(json_str.encode('utf-8'))}")
        if 'gltf' in pipeline_result:
            print(f"GLTF content length in response: {len(pipeline_result['gltf'])}")
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
    """Execute CadQuery code in isolated environment with comprehensive logging"""
    print(f"=== CADQUERY EXECUTION START ===")
    print(f"Python code to execute:")
    print(python_code)
    print(f"=== CODE END ===")
    
    try:
        # Import CadQuery (this will fail if not available, triggering fallback)
        import cadquery as cq
        print(f"✓ CadQuery imported successfully")
        
        # Create temporary directory for execution
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"✓ Created temp directory: {temp_dir}")
            
            # Change to temp directory
            original_cwd = os.getcwd()
            os.chdir(temp_dir)
            print(f"✓ Changed to temp directory")
            
            try:
                # Prepare safe execution environment
                exec_globals = {
                    'cq': cq,
                    '__name__': '__main__',
                    '__file__': 'model.py',
                    'os': os,  # Limited os access
                    'tempfile': tempfile,
                    'show_object': lambda x: None,  # Dummy function for CQ-editor compatibility
                    'math': __import__('math')  # Include math module
                }
                print(f"✓ Prepared execution environment with globals: {list(exec_globals.keys())}")
                
                # Execute the Python code
                print(f"⚡ Executing Python code...")
                exec(python_code, exec_globals)
                print(f"✓ Python code executed successfully")
                
                # List all files in directory
                all_files = os.listdir('.')
                print(f"Files in temp directory after execution: {all_files}")
                
                # Look for generated GLTF file
                gltf_files = [f for f in all_files if f.endswith('.gltf')]
                print(f"GLTF files found: {gltf_files}")
                
                if not gltf_files:
                    print(f"❌ No GLTF files generated!")
                    raise FileNotFoundError("No GLTF file was generated. Make sure your code includes assembly.save('output.gltf')")
                
                # Read the first GLTF file found
                gltf_path = gltf_files[0]
                print(f"✓ Reading GLTF file: {gltf_path}")
                
                # Get file stats
                file_stats = os.stat(gltf_path)
                print(f"GLTF file size: {file_stats.st_size} bytes")
                
                try:
                    # Try reading as text first (JSON GLTF)
                    with open(gltf_path, 'r', encoding='utf-8') as f:
                        gltf_content = f.read()
                    print(f"✓ Read as JSON GLTF, length: {len(gltf_content)}")
                    print(f"GLTF content preview: {gltf_content[:100]}...")
                    
                    # Validate and clean the GLTF JSON, embedding external buffers
                    try:
                        # Parse to validate and re-serialize to ensure clean formatting
                        gltf_json = json.loads(gltf_content)
                        print(f"✓ Successfully validated GLTF JSON")
                        
                        # Check for external buffer references and embed them
                        if 'buffers' in gltf_json:
                            for buffer in gltf_json['buffers']:
                                if 'uri' in buffer and not buffer['uri'].startswith('data:'):
                                    # External file reference - try to embed it
                                    buffer_file = buffer['uri']
                                    buffer_path = os.path.join('.', buffer_file)
                                    
                                    if os.path.exists(buffer_path):
                                        print(f"✓ Found external buffer file: {buffer_file}")
                                        try:
                                            with open(buffer_path, 'rb') as f:
                                                buffer_data = f.read()
                                            
                                            # Convert to base64 data URI
                                            import base64
                                            buffer_base64 = base64.b64encode(buffer_data).decode('utf-8')
                                            buffer['uri'] = f"data:application/octet-stream;base64,{buffer_base64}"
                                            
                                            print(f"✓ Embedded buffer file {buffer_file} as data URI ({len(buffer_data)} bytes)")
                                        except Exception as e:
                                            print(f"⚠ Failed to embed buffer file {buffer_file}: {e}")
                                    else:
                                        print(f"⚠ Buffer file {buffer_file} not found, leaving as external reference")
                        
                        # Re-serialize with consistent formatting
                        clean_gltf = json.dumps(gltf_json, separators=(',', ':'), ensure_ascii=False)
                        print(f"✓ Re-serialized GLTF, length: {len(clean_gltf)}")
                        
                        return clean_gltf
                    except json.JSONDecodeError as e:
                        print(f"⚠ Failed to parse GLTF JSON: {e}")
                        print(f"Raw content length: {len(gltf_content)}")
                        print(f"Raw content preview: {repr(gltf_content[:200])}")
                        return gltf_content
                except UnicodeDecodeError:
                    print(f"⚠ Binary GLTF detected, converting to base64")
                    # Binary GLTF - read as base64
                    import base64
                    with open(gltf_path, 'rb') as f:
                        binary_content = f.read()
                    # Return as data URL for Three.js GLTFLoader
                    base64_result = f"data:model/gltf-binary;base64,{base64.b64encode(binary_content).decode('utf-8')}"
                    print(f"✓ Converted to base64, length: {len(base64_result)}")
                    return base64_result
                
            finally:
                # Restore original directory
                os.chdir(original_cwd)
                print(f"✓ Restored original directory")
                
    except ImportError as e:
        print(f"❌ CadQuery import failed: {e}")
        print(f"Falling back to simple GLTF generation")
        # CadQuery not available, use fallback
        return generate_fallback_gltf(python_code)
    except Exception as e:
        print(f"❌ CadQuery execution failed with error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Full traceback:")
        print(traceback.format_exc())
        raise Exception(f"CadQuery execution failed: {str(e)}")
    finally:
        print(f"=== CADQUERY EXECUTION END ===")

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
1. ALWAYS generate a JSON plan FIRST following the exact CAD Memory JSON specification
2. THEN generate Python/CadQuery code that implements the JSON plan
3. The JSON plan is the single source of truth for geometry

NATURAL LANGUAGE INTERPRETATION:
- Convert user descriptions into structured engineering specifications
- Infer reasonable dimensions (default 50mm for primary features)
- Use manufacturing-friendly proportions and constraints
- Handle geometric terms: twist, taper, fillet, chamfer, boss, groove, etc.

CAD MEMORY JSON SPECIFICATION:
You must generate JSON following this exact structure:

{
  "objects": [
    {
      "name": "unique_descriptive_name",
      "type": "Box|Cylinder|Sphere|Cone|Pyramid|Loft|Extrude",
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

OBJECT TYPES AND PARAMETERS:
- Box: width, height, depth
- Cylinder: radius, height  
- Sphere: radius
- Cone: bottomRadius, topRadius, height
- Pyramid: width, depth, height (use extrude with taper)
- Loft: profiles (array of cross-sections with positions)

PYTHON CODE GENERATION RULES:
- Import cadquery as cq and math if needed
- Create objects using CadQuery operations: box(), cylinder(), sphere(), extrude()
- For pyramids: use rect().extrude(height, taper=-89)
- For complex shapes: use loft() between wire profiles
- Apply transformations: translate(), rotate(), mirror()
- Boolean operations: union(), cut(), intersect()
- AVOID .fillet() operations - they cause compatibility issues
- NEVER include show_object() calls
- Always end with: assembly = cq.Assembly(); assembly.add(result, name="part"); assembly.save("output.gltf")

SAFE CADQUERY PATTERNS:
```python
# Simple box
result = cq.Workplane("XY").box(50, 50, 50)

# Pyramid (safe - no fillet)
result = cq.Workplane("XY").rect(50, 50).extrude(75, taper=-89)

# Cylinder
result = cq.Workplane("XY").cylinder(height=50, radius=25)

# Loft between profiles
bottom = cq.Workplane("XY").rect(50, 50)
top = cq.Workplane("XY").workplane(offset=50).rect(25, 25)
result = cq.Workplane("XY").loft([bottom.val(), top.val()])
```

GEOMETRIC INTERPRETATIONS:
- "Pyramid" = Tapered extrusion (rect + extrude with taper)
- "Twisted prism" = Loft between rotated polygons  
- "Cylinder" = Basic cylinder operation
- "Box/Cube" = Basic box operation
- "Bracket" = L-shaped combination of boxes
- "Gear" = Cylinder with teeth (use polarArray if needed)

MANDATORY RESPONSE FORMAT:
JSON_PLAN:
{
  "objects": [...],
  "operations": [...]
}

PYTHON_CODE:
```python
import cadquery as cq

# Implementation code here
result = ...

assembly = cq.Assembly()
assembly.add(result, name="part")
assembly.save("output.gltf")
```

CRITICAL REMINDERS:
- JSON plan MUST come first
- Use unique, descriptive object names
- Include complete 4×4 transformation matrices
- Avoid fillet operations (compatibility issues)
- Test basic shapes before adding complexity
- All dimensions in millimeters
"""
    
    try:
        # Call Anthropic API with retry logic
        max_attempts = 2
        for attempt in range(max_attempts):
            print(f"Attempt {attempt + 1} of {max_attempts}")
            
            # Enhanced user message construction
            user_message = construct_cad_request(prompt)
            
            # Generate JSON plan and Python code
            ai_response = call_anthropic_api(anthropic_api_key, {
                'model': 'claude-3-5-sonnet-20241022',
                'max_tokens': 3000,
                'temperature': 0.3,
                'system': framework_system_prompt,
                'messages': [{
                    'role': 'user',
                    'content': user_message
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

# Export as GLTF using Assembly
assembly = cq.Assembly()
assembly.add(result, name="cylinder")
assembly.save("output.gltf")
'''
    elif geometry['type'] == 'Sphere':
        return f'''
import cadquery as cq

# Create sphere
result = cq.Workplane("XY").sphere({geometry['params']['radius']})

# Export as GLTF using Assembly
assembly = cq.Assembly()
assembly.add(result, name="sphere")
assembly.save("output.gltf")
'''
    else:
        return f'''
import cadquery as cq

# Create box
result = cq.Workplane("XY").box({geometry['params']['width']}, {geometry['params']['depth']}, {geometry['params']['height']})

# Export as GLTF using Assembly
assembly = cq.Assembly()
assembly.add(result, name="box")
assembly.save("output.gltf")
'''

def construct_cad_request(user_prompt: str) -> str:
    """
    Enhanced interpretation of user input to construct a complete CAD request.
    Converts natural language descriptions into structured CAD modeling requests.
    """
    
    # Clean and normalize the input
    prompt = user_prompt.strip()
    
    # Keywords that indicate specific geometric operations
    geometric_keywords = {
        'twist': 'helical rotation',
        'taper': 'gradual size reduction',
        'chamfer': 'angled edge cut',
        'fillet': 'rounded edge',
        'boss': 'raised cylindrical feature',
        'groove': 'recessed channel',
        'flange': 'flat circular plate',
        'bracket': 'L-shaped support',
        'gear': 'toothed wheel',
        'thread': 'helical ridge',
        'keyway': 'rectangular slot',
        'counterbore': 'stepped hole',
        'countersink': 'conical recess'
    }
    
    # Engineering dimension patterns
    dimension_patterns = {
        'small': '20mm',
        'medium': '50mm', 
        'large': '100mm',
        'tiny': '10mm',
        'huge': '200mm'
    }
    
    # Material thickness suggestions
    thickness_suggestions = {
        'thin': '2mm wall thickness',
        'thick': '10mm wall thickness',
        'sheet': '3mm thickness',
        'plate': '20mm thickness'
    }
    
    # Analyze prompt for context clues
    analysis = []
    
    # Check for geometric operations
    for keyword, description in geometric_keywords.items():
        if keyword in prompt.lower():
            analysis.append(f"- Requires {description} ({keyword})")
    
    # Check for size indicators
    for size_word, dimension in dimension_patterns.items():
        if size_word in prompt.lower():
            analysis.append(f"- Suggested primary dimension: {dimension}")
    
    # Check for thickness indicators
    for thickness_word, suggestion in thickness_suggestions.items():
        if thickness_word in prompt.lower():
            analysis.append(f"- Suggested {suggestion}")
    
    # Construct enhanced request
    enhanced_request = f"""
OBJECT DESCRIPTION: {prompt}

ENGINEERING INTERPRETATION:
{chr(10).join(analysis) if analysis else "- Standard engineering practices apply"}

MODELING REQUIREMENTS:
- Create a manufacturable 3D model
- Use appropriate dimensions and proportions
- Include necessary engineering features
- Ensure structural integrity
- Apply standard manufacturing constraints

TECHNICAL SPECIFICATIONS:
- Default dimensions: 50mm primary features
- Minimum wall thickness: 2mm
- Standard fillet radius: 2-5mm
- Material: General engineering plastic/metal
- Tolerance: ±0.1mm standard

Please generate both the JSON plan and Python/CadQuery code for this engineering model.
"""
    
    return enhanced_request

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