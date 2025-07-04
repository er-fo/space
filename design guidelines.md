# CADAgentPRO – Design Guidelines

## 1. Color Palette

### Background Gradients
Use smooth vertical or diagonal gradients for background layering to add richness, depth, and mood.

#### Primary Dark Gradient
- From: `#1E1E1E`
- To: `#232538`

#### Blue Accent Gradient
- From: `#0BA5EC` (cyan-blue)
- To: `#0069CB` (deep azure)

#### Purple Gradient
- From: `#8B5CF6` (electric violet)
- To: `#4B32B7` (deep royal purple)

#### Pink Accent Gradient
- From: `#F472B6` (soft neon pink)
- To: `#C026D3` (bold magenta)

### Surface Layers
- **Base Panel:** `#1E1E1E` → `#252526` (flat dark, used in cards and panels)
- **Backdrop Blur Layer:** Semi-transparent with 12px `backdrop-filter: blur`

### Foreground/Text
- **Primary Text:** `#E0E0E0` – Balanced neutral white
- **Secondary Text / Labels:** `#A1A1AA` – Cool muted gray
- **Ghost Text / Hints:** `rgba(224, 224, 224, 0.6)` – Light italic or blurred

### Functional Accent Colors
- **Success (AI OK):** `#6EE7B7` (green mint)
- **Error (Warning/Conflict):** `#F87171` (salmon red)
- **AI Active Glow:** Cyan → Purple or Blue → Pink animated pulse

## 2. Typography

### Font Families
- **Primary:** `IBM Plex Mono`, `JetBrains Mono`, fallback: system monospace
- **Secondary UI Text:** `Inter`, `Söhne`, or `SF Pro`

### Type Hierarchy
| Use Case           | Font             | Size   | Style           |
|--------------------|------------------|--------|------------------|
| Body Text          | Mono             | 14px   | Normal           |
| UI Labels          | Inter            | 12px   | Uppercase, muted |
| Toolbar Items      | Mono             | 13px   | Semi-bold        |
| Agent Replies      | Mono/Italic      | 13px   | Accent-tinted    |
| Terminal Output    | JetBrains Mono   | 12px   | Code style       |

## 3. Layout & Structure

### Layout Zones
- **Toolbar:** Full-width, hard edge or soft gradient underlay
- **Main Region:** Code or 3D workspace view
- **Right Docked Panel:** Modular, semi-transparent, blur, edge-lit
- **Bottom Status Bar:** Active gradient pulse with live glow indicators

### Spacing & Rhythm
- Use a **4px spacing grid**, with clear 8px/16px units for padding/margin
- **Line-height:** ~1.6 for text-heavy regions

## 4. Controls & Iconography

### Icons
- Format: SVG, stroke-only
- Size: 16×16px
- Color: `#E0E0E0`, hover/focus = accent tint (cyan/purple)
- Visual Style: Clean line art, CAD references (cube, orbit, bracket, path)

### Buttons
| Type       | Style                                             |
|------------|----------------------------------------------------|
| Primary    | Gradient fill (blue → purple), white text, rounded |
| Secondary  | Transparent, 1px border, hover = color tint        |
| Tertiary   | Text-only, subtle underline on hover               |

### Inputs / Dropdowns
- Dark input surface `#252526`
- Thin border `#3E3E42`
- Focus Ring: Glow or 2px outline in `#8B5CF6` or `#0BA5EC`

## 5. Motion & Interaction

### Timing Rules
| Motion Type      | Duration | Easing         |
|------------------|----------|----------------|
| Panel Slide      | 200ms    | ease-out       |
| Ghost Text Fade  | 100ms    | linear fade    |
| Hover Effects    | 120ms    | ease-in-out    |
| Status Flash     | 300ms    | linear in-out  |

### Motion Examples
- **Slide-In Panels:** From 100% right with ease-out
- **Button Hover:** Accent glow + 1.04 scale bump
- **AI Pulse:** Animate background (cyan → purple or blue → pink gradient loop)
- **Error Jiggle:** 1px offset animation with shake-in place

## 6. Agent Visual Identity

### Agent Indicator
- Circular floating orb (bottom-right or header)
- Glow ring with animated gradient pulse (blue → violet)
- Enlarges slightly during active listening

### Suggestions / Hints
- Displayed as floating “callout labels” with tail lines (like CAD annotations)
- Transparent gradient background, subtle shadow, fade-in

## 7. Brand Gradients

Use the following key gradients across branding and UI accents:

```css
--gradient-cyan-blue: linear-gradient(135deg, #0BA5EC 0%, #0069CB 100%);
--gradient-purple-violet: linear-gradient(135deg, #8B5CF6 0%, #4B32B7 100%);
--gradient-pink-fuchsia: linear-gradient(135deg, #F472B6 0%, #C026D3 100%);
--gradient-core: linear-gradient(180deg, #1E1E1E 0%, #232538 100%);
