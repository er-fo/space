/**
 * CADAgent PRO - Complete Pipeline Google Apps Script
 * 
 * This script generates JSON plans and Python/CadQuery code using Anthropic API
 * following the framework.md specification for CAD Memory JSON.
 */

// IMPORTANT: Add your Anthropic API key here
const ANTHROPIC_API_KEY = "YOUR_ANTHROPIC_API_KEY_HERE";

// Framework.md system prompt for structured CAD generation
const FRAMEWORK_SYSTEM_PROMPT = `You are a CAD expert that generates structured JSON plans and Python/CadQuery code following the CAD Memory JSON specification.

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
- Export as GLTF format at the end

SUPPORTED OBJECT TYPES:
- Box: width, height, depth
- Cylinder: radius, height  
- Sphere: radius
- Cone: radius1, radius2, height
- Torus: majorRadius, minorRadius

SUPPORTED OPERATIONS:
- fillet_edges: radius, edges selector
- translate: vector [x, y, z]
- rotate: angle (degrees), axis [x, y, z]
- union: combines multiple objects
- subtract: boolean subtraction

Your response must have TWO sections:
1. JSON_PLAN: The structured JSON following CAD Memory specification
2. PYTHON_CODE: Complete CadQuery code that implements the plan and exports GLTF

Always end Python code with: result.export_gltf("output.gltf")`;

/**
 * Handle GET requests
 */
function doGet(e) {
  const headers = getCorsHeaders();
  
  try {
    const response = {
      status: "healthy",
      message: "CADAgent PRO Pipeline API is running",
      timestamp: new Date().toISOString(),
      capabilities: [
        "JSON plan generation using framework.md",
        "Python/CadQuery code generation", 
        "GLTF export support",
        "Full CAD pipeline integration"
      ]
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    return createErrorResponse(error, headers);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  const headers = getCorsHeaders();
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let response;
    
    switch (action) {
      case 'generate_cad_pipeline':
        response = generateCADPipeline(data.prompt);
        break;
      case 'signup':
        response = handleSignup(data.email);
        break;
      default:
        response = { error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    return createErrorResponse(error, headers);
  }
}

/**
 * Get CORS headers
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Create error response
 */
function createErrorResponse(error, headers) {
  Logger.log('Error: ' + error);
  return ContentService
    .createTextOutput(JSON.stringify({
      error: error.toString(),
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

/**
 * Generate complete CAD pipeline: JSON plan + Python code
 */
function generateCADPipeline(prompt) {
  if (!prompt) {
    return { error: "No prompt provided" };
  }
  
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_API_KEY_HERE") {
    return { error: "Anthropic API key not configured" };
  }
  
  try {
    Logger.log('Generating CAD pipeline for prompt: ' + prompt);
    
    // Call Anthropic API with framework system prompt
    const cadResponse = callAnthropicAPI({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      temperature: 0.3,
      system: FRAMEWORK_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Generate a complete CAD pipeline for this request: "${prompt}"\n\nProvide both the JSON plan and Python/CadQuery code following the framework specification.`
      }]
    });
    
    if (!cadResponse) {
      return { error: "Failed to generate CAD pipeline from AI" };
    }
    
    // Parse the response to extract JSON plan and Python code
    const parsed = parsePipelineResponse(cadResponse);
    
    if (!parsed.jsonPlan || !parsed.pythonCode) {
      return { error: "AI response missing required sections", rawResponse: cadResponse };
    }
    
    return {
      success: true,
      prompt: prompt,
      jsonPlan: parsed.jsonPlan,
      pythonCode: parsed.pythonCode,
      rawResponse: cadResponse,
      instructions: {
        step1: "Save Python code to a file (e.g., model.py)",
        step2: "Install dependencies: pip install cadquery-ocp cadquery",
        step3: "Run: python model.py",
        step4: "The output.gltf file will be generated",
        step5: "Upload GLTF to your website for display"
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    Logger.log('Error generating CAD pipeline: ' + error);
    return { error: "There was an issue generating the CAD pipeline: " + error.toString() };
  }
}

/**
 * Parse AI response to extract JSON plan and Python code
 */
function parsePipelineResponse(response) {
  const result = {
    jsonPlan: null,
    pythonCode: null
  };
  
  try {
    // Extract JSON plan
    const jsonMatch = response.match(/JSON_PLAN:\s*\n?\s*(\{[\s\S]*?\})\s*(?=PYTHON_CODE:|$)/i);
    if (jsonMatch) {
      try {
        result.jsonPlan = JSON.parse(jsonMatch[1]);
      } catch (e) {
        Logger.log('Failed to parse JSON plan: ' + e);
      }
    }
    
    // Extract Python code
    const pythonMatch = response.match(/PYTHON_CODE:\s*\n?\s*```python\s*\n([\s\S]*?)```/i);
    if (pythonMatch) {
      result.pythonCode = pythonMatch[1].trim();
    } else {
      // Try alternative pattern without markdown
      const altPythonMatch = response.match(/PYTHON_CODE:\s*\n([\s\S]*?)(?=\n\n|$)/i);
      if (altPythonMatch) {
        result.pythonCode = altPythonMatch[1].trim();
      }
    }
    
    // Fallback: try to extract any JSON and Python separately
    if (!result.jsonPlan) {
      const anyJsonMatch = response.match(/\{[\s\S]*"objects"[\s\S]*\}/);
      if (anyJsonMatch) {
        try {
          result.jsonPlan = JSON.parse(anyJsonMatch[0]);
        } catch (e) {
          Logger.log('Fallback JSON parse failed: ' + e);
        }
      }
    }
    
    if (!result.pythonCode) {
      const anyPythonMatch = response.match(/```python\s*\n([\s\S]*?)```/);
      if (anyPythonMatch) {
        result.pythonCode = anyPythonMatch[1].trim();
      }
    }
    
  } catch (error) {
    Logger.log('Error parsing pipeline response: ' + error);
  }
  
  return result;
}

/**
 * Call Anthropic API with payload
 */
function callAnthropicAPI(payload) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options);
    const data = JSON.parse(response.getContentText());
    
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    }
    
    Logger.log('Unexpected API response format: ' + JSON.stringify(data));
    return null;
    
  } catch (error) {
    Logger.log('Anthropic API Error: ' + error);
    return null;
  }
}

/**
 * Handle email signup (existing functionality)
 */
function handleSignup(email) {
  return {
    status: "success",
    message: "Thanks for joining! We'll be in touch soon with your free early access."
  };
}

/**
 * Test function for development
 */
function testCADPipeline() {
  const testPrompt = "Create a 20mm cube with a 5mm hole through the center";
  const result = generateCADPipeline(testPrompt);
  Logger.log('Test result: ' + JSON.stringify(result));
  return result;
}