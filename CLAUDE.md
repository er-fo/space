# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CADAgent PRO is a landing page website for an AI assistant that helps users edit CAD models with natural language. This is a hybrid application:
- **Frontend**: Static website served via Flask on Fly.io
- **Backend**: Python API with CAD libraries (cadquery, cadquery-ocp) on Fly.io
- **Authentication**: Supabase OAuth integration
- **Waitlist**: Google Apps Script integration (existing)
- **Demo Generation**: Google Apps Script for AI prompts + Fly.io for CAD execution
- **Deployment**: Single Docker container on Fly.io

## Development Commands

### Local Development
1. **Frontend**: Open `index.html` directly in a browser or use `flyctl dev`
2. **Backend**: `flyctl dev` to spin up local container with Python API
3. **Testing**: Manual testing by opening HTML files in browser

### Deployment
1. **Fly.io Deployment**: `flyctl deploy` (replaces GitHub Pages auto-deploy)
2. **CI/CD**: GitHub Actions can trigger `flyctl deploy` on merge to main
3. **Environment**: Use `flyctl secrets set` for API keys and configuration

## Architecture & Structure

### Core Files
- `index.html` - Main landing page with waitlist signup and OAuth integration
- `oauth.html` - OAuth authentication page with Google/GitHub providers
- `auth/callback.html` - OAuth callback handler that redirects after authentication
- `privacy.html` - Privacy policy page
- `terms.html` - Terms of service page
- `app.py` - Flask application for serving static files
- `fly.toml` - Fly.io deployment configuration
- `Dockerfile` - Container configuration for Fly.io deployment
- `requirements.txt` - Python dependencies (Flask only)
- `google-apps-script-cadagent.js` - Google Apps Script for demo functionality

### Key Components

#### Landing Page (`index.html`)
- Self-contained HTML with inline CSS and JavaScript
- Waitlist signup form with Google Apps Script integration
- OAuth authentication alternative flow
- Responsive design with mobile-first approach
- Uses Supabase for user authentication

#### Authentication Flow
1. User clicks "Create Account" → `oauth.html`
2. User selects OAuth provider (Google/GitHub)
3. Redirects to `auth/callback.html` for session handling
4. Returns to `index.html` with success message

#### Design System
- **Color Palette**: Dark theme with gradient backgrounds
- **Typography**: Inter for UI text, JetBrains Mono for brand elements
- **Brand Colors**: Cyan-blue gradients (`#0BA5EC` → `#0069CB`), purple accents (`#8B5CF6` → `#4B32B7`)
- **Spacing**: 4px grid system with 8px/16px units

### External Integrations

#### Google Apps Script
- **Waitlist Endpoint**: Your existing Google Apps Script for waitlist signups
- **Demo Pipeline Endpoint**: `https://script.google.com/macros/s/AKfycbxPlvx22GLNoxfA8gD-WFApZB3P90911S3tDNfZ9yK7zBXNBVJXAgHPCv6zgYug06upyQ/exec`
- **Actions**: 
  - `signup` - Handles email collection for waitlist signups (existing script)
  - `generate_cad_pipeline` - Generates CAD plans via Anthropic API for demo functionality
- **Configuration**: Requires Anthropic API key for demo features

#### Supabase Authentication
- Project URL: `https://xtjgpksaiqzcbmxeklas.supabase.co`
- Supports OAuth with Google and GitHub providers
- Session persistence enabled

## Design Guidelines

Follow the complete design system documented in `design guidelines.md`:

### Color Variables
```css
--gradient-cyan-blue: linear-gradient(135deg, #0BA5EC 0%, #0069CB 100%);
--gradient-purple-violet: linear-gradient(135deg, #8B5CF6 0%, #4B32B7 100%);
--gradient-core: linear-gradient(180deg, #1E1E1E 0%, #232538 100%);
--primary-text: #E0E0E0;
--secondary-text: #A1A1AA;
```

### Typography
- **Brand/Headers**: JetBrains Mono, 700 weight
- **Body Text**: Inter, 400-600 weight
- **Monospace Elements**: JetBrains Mono for code-like elements

