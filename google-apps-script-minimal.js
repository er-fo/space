/**
 * Minimal Google Apps Script test - just to verify basic functionality
 */

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "healthy",
      message: "Minimal test API working",
      timestamp: new Date().toISOString(),
      method: "GET"
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "POST request received",
        timestamp: new Date().toISOString(),
        method: "POST",
        receivedData: data
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}