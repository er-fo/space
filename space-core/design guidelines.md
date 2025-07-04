# CADAgentPRO – Design Guidelines

## 1. Color Palette

### Base Colors
- **Base Background:** `#1E1E1E` – Dark neutral base
- **Secondary Surfaces:** `#252526` – Panels, gutters, dialogs
- **Panel Depth Overlay:** `linear-gradient(#1E1E1E, #212121)` with optional 6% texture/noise overlay

### Foreground/Text
- **Primary Text:** `#D4D4D4` – Soft off-white
- **Secondary Text / Labels:** `#858585` – Muted gray
- **Ghost Text:** `rgba(212, 212, 212, 0.6)` – Light italic suggestions

### Accent Colors
- **Primary Accent (default):** `#0BA5EC` – Elevated blue for focused elements
- **AI Assist Accent (optional dual-mode):** `#73C991` – Green for intelligent agent states
- **Error/Removal:** `#F14C4C80` – Semi-transparent red
- **Success/Addition:** `#73C99180` – Semi-transparent green

## 2. Typography

### Font Families
- **Primary Monospace:** `IBM Plex Mono`, `JetBrains Mono`, fallback: system monospace
- **Secondary UI Text:** `Inter`, `SF Pro`, fallback: system UI sans-serif

### Sizing
- **Body Text:** 14px (0.875rem), line-height: 1.6
- **Labels / Fine Print:** 12px, muted gray
- **Toolbar/Controls:** 13px semi-bold
- **Agent Replies:** 13px italic, blue-tinted or semi-muted

## 3. Layout & Structure

### Top Toolbar
- Full-width, single-row
- One-pixel dividers between tool groups
- 16px stroke-only icons with consistent spacing
- Optional glow edge on hover

### Main Region
- **Center:** Code, model, or content view
- **Right-Docked Panel:**
  - Semi-translucent `#252526`
  - Thin border (`#3E3E42`) or glow edge
  - Backdrop blur (12px) if supported
  - Modular snap-in sections, tabs, or inspector views

### Bottom Status Bar
- Full-width
- Highlight color stripe matching current tool or agent state
- Optional micro-indicators (dot or label states)

## 4. Controls & Iconography

### Icons
- Stroke-only set (1.5px)
- Size: 16×16px
- Default color: `#D4D4D4`, hover/focus: `#0BA5EC`
- Visual metaphors: wireframe cubes, orbit controls, inspection tools

### Buttons
- **Primary:** Rounded corners (4px), solid fill `#0BA5EC`, white text
- **Secondary:** Transparent background, thin border, hover = darker surface shade

### Inputs / Dropdowns
- Background: `#252526`
- Border: `#3E3E42`
- On focus: accent ring `#0BA5EC` with light glow

## 5. Motion & Interaction Feedback

### Motion Principles
- No bounce; only smooth, confident transitions
- Snap-like movement on actions (as if precision-fit)

### Timings
- **Slide-in Panels:** 200ms ease-out
- **Hover Effects:** 120ms fade + slight Z-scale (1.00 → 1.04)
- **Ghost Text Fade:** 100ms in/out, light blur
- **Diff Highlights:** 300ms green/red flash on content change
- **Error Feedback:** Small jitter animation (1px shift)

### Agent Interaction Cues
- Floating command orb (bottom right) with pulse when active
- Slide-in context panels triggered by agent response
- Blueprint-style callout overlays for suggestions

## 6. Visual Identity & Differentiation

### Visual Style
- Industrial minimalism with subtle depth
- High contrast line work, sharp geometry
- Micro-gradients, occasional inner shadows
- Layered backgrounds with mild materiality (e.g. grid overlays, carbon texture)

### Layout Metaphors
- CAD inspection panels over dev editor layout
- Visual cues from SolidWorks, Fusion360: precision, measurement lines, technical UI
- Avoid generic flat sections — use modular structure, subtle transitions, and grid alignment

## 7. Design Tokens (Example)

```json
{
  "color.background.base": "#1E1E1E",
  "color.surface.secondary": "#252526",
  "color.accent.primary": "#0BA5EC",
  "color.text.primary": "#D4D4D4",
  "font.family.mono": "'IBM Plex Mono', monospace",
  "font.family.ui": "'Inter', sans-serif",
  "motion.default": "200ms ease-out",
  "icon.strokeWidth": "1.5"
}