### Interaction Patterns
- Hover effects: 1.04 scale with brightness(1.1)
- Button transitions: 120ms ease-in-out
- Focus states: Purple accent glow (#8B5CF6)

## Content Strategy

### Supported CAD Software
Current list includes: SolidWorks, AutoCAD, SketchUp, Solid Edge, Onshape, Fusion 360 (coming soon), Blender, FreeCAD, Revit

### Brand Messaging
- "Completely Free" - emphasized throughout
- Natural language CAD editing
- "No menu hunting, no steep learning curves"
- Focus on workflow efficiency and simplicity

## File Modifications

When editing files:
- Maintain inline CSS/JS structure in HTML files
- Preserve responsive design breakpoints
- Keep brand color consistency
- Ensure OAuth flow remains functional
- Test form submissions and error handling

## Demo Backend Setup

### Hybrid Architecture
The demo functionality uses both Google Apps Script and Fly.io:

1. **Google Apps Script**: Handles AI prompt generation via Anthropic API
2. **Fly.io**: Executes the generated Python/CadQuery code to create 3D models

### Google Apps Script Setup
1. **Setup**: Deploy the Google Apps Script (`google-apps-script-cadagent.js`) 
2. **Configuration**: Add your Anthropic API key to line 9 of the script
3. **Deployment**: Deploy as Web App with "Anyone" permissions
4. **Integration**: The script URL is configured in `index.html`

### Fly.io Setup
1. **Deploy**: `flyctl deploy` to deploy the Flask app with CAD libraries
2. **Endpoint**: `/api/execute` receives Python code and returns GLTF models
3. **Dependencies**: Full CAD library stack (cadquery, cadquery-ocp)

### Demo Flow
1. User enters prompt → Google Apps Script generates Python code
2. Python code sent to Fly.io → CadQuery executes and generates GLTF
3. GLTF model displayed in browser

### Security Features
- API key stored securely in Google Apps Script (never exposed to frontend)
- CORS automatically handled by both services
- Input validation and error handling
- Isolated Python execution environment on Fly.io

## Fly.io Deployment

### Migration from GitHub Pages
**Previous**: GitHub Pages with auto-deploy on push to main
**Current**: Fly.io with Docker containers supporting both static frontend and Python backend

### Configuration
- **Domain**: cadagentpro.com (A/AAAA records pointing to Fly.io)
- **SSL**: Auto-managed via `flyctl certs add cadagentpro.com`
- **Deployment**: `flyctl deploy` (manual or via GitHub Actions)
- **Environment**: Docker-based with full Python runtime

### Key Considerations

#### 1. DNS Migration
- **GitHub Pages**: CNAME to `username.github.io`
- **Fly.io**: A/AAAA records to Fly's anycast IPs
- **TTL**: Lower temporarily during migration to minimize downtime

#### 2. Build Pipeline
- **GitHub Pages**: Auto-build from repository files
- **Fly.io**: Dockerfile-based build with Python dependencies
- **CI/CD**: GitHub Actions with `flyctl deploy` on merge to main

#### 3. Environment & Scaling
- **Runtime**: Flask server + CAD libraries for demo functionality
- **Dependencies**: Heavy CAD libraries (cadquery, cadquery-ocp) now supported
- **Scaling**: Configurable VM size and instance count via `fly.toml`
- **Regions**: Select regions closest to users for optimal performance

#### 4. Cost Structure
- **GitHub Pages**: Free for public repos, unlimited bandwidth
- **Fly.io**: Free tier (3 shared-cpu VMs, 160MB RAM each, 3GB outbound/month)
- **Monitoring**: Track bandwidth usage to avoid overage charges

#### 5. Caching Strategy
- **GitHub Pages**: Global CDN automatic
- **Fly.io**: Anycast network; consider external CDN (Cloudflare) for heavy caching
- **Headers**: Configure Cache-Control in server/Docker setup

#### 6. Development Workflow
- **Local**: `flyctl dev` for container-based local development
- **Testing**: Mirror production environment locally
- **Rollbacks**: `flyctl releases revert <ID>` for quick rollbacks

### Deployment Commands
```bash
# Deploy to Fly.io
flyctl deploy

# Local development
flyctl dev

# Manage secrets
flyctl secrets set API_KEY=your_key

# View logs
flyctl logs

# Scale application
flyctl scale count 2
flyctl scale memory 512
```