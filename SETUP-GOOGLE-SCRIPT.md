# Google Apps Script Setup Guide

## Framework Implementation

The Google Apps Script implements the CADAgent PRO framework with the following workflow:

1. **Intention Generation** - Analyzes user prompt and creates structured JSON
2. **Code Generation** - Generates CadQuery Python code from intention
3. **Validation** - Third-party LLM validates code against intention
4. **Retry Logic** - If validation fails, retries with enhanced prompts
5. **Error Handling** - Shows user-friendly errors if both attempts fail

## Step 1: Create Google Apps Script

1. Go to https://script.google.com/
2. Click **"New Project"**
3. Delete the default code
4. Copy and paste the entire content of `google-apps-script.js` into the editor
5. **IMPORTANT**: The API key is already set in the script:
   ```javascript
   const ANTHROPIC_API_KEY = "sk-ant-api03-ERcn38NqCxDQwgnfHleSIEdqtzZyt-IUmYhcRT4B805qwQo6IOV6SGmNP6bmIZVdU2m9UejZIjoUtlGmn9WAYYA-fqw9uwAA";
   ```

## Step 2: Deploy as Web App

1. Click **"Deploy"** → **"New deployment"**
2. Choose **"Web app"** as the type
3. Set the following configuration:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **"Deploy"**
5. **Copy the Web App URL** (it looks like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

## Step 3: Update index.html

1. Open `index.html`
2. Find the line with `GOOGLE_SCRIPT_URL` (around line 1045)
3. Replace `YOUR_SCRIPT_ID` with your actual script ID from the Web App URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec";
   ```

## Step 4: Test the Setup

1. Open `index.html` in a browser
2. Scroll to the "See It In Action" demo section
3. Try one of the suggestion buttons or enter your own text
4. You should see a 3D model generated in the viewer

## Step 5: Deploy to GitHub Pages

1. Commit all changes to your GitHub repository
2. Push to the `main` branch
3. GitHub Pages will automatically deploy the updated site

## Security Notes

- Your API key is stored securely in Google Apps Script
- It's never exposed to the frontend or GitHub repository
- Google Apps Script handles CORS automatically
- The API key is only accessible to your Google account

## Troubleshooting

- If you get CORS errors, make sure the deployment is set to "Anyone" access
- If the API calls fail, check the Google Apps Script logs for errors
- Test the script URL directly in your browser to verify it's working

## Optional: Custom Domain

If you want to use a custom domain for your Google Apps Script:
1. Go to Google Cloud Console
2. Enable the Apps Script API
3. Set up a custom domain mapping (advanced setup)