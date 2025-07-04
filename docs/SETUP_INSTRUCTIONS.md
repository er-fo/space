# CADagent PRO Waitlist Setup Instructions

Follow these steps to deploy your waitlist website. This guide will walk you through setting up Google Sheets and Google Apps Script.

## 📋 Prerequisites

1.  **A Google Account** (e.g., your @gmail.com account).

---

## 🚀 Step 1: Set Up Your Google Sheet

This sheet will act as your database, storing emails from the waitlist.

1.  Go to [sheets.new](https://sheets.new) to create a new Google Sheet.
2.  **Rename the sheet** to something memorable, like "CADagent PRO Waitlist".
3.  **Set up the header columns.** In the first row (row 1), enter the following headers exactly as written:
    *   Cell `A1`: `Email`
    *   Cell `B1`: `Signup Date`
4.  **Copy the Spreadsheet ID.** The ID is the long string of characters in the URL.
    *   Example URL: `https://docs.google.com/spreadsheets/d/1qA2b3c4D5e6F7g8H9i0J_kLmnopqrstuvwxyz/edit`
    *   In this example, the ID is `1qA2b3c4D5e6F7g8H9i0J_kLmnopqrstuvwxyz`.
    *   **Keep this ID handy.** You'll need it in the next step.

---

## ⚙️ Step 2: Set Up the Google Apps Script

This script is the backend logic that connects your website to your Google Sheet.

1.  Go to [script.new](https://script.new) to create a new Apps Script project.
2.  **Rename the project** to "CADagent PRO Waitlist Backend".
3.  **Delete the default code** in the `Code.gs` file.
4.  **Copy and paste the entire content** from the `cadagentPRO-website/app_script.gs` file into the editor.
5.  **Set the Script Property:** This is where you'll securely store your Sheet ID.
    *   On the left-hand menu, click **Project Settings** (the gear icon ⚙️).
    *   Under **Script Properties**, click **Add script property**.
    *   Enter the following:
        *   **Property Name:** `SPREADSHEET_ID`
        *   **Value:** The Google Sheet ID you copied in Step 1.
    *   Click **Save script properties**.

---

## 🌐 Step 3: Deploy the Apps Script as a Web App

This makes your script accessible from your website.

1.  In your Apps Script project, click the **Deploy** button in the top-right corner.
2.  Select **New deployment**.
3.  Click the **gear icon** ⚙️ next to "Select type" and choose **Web app**.
4.  Configure the deployment:
    *   **Description:** `CADagent PRO Waitlist API v1`
    *   **Execute as:** `Me (your@email.com)`
    *   **Who has access:** `Anyone` (This is crucial for the website to be able to call it).
5.  Click **Deploy**.
6.  **Authorize access.** Google will ask you to review permissions for the script to access your spreadsheet and send emails. You must approve this.
    *   You may see a "Google hasn't verified this app" warning. Click **Advanced**, then **Go to [Your Project Name] (unsafe)**. This is safe because you wrote the code.
7.  **Copy the Web app URL.** After deployment, you will be given a URL. **Copy this URL.**

---

## ✅ Step 4: Final Configuration

The last step is to connect your website frontend to your new backend.

1.  **Open the `cadagentPRO-website/index.html` file** in your code editor.
2.  **Find the `<script>` tag** at the bottom of the file.
3.  **Update the placeholder variable:**
    *   Replace `'YOUR_GOOGLE_APP_SCRIPT_URL_HERE'` with the **Web app URL** you copied in Step 3.7.
4.  **Save the file.**

---

## 🎉 You're Done!

Your website is now fully configured. You can open the `index.html` file in your browser to test the waitlist. When you're ready to go live, you can host the `cadagentPRO-website` directory on any static web hosting service (like Netlify, Vercel, or GitHub Pages). 