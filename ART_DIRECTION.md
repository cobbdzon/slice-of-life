# Art Direction — Slice of Life

> Read this before creating or replacing any illustration in this repo. It is the brief, the palette, the engineering standard, and the QA checklist. Copy the short brief at the bottom into a task when handing artwork to another agent.

## 1. What the artwork must say

Slice of Life is a **private, one-entry-a-day journal**. The art should feel like:

- **Quiet and warm** — dusk light, paper, lamplight, a moment kept for yourself.
- **Personal, not corporate** — no dashboards, charts, generic “productivity” props, or stock icons.
- **Crafted** — hand-authored vector shapes with deliberate overlaps and breathing room.
- **Optimistic, not nostalgic** — warm peach and pink against deep plum, never sepia or grayscale.

The artwork is decorative. The interface is Material Design 3; the illustration should feel like a **paper object in an M3 room**, not a screenshot of the app.

### Non-negotiables

1. One cream paper focal object per composition; every other prop supports it.
2. Colors only from the palette below (or a documented derivation).
3. No text, no UI chrome, no stock icons.
4. One light source; all shadows fall downward.
5. Render the SVG and inspect it at 320px before calling it done.

## 2. Visual language

### Reuse these motifs

| Motif | Purpose | Rules |
|---|---|---|
| Arched window | The frame; “a slice of the day” | Tall arch, 18–24px rim, dusk sky inside |
| Sun + hills | Dusk, warmth, a day ending | Radial-gradient sun, plum hill silhouettes, clouds and 2 birds max |
| Cream paper / open journal | The private entry | Warm off-white, 26–38px radii, pink paper edge, spine fold |
| Calendar chip | One entry per day | 3×3 dot grid, exactly one filled/selected day, binder rings |
| Photo print / media card | Photos and video | Cream border + tape, or dark tile + play button; never both photos in one composition |
| Lock badge | Privacy | Small circular plum badge, cream lock, no other lock icons |
| Week dots | Daily rhythm | 5 dots, one larger/filled, on the paper only |
| Pen | The act of writing | Peach body, plum cap/clip, dark nib, rests on paper |
| Sparkles | Delight | 2–4 maximum; 4-point curved stars and small dots |

### Do not add

- New metaphors (phones, laptops, charts, plants, speech bubbles, gears, hearts).
- UI chrome inside the illustration (fake buttons, nav bars, cursor arrows).
- Text of any kind. Use live HTML text outside the SVG.
- Gradients on every prop. Reserve gradients for the background, sky/sun, and photo.

## 3. Palette

All illustration colors come from the app’s dark M3 scheme. Hardcoded hex is acceptable **for fixed artwork** (the app is dark-only), but every color must come from this table or be a documented derivation of one. UI colors must use `var(--md-sys-color-*)`.

| Role | Hex | M3 token |
|---|---|---|
| Page background | `#181115` | `background` / `surface` |
| Deepest background | `#130c0f` | `surface-container-lowest` |
| Tonal background | `#251d21` | `surface-container` |
| Raised surface | `#3b3236` | `surface-container-highest` |
| Outline | `#504349` | `outline-variant` |
| Primary pink | `#fcb0d6` | `primary` |
| Plum structure | `#6c3453` | `primary-container` |
| Deep plum ink | `#511d3c` | `on-primary` |
| Soft pink | `#fdd9e8` | `secondary-fixed` |
| Dusty pink | `#dfbdcc` | `secondary` |
| Pale pink | `#ffd8e9` | `on-secondary-container` |
| Peach | `#f3ba9b` | `tertiary` |
| Peach shadow | `#643d26` | `tertiary-container` |
| Paper | `#ffdbc9` | `tertiary-fixed` |
| Entry ink | `#311302` | `on-tertiary-fixed` |
| Body text | `#eedfe3` | `on-background` |
| Muted text | `#d4c2c8` | `on-surface-variant` |

**Documented derivations** (do not invent more):

