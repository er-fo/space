/**
 * CADAgent PRO - Google Apps Script Backend (CORS Fixed)
 * 
 * The key fix: Google Apps Script doesn't automatically handle OPTIONS requests.
 * This version consolidates all HTTP method handling into a single function.
 */

// IMPORTANT: Add your Anthropic API key here
const ANTHROPIC_API_KEY = "sk-ant-api03-ERcn38NqCxDQwgnfHleSIEdqtzZyt-IUmYhcRT4B805qwQo6IOV6SGmNP6bmIZVdU2m9UejZIjoUtlGmn9WAYYA-fqw9uwAA";

/**
 * Main entry point - handles all HTTP methods
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Handle all requests with proper CORS headers
 */
function handleRequest(e, method) {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '3600'
  };
  
  try {
    // Handle OPTIONS preflight requests by checking URL parameters
    if (e && e.parameter && e.parameter.method === 'OPTIONS') {
      return ContentService
        .createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeaders(headers);
    }
    
    let response;
    
    if (method === 'GET') {
      // Health check endpoint
      response = {
        status: "healthy",
        message: "CADAgent PRO API is running",
        timestamp: new Date().toISOString()
      };
    } else if (method === 'POST') {
      // Handle POST requests
      const data = JSON.parse(e.postData.contents);
      const action = e.parameter.action || data.action;
      
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
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    Logger.log('Request Error: ' + error);
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

/**
 * Generate 3D model from text prompt - simplified for testing
 */
function generateModel(prompt) {
  if (!prompt) {
    return { error: "No prompt provided" };
  }
  
  // For testing, return mock data without API calls
  return {
    success: true,
    intention: {
      description: prompt,
      primary_shape: "cube",
      dimensions: { width: 20, height: 20, depth: 20 },
      features: [],
      materials: "default",
      complexity: "simple"
    },
    code: `import cadquery as cq\n\n# Create a 20mm cube\nresult = cq.Workplane("XY").box(20, 20, 20)`,
    geometry: {
      type: "mesh",
      objects: [{
        type: "box",
        width: 20,
        height: 20,
        depth: 20,
        position: [0, 0, 0]
      }]
    }
  };
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