# Deployment Guide: GitHub Pages & Strato

This guide will walk you through deploying your `cadagentPRO-website` to GitHub Pages and connecting it to your custom domain `cadagentpro.com` managed at Strato.

## Part 1: GitHub Setup

### 1. Create a Public GitHub Repository

First, you need a place on GitHub to store your website's code.

*   Go to [https://github.com/new](https://github.com/new).
*   Name your repository (e.g., `cadagentpro-website`).
*   Ensure the repository is set to **Public**.
*   Click **Create repository**.

### 2. Push Your Code to GitHub

Now, let's upload your local project files to the new GitHub repository.

*   On the new repository page on GitHub, you'll see instructions under "...or push an existing repository from the command line". Copy the commands provided. They will look like this:

    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
    git branch -M main
    git push -u origin main
    ```
*   Run these commands in your project's terminal. This will upload all your files.

### 3. Configure GitHub Pages

Next, we'll tell GitHub to serve your website from the `cadagentPRO-website` folder.

1.  In your new GitHub repository, go to **Settings** > **Pages**.
2.  Under **Build and deployment**, for the **Source**, select **Deploy from a branch**.
3.  Under **Branch**, select `main` and `/cadagentPRO-website` as the folder. Click **Save**.
4.  A green bar should appear saying "Your site is live at `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`". It might take a few minutes.
5.  Now, scroll down to the **Custom domain** section.
6.  Enter `cadagentpro.com` in the text box and click **Save**. This will use the `CNAME` file I already created for you.
7.  Wait a few minutes. You may see a message that your domain is not configured correctly. That's what we'll fix in Part 2.

## Part 2: Strato DNS Setup

Now we need to tell Strato that `cadagentpro.com` should point to GitHub's servers.

1.  **Log in** to your Strato Customer Login.
2.  In your package, navigate to **Domains** > **Domain management**.
3.  Find `cadagentpro.com` and click the **gear icon** (manage) next to it.
4.  Select **DNS settings**.
5.  You will need to configure the **A records** and the **CNAME record**.

### A Records (for `cadagentpro.com`)

You need to point your apex domain (`cadagentpro.com`) to GitHub's IP addresses.

*   Find the section for **A records**.
*   Delete any existing A records for the ` @ ` or `*` host if they exist.
*   Create **four separate A records**. For each, the **Prefix** should be `@` (or leave it blank if `@` isn't an option, as this represents the apex domain), and the **Value** will be one of the following IP addresses.

    ```
    185.199.108.153
    185.199.109.153
    185.199.110.153
    185.199.111.153
    ```

### CNAME Record (for `www.cadagentpro.com`)

To ensure `www.cadagentpro.com` also works, we'll point it to your main GitHub pages address.

*   Find the section for **CNAME records**.
*   For the **Prefix** (or Host), enter `www`.
*   For the **Value** (or "Points to"), enter your default GitHub Pages domain: `YOUR_USERNAME.github.io`. (Replace `YOUR_USERNAME` with your actual GitHub username).
*   **Save** your changes in the Strato DNS settings panel.

## Part 3: Final Steps

1.  **Wait.** DNS changes can take anywhere from a few minutes to several hours to propagate across the internet.
2.  **Check the status.** Go back to your GitHub repository's **Settings > Pages** section. After the DNS changes have propagated, you should see a green checkmark and a message saying "Your site is published at `http://cadagentpro.com/`".
3.  **Enforce HTTPS.** Once your site is published, check the box for **Enforce HTTPS**. This provides a free SSL certificate and ensures your site is secure. This option may take some time to become available.

That's it! Your website should now be live at `https://cadagentpro.com`. 