# Cinematic scenes: a living hero and a scroll story without a photo shoot

Read this when a page needs the "wow" the owner keeps asking for and there is no footage or studio photography to carry it. It records how mock-up A2 (`docs/mockups/home-2026-11-20/`) was built and what it cost.

## Contents
1. Why this exists
2. The pattern: one fixed scene, chapters scrolling over it
3. Building the scene in three.js
4. Choreography
5. Budget, fallbacks and accessibility
6. Testing in the browser pane
7. Mistakes made on the way
8. Built into the shop (Next.js)

## 1. Why this exists

Rounds one and two failed for opposite reasons. Round one stacked effects on a page without imagery. Round two (mock-ups A and B, 2026-11-19) obeyed every rule and still looked static: the idea "while you sleep, the pond keeps breathing" was only written, never shown. There was no water and no night, and the machine was a still catalogue cut-out on flat navy.

The sites the owner admires (MotionSites designs on X, Apple, Bambu Lab, DJI) all open on moving imagery in one consistent light, so the picture tells the idea before any words do. When no footage exists, a real-time 3D scene built from the catalogue photos can play that role. Renders from real dimensions count as real product imagery; AI-generated pictures of the product do not.

Restraint still applies to colour and type. It does not apply to imagery and motion: the hero must be alive.

## 2. The pattern: one fixed scene, chapters scrolling over it

- One `<canvas>` fixed behind the page (`position: fixed; height: 100lvh`, so the mobile URL bar does not resize it).
- **Scene chapters** are transparent and show the canvas: the hero, sticky chapters (`position: sticky; height: 100svh` inside a section 3–4 screens tall), and the closing chapter.
- **Content chapters** (range, proof, footer) have opaque backgrounds and scroll over the scene. While only opaque chapters are on screen, stop rendering (an IntersectionObserver on `[data-scene]`).
- Scroll drives a few progress numbers (0 to 1), not absolute values: `p1` hero to wide shot, `p2` the hours of the night, `p3` anatomy, `p4` dawn. The scene maps them to camera poses, light and the exploded view every frame, so resizing never breaks the story.
- One continuous shot is the idea made visible: scroll is time passing, from 18.00 to dawn.

## 3. Building the scene in three.js

**Model from catalogue photos.** Read the front and three-quarter photos for proportions and count every part. The WANGJIA 2 HP: three HDPE floats (175 × 32 × 20 cm) parallel to each other and across the shaft; a rounded motor cover on the centre float; a vertical motor on a bevel gearbox; couplings; two SS304 shafts on pillow blocks on the outer floats; four PP impellers (Ø 67 cm, 8 perforated paddles) at x = ±0.5 and ±1.5 m, one outboard of each outer float and one between each outer float and the centre. Shaft at 0.22 m, so paddles dip about 11 cm. Build each part from extruded shapes and boxes, merge geometry per material (about 19 draw calls per machine), and use an alpha texture for the paddle holes. The order of parts along the shaft is the kind of fact to check twice: a wrong model is a wrong product.

**Water.** three's `Reflector` with a custom shader: a tiling normal map generated once from integer-frequency sine waves (seamless, no download), sampled at three scales; reflection distorted by the normal (more near the camera); Fresnel mix with a deep colour; analytic glints for the moon, the sun and a warm lamp; churn rings and foam (noise inside an ellipse stretched behind each impeller) fed from the impellers' world positions. Render the reflection at 0.4–0.5 of the canvas size.

**Spray.** One `Points` per machine, animated entirely in the vertex shader (start point, velocity and gravity per particle, looping by `mod(time, life)`), additive blending, size in metres converted with `height × pixelRatio / (2 tan(fov/2))`. About 2,600 particles for the hero machine on desktop and 900 on low-power devices. Slow it to about 0.6× real time: slow motion reads as cinematic.

**Sky and shore.** A sky dome shader (night gradient, a small moon with halo, hashed stars, a dawn palette with sun glow), a treeline silhouette on an open cylinder, a few warm points for houses on the far shore, two noise mist planes near the water. More machines in the distance sell "rows of kincir at work".

**Light.** A cool moon as rim light from behind, a warm point light in front as key (the accent colour comes from the paddles), a hemisphere fill, ACES tone mapping, and a small environment map made from two soft boxes for metal and plastic highlights.

**The giant word.** The "Design World" composition, inside the scene: draw the word on a canvas in the display face (`fontStretch = 'extra-condensed'`, wait for `document.fonts.load` first), put it on a plane behind the machine, and keep it out of the reflection (put it on layer 1 and set the reflection camera to layer 0) so the water stays readable. Stack the word in two lines on portrait screens.

## 4. Choreography

- **Poses.** Define each camera pose twice, for landscape and for portrait, and blend them by aspect ratio. On phones the machine sits in the top half and the text below it; the exploded machine is too wide for a phone, so anchor labels to inner parts.
- **Opening.** The camera pushes in and the word rises from the pond over about 2.8 s (expo out). Hero text appears when fonts are ready or after 700 ms, whichever is first; never hide text behind a slow font.
- **Night chapter.** The wide shot dollies slowly; the moon sinks across the sky; a large clock and three short statements change with progress; a small chart draws its curve in step with the clock.
- **Anatomy chapter.** The camera flies close, the machine turns about 0.5 rad, then the parts lift and spread (cover up, motor and gearbox up, shafts and impellers outward). Labels follow the parts: project anchor points every frame and stack the callouts by their real heights in a column, with leader lines. On phones use numbered dots plus a list.
- **Dawn chapter.** The sky warms, the lamp goes out, mist thickens a little, the machine is whole again, the enquiry form sits on glass over the sunrise. Keep text scrims local; a full-width dark gradient turns a sunrise grey.

