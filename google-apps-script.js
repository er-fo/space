/**
 * CADAgent PRO - Google Apps Script Backend
 * 
 * Instructions for setup:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Replace the default code with this file's content
 * 4. Add your Anthropic API key to the ANTHROPIC_API_KEY variable below
 * 5. Deploy as a web app with permissions for "Anyone"
 * 6. Copy the web app URL and update the SCRIPT_URL in index.html
 */

// IMPORTANT: Add your Anthropic API key here
const ANTHROPIC_API_KEY = "sk-ant-api03-ERcn38NqCxDQwgnfHleSIEdqtzZyt-IUmYhcRT4B805qwQo6IOV6SGmNP6bmIZVdU2m9UejZIjoUtlGmn9WAYYA-fqw9uwAA";

/**
 * Handle GET requests (for testing)
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "healthy",
      message: "CADAgent PRO API is running"
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    // Enable CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    const data = JSON.parse(e.postData.contents);
    const action = e.parameter.action || data.action;
    
    let response;
    
    switch (action) {
      case 'generate':
        response = generateModel(data.prompt);
        break;
      case 'signup':
        response = handleSignup(data.email || e.parameter.email);
        break;
      default:
        response = { error: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

/**
 * Generate 3D model from text prompt using framework workflow
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
    
    // Step 3: Validate code against intention
    const validation = validateCodeAgainstIntention(intention, code);
    
    let finalCode = code;
    
    // Step 4: Retry logic if validation fails
    if (!validation.valid && validation.confidence < 0.8) {
      Logger.log('First attempt failed validation, retrying...');
      
      const enhancedPrompt = createEnhancedPrompt(prompt, intention, validation);
      const retryCode = generateCodeFromIntention(intention, enhancedPrompt);
      
      if (retryCode) {
        const retryValidation = validateCodeAgainstIntention(intention, retryCode);
        if (retryValidation.valid || retryValidation.confidence > validation.confidence) {
          finalCode = retryCode;
        }
      }
      
      // If still failing, return error
      if (!validateCodeAgainstIntention(intention, finalCode).valid) {
        return { error: "There was an issue at our backend, please try again" };
      }
    }
    
    // Step 5: Parse the code to create Three.js geometry
    const geometry = parseCodeToGeometry(finalCode);
    
    return {
      success: true,
      intention: intention,
      code: finalCode,
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
      // Extract JSON from response
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
function generateCodeFromIntention(intention, enhancedPrompt = null) {
  const systemPrompt = `You are a CAD expert that generates CadQuery Python code from structured JSON intentions.

Generate clean, working CadQuery code that precisely implements the given intention.
Include proper imports: import cadquery as cq
Create a result variable with the final object.
Add clear comments explaining each step.
Use the exact dimensions and features specified in the intention.

Return only the Python code, no explanations.`;

  const userPrompt = enhancedPrompt || `Generate CadQuery code for this intention: ${JSON.stringify(intention)}`;

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
      // Extract Python code from response
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
 * Validate code against intention using third party LLM
 */
function validateCodeAgainstIntention(intention, code) {
  const systemPrompt = `You are a CAD code validator. Compare the given intention JSON with the generated CadQuery code and determine if the code correctly implements the intention.

Return a JSON object with this structure:
{
  "valid": boolean,
  "issues": ["list of issues found"],
  "missing_features": ["features from intention not implemented"],
  "incorrect_dimensions": ["dimensions that don't match intention"],
  "confidence": number between 0 and 1
}

Focus on:
- Does the code create the correct primary shape?
- Are dimensions approximately correct?
- Are all specified features implemented?
- Is the code syntactically correct?

Return ONLY the JSON object.`;

  const userPrompt = `
INTENTION:
${JSON.stringify(intention, null, 2)}

GENERATED CODE:
${code}

Validate if the code correctly implements the intention.`;

  const payload = {
    model: "claude-3-sonnet-20240229",
    max_tokens: 500,
    temperature: 0.2,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: userPrompt
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
    // Default validation result if parsing fails
    return {
      valid: false,
      issues: ["Could not validate code"],
      missing_features: [],
      incorrect_dimensions: [],
      confidence: 0.5
    };
  } catch (error) {
    Logger.log('Error validating code: ' + error);
    return {
      valid: false,
      issues: ["Validation failed"],
      missing_features: [],
      incorrect_dimensions: [],
      confidence: 0.3
    };
  }
}

/**
 * Create enhanced prompt for retry attempt
 */
function createEnhancedPrompt(originalPrompt, intention, validation) {
  let enhancedPrompt = `Generate CadQuery code for this intention: ${JSON.stringify(intention)}

ORIGINAL USER REQUEST: ${originalPrompt}

ISSUES TO FIX:
${validation.issues.join('\n')}

MISSING FEATURES:
${validation.missing_features.join('\n')}

INCORRECT DIMENSIONS:
${validation.incorrect_dimensions.join('\n')}

Please generate corrected code that addresses all these issues.`;

  return enhancedPrompt;
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
  
  // Parse for polygon (hexagon)
  const polygonMatch = code.match(/\.polygon\((\d+),\s*(\d+)\)/);
  if (polygonMatch) {
    const [, sides, radius] = polygonMatch;
    geometry.objects.push({
      type: "polygon",
      sides: parseInt(sides),
      radius: parseInt(radius),
      height: 8, // Default height
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
 * Handle email signup (existing functionality)
 */
function handleSignup() {
  // This would integrate with your existing signup logic
  // For now, just return a success message
  return {
    status: "success",
    message: "Thanks for joining! We'll be in touch soon with your free early access."
  };
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600'
    });
}