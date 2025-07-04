// Set your Spreadsheet ID in Project Settings > Script Properties
// Key: SPREADSHEET_ID, Value: Your Google Sheet ID
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'); 

// --- Main Handler ---

function doGet(e) {
  // This function handles waitlist signups via GET request from the website
  try {
    if (e.parameter.action === 'signup') {
      const email = e.parameter.email;
      if (!email || !validateEmail(email)) {
        return createJsonResponse({ status: 'error', message: 'Valid email is required.' });
      }
      
      const sheet = getSheet();
      const existingEmails = sheet.getRange('A:A').getValues().flat();
      
      if (existingEmails.includes(email)) {
        // If the user is already on the list, we can just return success without re-adding them or sending another email.
        return createJsonResponse({ status: 'success', message: 'Email already registered.' });
      }
      
      const timestamp = new Date();
      const rowData = [
        email,       // Column A: Email
        timestamp    // Column B: Signup Date
      ];
      sheet.appendRow(rowData);
      
      sendWelcomeEmail(email);
      
      return createJsonResponse({ status: 'success', message: 'Successfully added to waitlist.' });
    }
    // A simple check to see if the API is running
    return createJsonResponse({ status: 'ok', message: 'API is running.' });
  } catch (error) {
    console.error('doGet Error:', error);
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// doPost is no longer needed as we removed the payment functionality.

// --- Utility Functions ---

function getSheet() {
    // Attempts to open the sheet by ID if provided, otherwise uses the active one.
    // This makes the script more portable.
    try {
        if (SPREADSHEET_ID) {
            return SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
        }
        return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    } catch(e) {
        console.error("Could not open spreadsheet. Ensure SPREADSHEET_ID is correct and you have permissions.", e);
        throw new Error("Spreadsheet not accessible. Please check configuration.");
    }
}

function createJsonResponse(obj) {
  // Helper function to format JSON responses consistently.
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function validateEmail(email) {
  // Basic email validation regex.
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}


// --- Email Function ---

function sendWelcomeEmail(email) {
  const subject = "🎉 Welcome to the CADagent PRO Waitlist!";
  const htmlBody = `
    <div style="font-family: 'JetBrains Mono', 'Fira Code', monospace; max-width: 600px; margin: auto; border: 1px solid #3E3E42; border-radius: 4px; overflow: hidden; background-color: #1E1E1E; color: #D4D4D4;">
      <div style="background-color: #007ACC; padding: 24px;">
        <h1 style="color: #FFFFFF; text-align: center; margin: 0; font-size: 28px;">CADagent PRO</h1>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #FFFFFF; margin-top: 0;">You're on the list!</h2>
        <p style="font-size: 14px; line-height: 1.6;">
          Thank you for joining the waitlist for CADagent PRO. You're one step closer to revolutionizing your CAD workflow with the power of AI.
        </p>
        <p style="font-size: 14px; line-height: 1.6;">
          As a waitlist member, you'll be the first to know when we launch and you'll receive an exclusive early-adopter discount.
        </p>
        <p style="font-size: 14px; line-height: 1.6;">
          We'll keep you updated with our progress. Stay tuned!
        </p>
        <p style="font-size: 14px; line-height: 1.6;">
          — The CADagent PRO Team
        </p>
      </div>
      <div style="background-color: #252526; padding: 16px; text-align: center; font-size: 12px; color: #858585;">
        <p style="margin: 0;">&copy; 2024 CADagent PRO. All rights reserved.</p>
      </div>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (e) {
      console.error("Failed to send welcome email to " + email, e);
  }
}
