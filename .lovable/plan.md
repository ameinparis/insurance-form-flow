## Font system swap

Replace Plus Jakarta Sans / Norms / Avenir with the new Google Fonts trio.

### Mapping
- **Headings (h1–h6, `font-heading`)** → Wix Madefor Display
- **Body + UI (`font-sans`, default)** → Outfit
- **Fallback** → Open Sans (then system-ui, sans-serif)

### Files to change

**1. `frontend/index.html`**
Replace the current Plus Jakarta Sans `<link>` with:
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Wix+Madefor+Display:wght@400..800&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
```

**2. `frontend/src/index.css`**
- Remove the local `@font-face` blocks for Avenir and Norms (no longer used).
- Body already inherits `font-sans` — no change needed there.

**3. `tailwind.config.ts` and `frontend/tailwind.config.ts`** (both files, kept in sync)
```ts
fontFamily: {
  sans: ['Outfit', 'Open Sans', 'system-ui', 'sans-serif'],
  heading: ['Wix Madefor Display', 'Outfit', 'Open Sans', 'system-ui', 'sans-serif'],
  // keep montserrat / inter / raleway as-is in case anything references them
}
```

**4. Memory update (`mem://index.md` + `mem://design/typography-and-fonts-v2`)**
Update the Core "Typography" line and the typography memory to reflect Outfit (body) + Wix Madefor Display (headings) + Open Sans fallback.

### Out of scope
- No size/weight/spacing changes — pure family swap.
- Leave `font-montserrat`, `font-inter`, `font-raleway` utility classes alone (unused in app, harmless).
- No PDF template font changes unless you want me to also update server-side HTML/PDF rendering — say the word and I'll include `backend/` templates.