- `#5a2b44` — arch rim, book cover. Primary-container darkened for structure.
- `#ffe4d6` — right-hand journal page. Tertiary-fixed lightened.
- `#fff1e8` — photo border, warm near-white. Never use pure `#fff`.
- `#7c3b52`, `#8c4a5a`, `#b06468`, `#d48a6d` — sunset gradient intermediates between primary and tertiary. Only inside sky/photo gradients.

Rules:

- Cream paper is the **brightest large value** in the scene. There is only one paper focal object per composition.
- Pink is the accent, peach is the warmth, plum is the structure. Keep that hierarchy.
- No teal, blue, green, yellow, or pure black backgrounds.
- Shadows are black at 28–40% opacity, always offset downward (`dy > 0`), never colored.
- Opacity for text lines: title 0.7–0.8, body 0.28–0.34, decorative dots 0.18–0.25.

## 4. Composition

### Canvas contracts

| Artwork | Canvas | Display | Mobile |
|---|---|---|---|
| Landing hero (`landing-hero-art.svg`) | `0 0 520 520` | Image in the hero grid, max 420px | **Hidden at ≤640px** |
| Auth cover (`login-illustration.svg`) | `0 0 800 960` | 533×640 cover column, `object-fit: cover` | **Always visible**, 160px band |

### Layering order

1. Full-bleed background gradient (and at most two tonal radial glows).
2. Arch frame + clipped scene (sky → sun glow → sun → haze → clouds → birds → hills).
3. Floating props: calendar, media card, detached sheets.
4. Paper object (page card or open journal), including its cover/shadow.
5. Paper content: label, title/body lines, lock, week dots, photo print, pen.
6. Sparkles and dots.

Every prop should **touch or overlap** the next one. Nothing important floats in a corner without a relationship to the scene.

### Landing hero

- Square as a postcard. One paper card, one calendar, one media card, one arch.
- Focal point: the cream page over the lower two-thirds.
- Arch top near y=64, page top near y=270, page bottom near y=480. Keep 30–50px margins.
- Media card sits on the page corner; calendar floats upper-left over the arch.

### Auth cover

- Portrait, more air, an **open journal** instead of a single page.
- Focal point: the open spread in the lower-middle; the arch sunset above it.
- The HTML overlay adds a dark gradient over the bottom 45% on desktop and a stronger, taller scrim on mobile, where the cropped paper sits directly behind the brand. Keep the **bottom ~160px quiet** (dark background, no essential detail).
- Keep the meaningful content within the central safe zone: x≈80–720, y≈200–800.
- Books/pages should sit on the arch axis; do not let the arch continue below the book as a visible slab.
- Mobile crop is centered by `object-fit: cover`. Check 360×160 and 624×160; the sun, book, and at least one prop must remain readable.
- The mobile center crop often puts the cream paper directly behind the brand text. The overlay gradient must carry the contrast; re-check it whenever the paper shape changes.

## 5. Responsive behavior

| Breakpoint | Landing | Auth |
|---|---|---|
| >1080 | 2-column hero; art 420px | 2-column shell (≥880); cover ≈533×640 |
| 901–1080 | 2-column hero; art 360px | 2-column shell (≥880) |
| 881–900 | 1-column hero; art 380px centered | 2-column shell (≥880) |
| 641–880 | 1-column hero; art 380px centered | stacked shell; cover 160px band |
| ≤640 | **Art hidden** (`display: none`) | stacked shell; cover 160px band, art visible |

Rules:

- SVGs scale via `viewBox` only. Do not put fixed `width`/`height` attributes on files loaded through `<img>`; let CSS set `width: 100%; height: auto; aspect-ratio: …`.
- Use `object-fit: cover` for the auth cover. The art must survive center-cropping.
- On mobile, give `.auth-cover` an explicit `height` (160px), not just `min-height`. The image's 800:960 intrinsic ratio otherwise drives the auto grid row to ~1.2× its width. Also set `grid-template-rows: auto 1fr` on the shell so the cover row does not stretch to fill the viewport; `min-height` alone caps nothing.
- Verify the real rendered page at 360×640, 390×844, and 624×900, not only synthetic crops. The cover must stay at its intended band height and the form should fit without scrolling on common phones.
- If you change the composition, re-verify both the desktop cover and the 360×160 mobile crop.
- The landing art is hidden on phones **only**; the auth art is never hidden on mobile.

