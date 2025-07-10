/**
 * CADAgent PRO - Google Apps Script Backend (Simplified CORS)
 * 
 * This version uses a different approach to handle CORS by setting headers
 * in every response and avoiding separate OPTIONS handling.
 */

// IMPORTANT: Add your Anthropic API key here
const ANTHROPIC_API_KEY = "sk-ant-api03-ERcn38NqCxDQwgnfHleSIEdqtzZyt-IUmYhcRT4B805qwQo6IOV6SGmNP6bmIZVdU2m9UejZIjoUtlGmn9WAYYA-fqw9uwAA";

/**
 * Handle GET requests
 */
function doGet(e) {
  const headers = getCorsHeaders();
  
  try {
    const response = {
      status: "healthy",
      message: "CADAgent PRO API is running",
      timestamp: new Date().toISOString()
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
      case 'generate':
        response = generateModel(data.prompt);
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
 * Generate 3D model from text prompt
 */
function generateModel(prompt) {
  if (!prompt) {
    return { error: "No prompt provided" };
  }
  
  try {
    // Step 1: Generate intention JSON
    const intention = generateIntention(prompt);
    if (!intention) {
      return { error: "Failed to generate intention" };
    }
    
    // Step 2: Generate code based on intention
    const code = generateCodeFromIntention(intention);
    if (!code) {
      return { error: "Failed to generate code" };
    }
    
    // Step 3: Parse the code to create Three.js geometry
    const geometry = parseCodeToGeometry(code);
    
    return {
      success: true,
      intention: intention,
      code: code,
      geometry: geometry
    };
    
  } catch (error) {
    Logger.log('Error generating model: ' + error);
    return { error: "There was an issue at our backend, please try again" };
  }
}

/**
 * Generate intention JSON from user prompt
 */
function generateIntention(prompt) {
  const systemPrompt = `You are a CAD expert that analyzes user requests and generates structured JSON describing what 3D model should be built.

Generate a JSON object with the following structure:
{
  "description": "User's original prompt",
  "primary_shape": "cube|cylinder|sphere|custom",
  "dimensions": {
    "width": number,
    "height": number,
    "depth": number,
    "radius": number,
    "diameter": number
  },
  "features": ["hole", "fillet", "chamfer", "thread", "gear_teeth", "angled_support"],
  "materials": "default|metal|plastic|wood",
  "complexity": "simple|medium|complex",
  "special_instructions": "Additional notes for implementation"
}

Only include dimensions that are relevant to the shape. Use realistic CAD dimensions in millimeters.
Return ONLY the JSON object, no explanations.`;

  const payload = {
    model: "claude-3-sonnet-20240229",
    max_tokens: 500,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `Analyze this CAD request and generate intention JSON: ${prompt}`
    }]
  };
  
  try {
    const response = callAnthropicAPI(payload);
    if (response) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return null;
  } catch (error) {
    Logger.log('Error generating intention: ' + error);
    return null;
  }
}

/**
 * Generate CadQuery code from intention JSON
 */
function generateCodeFromIntention(intention) {
  const systemPrompt = `You are a CAD expert that generates CadQuery Python code from structured JSON intentions.

Generate clean, working CadQuery code that precisely implements the given intention.
Include proper imports: import cadquery as cq
Create a result variable with the final object.
Add clear comments explaining each step.
Use the exact dimensions and features specified in the intention.

Return only the Python code, no explanations.`;

  const userPrompt = `Generate CadQuery code for this intention: ${JSON.stringify(intention)}`;

  const payload = {
    model: "claude-3-sonnet-20240229",
    max_tokens: 1000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: userPrompt
    }]
  };
  
  try {
    const response = callAnthropicAPI(payload);
    if (response) {
      const codeMatch = response.match(/```python\s*\n([\s\S]*?)```/);
      if (codeMatch) {
        return codeMatch[1].trim();
      }
      return response.trim();
    }
    return null;
  } catch (error) {
    Logger.log('Error generating code: ' + error);
    return null;
  }
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
    
    return null;
    
  } catch (error) {
    Logger.log('Anthropic API Error: ' + error);
    return null;
  }
}

/**
 * Parse CadQuery code to Three.js geometry data
 */
function parseCodeToGeometry(code) {
  const geometry = {
    type: "mesh",
    objects: []
  };
  
  // Parse for box
  const boxMatch = code.match(/\.box\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (boxMatch) {
    const [, w, d, h] = boxMatch;
    geometry.objects.push({
      type: "box",
      width: parseInt(w),
      height: parseInt(h),
      depth: parseInt(d),
      position: [0, 0, 0]
    });
  }
  
  // Parse for cylinder
  const cylinderMatch = code.match(/\.cylinder\((\d+),\s*(\d+)\)/);
  if (cylinderMatch) {
    const [, height, radius] = cylinderMatch;
    geometry.objects.push({
      type: "cylinder",
      radius: parseInt(radius),
      height: parseInt(height),
      position: [0, 0, 0]
    });
  }
  
  // Parse for holes
  const holeMatch = code.match(/\.hole\((\d+)\)/);
  if (holeMatch) {
    const diameter = parseInt(holeMatch[1]);
    geometry.objects.push({
      type: "hole",
      diameter: diameter,
      position: [0, 0, 0]
    });
  }
  
  // If no objects found, create a default cube
  if (geometry.objects.length === 0) {
    geometry.objects.push({
      type: "box",
      width: 20,
      height: 20,
      depth: 20,
      position: [0, 0, 0]
    });
  }
  
  return geometry;
}

/**
 * Handle email signup
 */
function handleSignup(email) {
  return {
    status: "success",
    message: "Thanks for joining! We'll be in touch soon with your free early access."
  };
}