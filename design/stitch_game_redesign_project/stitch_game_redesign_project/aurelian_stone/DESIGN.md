# Design System Document: The Epic Sovereign

## 1. Overview & Creative North Star
**Creative North Star: "The Relic Interface"**
This design system moves away from the flat, sterile "SaaS-style" gaming UIs of the past decade. Instead, it treats the screen as a physical artifact—a digital relic found within the halls of the 'Great Kingdom'. The experience is defined by **Tonal Depth** and **Atmospheric Immersion**. 

We break the "template" look by utilizing intentional asymmetry, where stats and navigation are anchored by weighted corners, and content "breathes" through layered transparency. We aren't just building a menu; we are building a gateway into an epic fantasy world. Every interaction should feel heavy, deliberate, and premium.

---

## 2. Colors & Atmospheric Depth
Our palette is rooted in the darkness of an ancient fortress, illuminated by the warm glow of flickering torchlight (Gold/Amber) and the cool mysticism of the kingdom's ether (Blue).

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off UI elements. In a high-end fantasy setting, hard digital lines shatter immersion. Boundaries must be defined through:
- **Background Color Shifts:** Use `surface-container-low` for secondary information sitting on a `surface` background.
- **Subtle Tonal Transitions:** Use soft vignettes at the edges of scrollable areas.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Lowest Tier (`surface-container-lowest`):** Deep background/world map layers.
- **Mid Tiers (`surface-container-low` to `high`):** Floating parchment scrolls or stone tablets.
- **Highest Tier (`surface-container-highest`):** Active modal windows or legendary loot pop-ups.

### The "Glass & Gradient" Rule
To achieve a "magical" feel, use **Glassmorphism** for HUD elements. Apply `surface` colors with a 60-80% opacity and a heavy `backdrop-blur` (12px-20px). Use subtle linear gradients (e.g., `primary` #ffb68a to `primary_container` #dc7830) for CTAs to simulate the luster of forged gold.

---

## 3. Typography: The Scribe’s Hand
The typography system balances the authority of the 'Great Kingdom' with the readability required for mobile gaming.

*   **Display & Headlines (Noto Serif):** This is our "Editorial" voice. Used for location names, quest titles, and legendary item headers. The serif nature evokes history and weight.
*   **Titles & Body (Manrope):** Our functional workhorse. Manrope provides high legibility for game stats and lore descriptions at small mobile sizes.
*   **Labels (Space Grotesk):** Used for technical data, cooldown timers, and button labels. The monospaced-adjacent feel suggests "mechanical" or "systemic" information.

**Hierarchy Strategy:** Use extreme scale contrast. A `display-lg` headline should tower over `body-md` lore text to create a sense of epic proportion.

---

## 4. Elevation & Depth: Tonal Layering
We do not use standard Material Design drop shadows. We use **Ambient Light**.

*   **The Layering Principle:** Depth is achieved by "stacking" tones. Place a `surface-container-lowest` card on a `surface-container-low` section to create a "recessed" slot effect.
*   **Ambient Shadows:** For floating dialogs, use extra-diffused shadows. 
    *   *Spec:* `Box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);` 
    *   The shadow should never be pure black; it should be a deep tint of our `#11131e` background.
*   **The "Ghost Border" Fallback:** If a separator is required for accessibility, use the `outline_variant` at **15% opacity**. It should feel like a faint scratch in stone, not a drawn line.
*   **Metallic Lustre:** Apply a 1px inner-glow (top-down) using `primary_fixed` at 20% opacity on gold-themed buttons to simulate a beveled metallic edge.

---

## 5. Components

### Buttons (The "Sigils")
*   **Primary (Action):** Background uses a gradient of `primary` to `primary_container`. Bold `on_primary` text. Use `xl` roundedness (0.75rem) to feel ergonomic for thumbs.
*   **Secondary (Navigation):** `surface_container_high` background with a `primary` Ghost Border (20% opacity).
*   **Tertiary (Minor):** No background. `primary` text with a subtle underline or icon.

### Cards & Stats (The "Tablets")
*   **Forbid Divider Lines:** Separate stats using vertical white space or by placing values in `surface_container_lowest` "wells."
*   **Header Shimmer:** Use a subtle `surface_bright` sweep animation across rarity-based cards (Epic/Legendary) to imply texture.

### Input Fields
*   **Style:** Recessed (inset) look. Use `surface_container_lowest` background. 
*   **Active State:** The border glows with a soft `primary` (gold) outer-glow rather than a sharp color change.

### Selection Chips
*   **Selected:** `secondary_container` background with `on_secondary_container` text.
*   **Unselected:** `surface_variant` with 40% opacity.

### Navigation Bar
*   **Mobile-First HUD:** A floating container at the bottom using Glassmorphism. Icons use `tertiary` color when inactive and `primary` (gold) with a small glow-dot when active.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts for character stats—it feels more "custom" and less like a spreadsheet.
*   **Do** use `backdrop-blur` on all overlays to maintain the atmosphere of the game world behind the UI.
*   **Do** prioritize the "Gold" (`primary`) for critical path actions only. Overusing it dilutes the "Epic" feeling.

### Don't:
*   **Don't** use 100% opaque black backgrounds. It kills the depth. Use `surface` (#11131e).
*   **Don't** use standard "X" close buttons for everything. Use "Close" labels in `label-md` or integrated back-arrows that match the UI's metallic/stone aesthetic.
*   **Don't** use sharp 0px corners. Even a "stone" UI needs the `sm` (0.125rem) or `md` (0.375rem) radii to feel premium on high-resolution mobile screens.

---

## 7. Signature Texture Integration
While the tokens provide the color, the **Visual Soul** comes from the application of "Metallic Micro-Gradients." 
*   **Gold Accents:** Use a 45-degree linear gradient for any gold element to prevent it from looking like "flat yellow."
*   **Stone Surfaces:** Apply a very low-opacity (2-4%) noise texture overlay on `surface-container` tiers to simulate grain.