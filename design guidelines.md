1. Color Palette

    Base Background: Very dark gray (#1E1E1E)

    Secondary Surfaces: Slightly lighter gray (#252526) for gutters, panels, dialogs

    Foreground/Text: Soft off‑white (#D4D4D4)

    Primary Accent: Vivid blue (#007ACC) for buttons, active states, focused outlines

    Error/Removal: Semi‑transparent red (#F14C4C80)

    Success/Addition: Semi‑transparent green (#73C99180)

2. Typography

    Font Family: Monospaced (e.g. Fira Code, JetBrains Mono), fallback system monospace

    Body/Text Size: 14 px (or equivalent 0.875 rem), line‑height ~1.6

    Fine Print (line numbers, labels): 12 px, muted gray (#858585)

3. Layout & Structure

    Top Toolbar: Single‑row, full‑width strip containing primary actions/icons

    Main Region:

        Center: Code or content view

        Right‑Docked Panel: Semi‑translucent background with slight blur, thin border

    Bottom Status Bar: Full‑width, colored (#007ACC) highlights for active items

4. Controls & Iconography

    Icons: Simple line‑icon set, 16×16 px; default light gray, accent‑blue on hover/focus

    Buttons:

        Primary: Rounded corners (4 px), solid #007ACC with white text

        Secondary: Transparent bg, subtle border, hover shade from secondary surface

    Inputs/Dropdowns: Dark background (#252526), thin border (#3E3E42), accent focus ring

5. Motion & Feedback

    Slide‑In Panels: Horizontal translate from 100 % to 0 over ~200 ms, ease‑out

    Ghost Text (Suggestions): Semi‑opaque light gray, italic, fade in/out ~120 ms

    Diff Highlights: Brief colored flash (green/red) on change for ~300 ms

Implementation Tips:

    Expose these values as theme variables or resource keys in your framework.

    Leverage your UI toolkit’s animation APIs for the panel slides and fade transitions.

    Keep your icon set consistent, stroke‑only, and sized at around 16 dp/px.

    Use a backdrop‑blur or translucency effect in the right‑dock if supported (otherwise simulate with a partially transparent fill).1. Color Palette

    Base Background: Very dark gray (#1E1E1E)

    Secondary Surfaces: Slightly lighter gray (#252526) for gutters, panels, dialogs

    Foreground/Text: Soft off‑white (#D4D4D4)

    Primary Accent: Vivid blue (#007ACC) for buttons, active states, focused outlines

    Error/Removal: Semi‑transparent red (#F14C4C80)

    Success/Addition: Semi‑transparent green (#73C99180)

2. Typography

    Font Family: Monospaced (e.g. Fira Code, JetBrains Mono), fallback system monospace

    Body/Text Size: 14 px (or equivalent 0.875 rem), line‑height ~1.6

    Fine Print (line numbers, labels): 12 px, muted gray (#858585)

3. Layout & Structure

    Top Toolbar: Single‑row, full‑width strip containing primary actions/icons

    Main Region:

        Center: Code or content view

        Right‑Docked Panel: Semi‑translucent background with slight blur, thin border

    Bottom Status Bar: Full‑width, colored (#007ACC) highlights for active items

4. Controls & Iconography

    Icons: Simple line‑icon set, 16×16 px; default light gray, accent‑blue on hover/focus

    Buttons:

        Primary: Rounded corners (4 px), solid #007ACC with white text

        Secondary: Transparent bg, subtle border, hover shade from secondary surface

    Inputs/Dropdowns: Dark background (#252526), thin border (#3E3E42), accent focus ring

5. Motion & Feedback

    Slide‑In Panels: Horizontal translate from 100 % to 0 over ~200 ms, ease‑out

    Ghost Text (Suggestions): Semi‑opaque light gray, italic, fade in/out ~120 ms

    Diff Highlights: Brief colored flash (green/red) on change for ~300 ms

Implementation Tips:

    Expose these values as theme variables or resource keys in your framework.

    Leverage your UI toolkit’s animation APIs for the panel slides and fade transitions.

    Keep your icon set consistent, stroke‑only, and sized at around 16 dp/px.

    Use a backdrop‑blur or translucency effect in the right‑dock if supported (otherwise simulate with a partially transparent fill).