## 6. SVG authoring standards

### Skeleton

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520" fill="none" role="img" aria-labelledby="id-title">
  <title id="id-title">Short description of the scene</title>
  <defs>…</defs>
  <!-- background -->
  <!-- arch -->
  <!-- props -->
  <!-- paper -->
  <!-- sparkles -->
</svg>
```

- Root: `fill="none"`; every shape declares its own `fill`.
- `viewBox` always. No `width`/`height` for repo illustrations.
- Prefix every `id` with the file’s initials (`lha-` landing hero, `aa-` auth art) so clip paths, filters, and gradients stay unique and debuggable.
- Use shape primitives (`rect`, `circle`, `ellipse`) for simple geometry; paths for arches, book pages, hills, and organic forms.
- Use `clipPath` for scene interiors and photo frames. Do not fake clipping with oversized shapes or masks.
- Filters: two tiers only — `…-shadow` for floating cards (`dy 14–18`, `stdDeviation 16–20`, black 38–42%) and `…-print-shadow` for objects on paper (`dy 6–8`, `stdDeviation 6`, black 28%).
- Maximum 3 decimal places; 2 is usually enough.
- Logical `<g>` groups with short comments. No geometry narration (“path here”).
- No `<text>`, no external fonts/images, no scripts, no `<sodipodi:*>`/`<inkscape:*>` metadata, no `xlink:href`.
- Accessibility: decorative images use `alt=""` plus `aria-hidden="true"` on the `<img>`; the SVG may still carry a `<title>` for standalone viewing.

## 7. Reusable geometry

### Arch

Arch width determines the radius: `r = width / 2`.

```xml
<!-- width 264, top 64, bottom 452 -->
<path d="M128 452 V196 A132 132 0 0 1 392 196 V452 Z"/>
```

The `A r r 0 0 1` sweep draws the top semicircle from left shoulder to right shoulder. Inner scene = same path inset by the rim thickness.

### Journal page

```xml
<rect x="112" y="268" width="288" height="196" rx="26" fill="#ffdbc9"/>
```

Rotate ±3–4° around its center. Add a pink sheet behind, offset ~8–10px down, to suggest a stack of paper.

### Open journal

- Spine at the canvas center (x=400 on the 800 canvas).
- Left/right pages curve outward from the spine; outer edges are 16–24px lower than the spine top.
- Cover sits 14–20px outside the page block; do not make it a wide tray.
- Page stack edge: the page paths translated down 8–10px in `#dfbdcc`.
- Spine fold: a slim lens shape in `#311302` at 12% opacity.

### Calendar chip

- 3×3 dots; one larger filled dot marks the day.
- Pink header strip, two plum binder rings, 38–40px corner radius.
- Rotate -7° to -8°; float it over the arch edge.

## 8. Motion

- Animate the **container**, not the SVG internals. SVGs loaded via `<img>` do not reliably honor in-file animation or reduced-motion preferences.
- Landing art: gentle float, `translateY(-8px)` over 8s, `ease-in-out`, guarded by `@media (prefers-reduced-motion: no-preference)`.
- Auth art: static. It sits behind a form; do not animate a full-bleed cover.
- No bounce, spin, pulse, or infinite glow unless explicitly requested.

## 9. QA workflow

1. Read this document and the current SVG.
2. Plan the vertical budget before drawing (e.g. arch top 64, page 270–480, 40px margins).
3. Write the SVG in layers with comments.
4. Render at full size **and** 320px on the actual background (`#181115`). Read the images back and inspect.
5. For auth, simulate the cover crop at 360×160 and 624×160 and check brand/tagline contrast (≥3:1 large, ≥4.5:1 small).
6. Run `xmllint --noout` on the SVG.
7. Compile SCSS if CSS changed:
   ```bash
   ./node_modules/.bin/sass src/styles/landing.scss public/assets/css/landing.css --style=expanded
   ./node_modules/.bin/sass src/styles/auth.scss public/assets/css/auth.css --style=expanded
   ```