## 5. Budget, fallbacks and accessibility

Measured for A2 (gzip): three.js with the scene code 157 KB, GSAP 28 KB, ScrollTrigger 18 KB, Lenis 5 KB, so about 210 KB of JavaScript. Fonts 206 KB (subset or drop the mono to save 58 KB). HTML 15 KB. The poster 79 KB (landscape) or 50 KB (portrait). Range images load lazily. That is about 520 KB before scrolling, within the 730 KiB page and 365 KiB JavaScript budget.

- **Tiers** (numbers and reasons in `moves.md` section 5; the floor is a Mali-G52 phone such as the Galaxy A06, about a tenth of an iPhone's GPU):
  - Tier 0, Save-Data or 2 GB memory or no WebGL: the poster only.
  - Lean tier (≤ 4 cores, ≤ 4 GB memory, or a short side under 520 px): pixel ratio 1, no mirror render (the water reflects a procedural sky with the moon and lamp glints), Lambert and Phong materials instead of PBR, no environment map, no MSAA, three distant machines instead of six, 900 particles.
  - Full tier: the mirror reflection at half resolution, PBR with a small environment map, pixel ratio up to 1.75.
  - Shaders compile with `renderer.compileAsync()` before the canvas fades in over the poster.
- **The poster:** a frame rendered from the same scene (`snapshot()` in the scene code, saved through a loopback helper, then sharp at WebP quality 68: 79 KB landscape, 50 KB portrait). It paints first, is the LCP image, and stays when WebGL is missing. When the scene is ready within 1.5 s the opening plays; after a longer wait it cuts straight to the live frame.
- **Something to touch:** a tap on empty water starts a ring there (raycast to the water plane, four analytic rings in the water shader, under 0.2 ms).
- Measure on a real Galaxy A06 or Redmi 13C/14C before launch; the GPU figures so far are estimates.
- **Ambient motion needs a pause control** (WCAG 2.2.2): a "Jeda" button in the hero. Reduced motion starts paused, snaps chapters instead of flying the camera, and skips smooth scrolling.
- **Smooth scrolling** (Lenis) only for fine pointers; touch keeps native scrolling.
- Do not render while hidden; cap the time step; keep the label projection inside the render callback.

## 6. Testing in the browser pane

The pane pauses `requestAnimationFrame` and CSS transitions while it is not visible, so screenshots can show half-finished states. Before judging a frame: `gsap.globalTimeline.progress(1)`, set the intro progress to 1, `document.getAnimations().forEach(a => a.finish())`, then scroll by a pixel. Drive scroll through `lenis.scrollTo(y, { immediate: true })`, then wait about a second. Check every chapter at 1440 × 900 and 375 × 812.

## 7. Mistakes made on the way

- Spray sized in screen pixels became a white fog; size particles in metres.
- The giant word reflected in the water and filled the bottom half with mirrored letters; keep typography out of reflections.
- The night sky started dusk-blue; keep night values very low (horizon about 0.012, 0.022, 0.05 linear) and let the moon and the warm light do the work.
- A "pre-dawn" tint during the anatomy chapter turned everything brown through the fog colour; keep the anatomy at full night.
- Callouts overlapped until they were stacked by measured height.
- The hero text waited on `document.fonts.ready` and stayed invisible on a slow network; race it against a timeout.

## 8. Built into the shop (Next.js)

A2 became the home page on 2026-11-20: `apps/storefront/src/modules/home/components/night/`.
- `scene.ts`: the scene as a typed module with `dispose()` (cancels the frame loop, frees geometry, textures and the WebGL context) so client-side navigation away from the home page leaves nothing running.
- `stage.tsx` (client): the poster `<picture>`, the canvas and the veil; one effect loads GSAP, ScrollTrigger, Lenis and the scene with dynamic `import()` after first paint and undoes everything on unmount (React StrictMode mounts twice in development, so the async setup checks a `cancelled` flag after every await).
- `index.tsx` (server): all chapter markup, readable without JavaScript; prices come from the shop (`getProductByHandle` per machine and per spare part), "mulai" when variants differ.
- `night.css`: plain CSS scoped under `.wj-night`, imported by the component. Class names avoid Tailwind utilities (`.wrap` not `.container`, `.chapter` not `.block`, `.gl` not `.grid`).
- The site header stays: its height is measured into `--hdr`, and the canvas, the poster and the sticky chapters start under it.
- Fixed layers sit at `z-index: -1` so normal content (and the site footer) paints over them; `body:has([data-wj-night])` rules hide the announcement bar and the floating WhatsApp button and give the transparent footer a white background while the page is mounted.
- Reveal states are gated by `data-motion` on the root, set by the client, so server-rendered text is never hidden when JavaScript fails; the hero has no reveal at all.
- The buy bar is `inert` until it shows (no focusable links hidden from screen readers).
- Archivo is loaded with `next/font/local` from `@fontsource-variable/archivo` (with a `font-stretch: 62% 125%` declaration); the scene draws the giant word with `archivo.style.fontFamily`.
- Test it at `http://localhost:8000`: Next.js 16 blocks dev resources requested from `127.0.0.1`, so the page renders but never hydrates.
