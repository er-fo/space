# Python/CadQuery Execution Pipeline Setup

Since Google Apps Script cannot execute Python directly, you'll need to set up a Python execution environment. Here are the options:

## Option 1: Local Python Server (Development)

### 1. Setup Python Environment
```bash
# Create virtual environment
python -m venv cadquery_env
source cadquery_env/bin/activate  # On Windows: cadquery_env\Scripts\activate

# Install dependencies
pip install cadquery-ocp
pip install cadquery
pip install flask flask-cors
```

### 2. Create Python Execution Server
Save this as `python_executor.py`:

```python
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cadquery as cq
import tempfile
import os
import json
import traceback

app = Flask(__name__)
CORS(app)

@app.route('/execute', methods=['POST'])
def execute_cadquery():
    try:
        data = request.json
        python_code = data.get('pythonCode')
        
        if not python_code:
            return jsonify({'error': 'No Python code provided'}), 400
        
        # Create temporary directory for execution
        with tempfile.TemporaryDirectory() as temp_dir:
            # Change to temp directory
            os.chdir(temp_dir)
            
            # Execute the Python code
            exec_globals = {'cq': cq, '__name__': '__main__'}
            exec(python_code, exec_globals)
            
            # Check if GLTF file was generated
            gltf_path = os.path.join(temp_dir, 'output.gltf')
            if os.path.exists(gltf_path):
                # Read GLTF file content
                with open(gltf_path, 'r') as f:
                    gltf_content = f.read()
                
                return jsonify({
                    'success': True,
                    'gltf': gltf_content,
                    'message': 'Model generated successfully'
                })
            else:
                return jsonify({'error': 'GLTF file not generated'}), 500
                
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Python CadQuery executor running'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 3. Run the Server
```bash
python python_executor.py
```

The server will run on `http://localhost:5000`

## Option 2: Cloud Deployment (Production)

### Railway Deployment
1. Create account at railway.app
2. Deploy the Python server:
```bash
# Create requirements.txt
echo "flask
flask-cors
cadquery-ocp
cadquery" > requirements.txt

# Deploy to Railway
railway login
railway new
railway add
railway deploy
```

### Heroku Deployment
```bash
# Create Procfile
echo "web: python python_executor.py" > Procfile

# Deploy
heroku create cadagent-executor
git add .
git commit -m "Deploy Python executor"
git push heroku main
```

## Option 3: Serverless Functions (Recommended)

### Vercel Functions
Create `api/execute.py`:
```python
from http.server import BaseHTTPRequestHandler
import json
import cadquery as cq
import tempfile
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        try:
            python_code = data.get('pythonCode')
            
            # Execute CadQuery code in temporary environment
            with tempfile.TemporaryDirectory() as temp_dir:
                os.chdir(temp_dir)
                exec_globals = {'cq': cq, '__name__': '__main__'}
                exec(python_code, exec_globals)
                
                # Read generated GLTF
                with open('output.gltf', 'r') as f:
                    gltf_content = f.read()
                
                response = {
                    'success': True,
                    'gltf': gltf_content
                }
                
        except Exception as e:
            response = {'error': str(e)}
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
```

Deploy with: `vercel --prod`

## Integration with Frontend

Update your frontend to call both APIs:
1. Google Apps Script → Generate JSON + Python code
2. Python Executor → Execute code and get GLTF
3. Frontend → Load and display GLTF

Example frontend integration:
```javascript
async function generateAndExecuteModel(prompt) {
    // Step 1: Generate pipeline from Google Apps Script
    const pipelineResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'generate_cad_pipeline', prompt: prompt})
    });
    const pipeline = await pipelineResponse.json();
    
    if (!pipeline.success) {
        throw new Error(pipeline.error);
    }
    
    // Step 2: Execute Python code
    const executionResponse = await fetch(PYTHON_EXECUTOR_URL + '/execute', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({pythonCode: pipeline.pythonCode})
    });
    const execution = await executionResponse.json();
    
    if (!execution.success) {
        throw new Error(execution.error);
    }
    
    // Step 3: Load GLTF into Three.js
    const loader = new THREE.GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
        loader.parse(execution.gltf, '', resolve, reject);
    });
    
    // Add to scene
    scene.add(gltf.scene);
}
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on Python executor
2. **Timeout**: Set execution timeout (30 seconds max)
3. **Sandboxing**: Run in isolated containers if possible
4. **Input Validation**: Validate Python code for malicious content
5. **Resource Limits**: Limit memory and CPU usage

Choose Option 1 for development/testing, Option 3 for production deployment.