8. Check the final git diff for accidental deletions or concurrent user edits.

### Render script

`sharp` is already a dependency. Run it with `node`, not `bun` (the Bun+sharp combination hangs in this environment).

```bash
cd /path/to/slice-of-life
node - <<'EOF'
const sharp = require('sharp');

(async () => {
  const landing = 'public/assets/images/landing-hero-art.svg';
  const auth = 'public/assets/images/login-illustration.svg';
  const out = '/tmp/opencode/svg-preview';

  await sharp(landing).resize(840, 840).flatten({ background: '#181115' }).png().toFile(`${out}/landing-840.png`);
  await sharp(landing).resize(320, 320).flatten({ background: '#181115' }).png().toFile(`${out}/landing-320.png`);
  await sharp(auth).resize(800, 960).png().toFile(`${out}/auth-full.png`);
  await sharp(auth).resize(533, 640, { fit: 'cover' }).png().toFile(`${out}/auth-desktop.png`);
  await sharp(auth).resize(360, 432, { fit: 'cover' })
    .extract({ left: 0, top: 136, width: 360, height: 160 })
    .png().toFile(`${out}/auth-mobile-360.png`);
  await sharp(auth).resize(624, 749, { fit: 'cover' })
    .extract({ left: 0, top: 294, width: 624, height: 160 })
    .png().toFile(`${out}/auth-mobile-624.png`);
})();
EOF
```

## 10. Do / Don’t

| Do | Don’t |
|---|---|
| One focal paper object | Two competing bright areas |
| Overlap props to build depth | Scatter unrelated icons around the canvas |
| Cream paper + plum structure + pink accent | Rainbow palette |
| Sun behind the paper, shadows down | Mixed light directions |
| 2–4 sparkles | Confetti in every corner |
| Add a quiet dark margin for auth overlay text | Put the lock/photo behind the brand text |
| Keep important art at 320px readable | Fine 1px details that disappear |
| Prefix IDs per file | Reuse `clip1`, `shadow`, `gradient` |
| Render and inspect | Ship an unrendered SVG |

## 11. Current file map

| File | Purpose |
|---|---|
| `public/assets/images/landing-hero-art.svg` | 520×520 landing hero, hidden ≤640px |
| `public/assets/images/login-illustration.svg` | 800×960 auth cover, visible on mobile |
| `src/styles/landing.scss` → `public/assets/css/landing.css` | Hero grid, art sizing, float, mobile hide |
| `src/styles/auth.scss` → `public/assets/css/auth.css` | Auth shell, cover crop, overlay gradient |
| `src/pages/Landing.tsx` | Hero markup, image `alt=""` |
| `src/layouts/AuthLayout.tsx` | Auth cover image + brand overlay |

## 12. Copy-paste brief

> Create a warm, quiet, hand-authored SVG illustration for Slice of Life. Visual language: dusk arch window, gradient sun, plum hills, cream paper or open journal, calendar chip with one filled day, photo print or media card, lock badge, 2–4 sparkles. Palette only from `ART_DIRECTION.md`: `#181115`, `#251d21`, `#6c3453`, `#5a2b44`, `#fcb0d6`, `#dfbdcc`, `#ffd8e9`, `#ffdbc9`, `#ffe4d6`, `#fff1e8`, `#f3ba9b`, `#311302`. No text, no UI chrome, no external fonts/images, no editor metadata. Canvas: landing 520×520 and hidden at ≤640px; auth 800×960, always visible, keep the bottom 160px quiet for the brand overlay and survive a center crop at 360×160. Prefix IDs, use two shadow tiers, round coordinates to 2–3 decimals. Render at full size and 320px on `#181115`, inspect, and run `xmllint --noout`.
