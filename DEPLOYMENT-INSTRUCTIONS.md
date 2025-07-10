# 🚀 Complete CADAgent PRO Pipeline Deployment

This guide will help you deploy the complete AI-powered CAD generation pipeline.

## 📋 Overview

The complete pipeline consists of:
1. **Google Apps Script** - Generates JSON plans + Python/CadQuery code using Anthropic API
2. **Python Executor** - Executes CadQuery code and generates GLTF files
3. **Frontend** - Displays 3D models from GLTF files

## 🔧 Step 1: Deploy Google Apps Script

### 1.1 Create New Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Delete default code and paste content from `google-apps-script-cadagent.js`

### 1.2 Add Your Anthropic API Key
```javascript
const ANTHROPIC_API_KEY = "sk-ant-api03-YOUR-ACTUAL-API-KEY-HERE";
```

### 1.3 Deploy as Web App
1. Click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. Click "Deploy"
6. Copy the web app URL (you'll need this)

### 1.4 Test the Script
```javascript
// Run this test function in the Apps Script editor
function testCADPipeline() {
  const result = generateCADPipeline("Create a 20mm cube with rounded edges");
  console.log(result);
}
```

## 🐍 Step 2: Deploy Python Executor

Choose one of these options:

### Option A: Local Development Server
```bash
# 1. Create virtual environment
python -m venv cadquery_env
source cadquery_env/bin/activate  # Windows: cadquery_env\Scripts\activate

# 2. Install dependencies
pip install flask flask-cors cadquery-ocp cadquery

# 3. Create python_executor.py (see SETUP-PYTHON-PIPELINE.md)

# 4. Run server
python python_executor.py
```
Your Python executor will be at: `http://localhost:5000`

### Option B: Railway (Recommended for Production)
```bash
# 1. Create requirements.txt
echo "flask
flask-cors
cadquery-ocp
cadquery" > requirements.txt

# 2. Create python_executor.py (see SETUP-PYTHON-PIPELINE.md)

# 3. Deploy to Railway
railway login
railway new cadagent-executor
railway add
railway deploy
```

### Option C: Heroku
```bash
# 1. Create Procfile
echo "web: python python_executor.py" > Procfile

# 2. Deploy
heroku create cadagent-executor
git add .
git commit -m "Deploy Python executor"
git push heroku main
```

## 🌐 Step 3: Configure Frontend

### 3.1 Update URLs in index.html
Edit these lines in `index.html`:
```javascript
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
const PYTHON_EXECUTOR_URL = "https://your-python-executor.railway.app";  // or your URL
```

### 3.2 Test the Complete Pipeline
1. Open `index.html` in browser
2. Enter a prompt like "Create a 20mm cube with a 5mm hole"
3. Click "Generate 3D Model"
4. You should see:
   - "Analyzing your request..."
   - "Executing CadQuery code..."
   - "Loading 3D model..."
   - Real 3D model appears + success dialog with JSON/Python code

## 🔍 Step 4: Testing & Verification

### Test Google Apps Script
```bash
curl -X POST "YOUR_GOOGLE_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"generate_cad_pipeline","prompt":"Create a 20mm cube"}'
```

### Test Python Executor
```bash
curl -X POST "YOUR_PYTHON_EXECUTOR_URL/execute" \
  -H "Content-Type: application/json" \
  -d '{"pythonCode":"import cadquery as cq\nresult = cq.Workplane().box(20,20,20)\nresult.export_gltf(\"output.gltf\")"}'
```

### Test Complete Pipeline
1. Open browser console (F12)
2. Try the demo
3. Check console logs for any errors
4. Verify GLTF model loads correctly

## 🚨 Troubleshooting

### Common Issues

**1. "API key not configured"**
- Make sure you added your real Anthropic API key to Google Apps Script
- Redeploy the script after adding the key

**2. "CORS error"**
- Ensure Google Apps Script deployment has "Anyone" access
- Check Python executor has CORS enabled

**3. "Failed to execute Python code"**
- Check Python executor logs
- Verify CadQuery dependencies are installed
- Test executor with simple code first

**4. "GLTF parsing error"**
- Check if GLTF file was actually generated
- Verify CadQuery export worked correctly
- Test with simpler geometry first

### Logs and Debugging

**Google Apps Script:**
- View logs in Apps Script editor: View → Logs

**Python Executor:**
- Local: Check terminal output
- Railway: `railway logs`
- Heroku: `heroku logs --tail`

**Frontend:**
- Open browser console (F12) for JavaScript errors

## 🎯 Expected Results

When working correctly, the pipeline should:

1. **Input**: "Create a 30mm cube with 5mm rounded corners"
2. **JSON Plan**:
```json
{
  "objects": [
    {
      "name": "Base_Cube",
      "type": "Box",
      "params": {"width": 30, "height": 30, "depth": 30},
      "transform": [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    }
  ],
  "operations": [
    {
      "action": "fillet_edges",
      "target": "Base_Cube",
      "edges": "all",
      "radius": 5
    }
  ]
}
```

3. **Python Code**:
```python
import cadquery as cq

# Create base cube
Base_Cube = cq.Workplane().box(30, 30, 30)

# Apply fillet to all edges
result = Base_Cube.edges().fillet(5)

# Export as GLTF
result.export_gltf("output.gltf")
```

4. **3D Model**: Real GLTF model displayed in browser

## 🔒 Security Notes

- ✅ API key stays secure in Google Apps Script
- ✅ No sensitive data exposed to frontend
- ✅ Python execution isolated in separate service
- ⚠️ Consider rate limiting for production use
- ⚠️ Monitor API usage and costs

## 💰 Costs

- **Google Apps Script**: Free (within quotas)
- **Anthropic API**: ~$0.01-0.05 per request
- **Python Executor**: 
  - Railway: $5/month (hobby plan)
  - Heroku: $7/month (hobby dyno)
  - Local: Free

## 🎉 Next Steps

Once deployed:
1. Test with various prompts
2. Add more complex CAD operations
3. Implement user authentication
4. Add model sharing features
5. Scale based on usage

Your CADAgent PRO pipeline is now ready for real AI-powered CAD generation! 🚀