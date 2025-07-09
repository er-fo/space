# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CADAgent PRO is a landing page website for an AI assistant that helps users edit CAD models with natural language. This is a static website deployed via GitHub Pages that captures waitlist signups and provides OAuth authentication.

## Development Commands

Since this is a static website, there are no build commands or test scripts. Development workflow:

1. **Local Development**: Open `index.html` directly in a browser
2. **Deployment**: Push to main branch for automatic GitHub Pages deployment
3. **Testing**: Manual testing by opening HTML files in browser

## Architecture & Structure

### Core Files
- `index.html` - Main landing page with waitlist signup and OAuth integration
- `oauth.html` - OAuth authentication page with Google/GitHub providers
- `auth/callback.html` - OAuth callback handler that redirects after authentication
- `privacy.html` - Privacy policy page
- `terms.html` - Terms of service page

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
- Waitlist signup endpoint: `https://script.google.com/macros/s/AKfycbxPlvx22GLNoxfA8gD-WFApZB3P90911S3tDNfZ9yK7zBXNBVJXAgHPCv6zgYug06upyQ/exec`
- Handles email collection for early access signups

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

### Google Apps Script Backend
The demo section uses Google Apps Script to handle Anthropic API calls securely:

1. **Create Google Apps Script**: Follow `SETUP-GOOGLE-SCRIPT.md` instructions
2. **Deploy as Web App**: Set permissions to "Anyone" for public access
3. **Update index.html**: Replace `YOUR_SCRIPT_ID` with your actual script ID
4. **Test functionality**: Demo should work with real AI-generated 3D models

### API Actions
- `generate` - Generate 3D model from text prompt using Anthropic API
- `signup` - Handle email signups (existing functionality)

### Security Features
- API key stored securely in Google Apps Script (never exposed to frontend)
- CORS automatically handled by Google Apps Script
- Input validation and error handling
- No server maintenance required

## GitHub Pages Deployment

- **Domain**: cadagentpro.com (configured via CNAME)
- **Branch**: main (auto-deploys on push)
- **Static Assets**: All resources are self-contained or CDN-hosted
- **Backend**: Google Apps Script (serverless, no hosting required)