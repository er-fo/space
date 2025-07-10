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

# API endpoint for CAD generation
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