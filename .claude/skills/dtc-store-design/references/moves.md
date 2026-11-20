# Moves: the techniques award-level product sites use, and what they cost

Distilled from research on 2026-11-20 (Awwwards winners and case studies, Codrops, GSAP and Lenis docs, three.js examples and forum measurements, browser release notes, GFXBench data for the phones Indonesians buy). Use it to pick two to four set pieces for a page and to check they fit a cheap Android phone. How A2 combined them is in `cinematic-scenes.md`.

## Contents
1. What award sites do that correct sites do not
2. Platform facts (November 2026)
3. The 24 moves
4. The ranking for a night-pond home page
5. 3D on the device floor: bytes, GPU time, tiers
6. Licences of reference code

## 1. What award sites do that correct sites do not

1. **A continuous world, not stacked sections**: one scene persists and changes (Oryzo carries a coaster 3D → 2D → 3D; Igloo Inc keeps one ice world; DJI keeps the product lit in darkness across pinned chapters).
2. **The visitor drives time**: motion is scroll-linked, so chapters scrub forward and back with the thumb.
3. **Choreography**: overlapping timings, one easing family, a hierarchy of hero over chapter over micro-interaction, seams between sections instead of hard cuts.
4. **Depth**: three or more layers moving at different rates (a giant word, the product, foreground particles or mist).
5. **Something to touch**: particles that swirl, an explorer to tap. For a pond: tap the water and it ripples.
6. **Engineering discipline is part of the look**: iyO renders up to 1.6 M particles but a quarter on older phones and a slightly lower pixel ratio (about 44 % less shader work). The weak jury scores on award sites are almost always performance and accessibility, so a fast, accessible page beats them there.

## 2. Platform facts (November 2026)

- CSS scroll-driven animations: Chrome 115+, Safari 26+, Firefox 159+ (Baseline newly available). iPhones that cannot update to iOS 26 lack them, so the static fallback must look finished. Tokopedia uses them on product pages.
- View Transitions: same-document Chrome 111+, Safari 18+, Firefox 144+; cross-document Chrome 126+, Safari 18.2+. Next.js `experimental.viewTransition` is still "not recommended for production"; App Router navigations are same-document.
- Sizes (gzip): three.js minimal scene 125 KB (r181, measured); GLTFLoader 10–15 KB; meshopt decoder about 6 KB; Draco about 100 KB (avoid); React Three Fiber about 50 KB plus add-ons (avoid on this budget); OGL 8 KB core, 29 KB with math and extras; GSAP core about 28 KB, with ScrollTrigger 40–50 KB; Lenis about 4–5 KB; Motion for React from 5 KB (`m` + LazyMotion) to 43 KB; lottie-web light about 46 KB; Rive about 222 KB.
- **The device floor**: Galaxy A06 and Redmi 14C (Helio G85/G81, Mali-G52 MC2) were among the best-selling phones of 2025. They score about 14.3 fps on GFXBench Manhattan 3.1 offscreen against 164 fps for an iPhone 15 Pro, roughly a tenth. Indonesia Q3 2025: Samsung 20 %, Xiaomi 17 %, Oppo 16 %, Vivo 14 %, Infinix 12 % (Counterpoint). Design for a Mali-G52 at pixel ratio 1.
- The storefront runs Next.js 16.3.8 and React 19.0.5 (`apps/storefront/package.json`); it has an `analyze` script to measure the real shared JavaScript before adding libraries.

## 3. The 24 moves

Scroll and structure
- **M1 Smooth wheel scrolling (Lenis)**: the filmed glide on desktop; phones keep native touch. About 4 KB.
- **M2 Pinned chapters**: a sticky stage with scrubbed beats; one per page, 150–250 vh, at most three beats.
- **M3 Scroll-linked time of day**: a colour script (sky, stars, moon, mist) and a clock driven by scroll; native CSS or GSAP.
- **M4 Frame sequence on canvas** (Apple style): heavy in bytes; only with a real render or footage and a strict frame budget.
- **M5 Exploded anatomy with leader lines**: one beat per part; from cut-outs (150–280 KB) or a 3D model (no extra bytes).
- **M6 Hotspot explorer**: tap a part on phones; dots are buttons, not hover-only spans.
- **M7 Real-time 3D product stage**: see section 5 for tiers.
- **M8 Continuity shot**: the same object travels through sections (desktop; GSAP Flip or one fixed canvas).

Type
- **M9 Giant word with the product in front**, with a little depth parallax (10–15 % of the word's height at most).
- **M10 Masked line and word reveals**: headings only; 0.8–0.9 s, 0.04–0.1 s per line.
- **M11 Read-along sentence**: words light up as you scroll; words or lines, never per character on long text.

Transitions between scenes
- **M12 Seams and mask reveals**: mist rising across the section boundary, a sun disc that grows into the light sections, a zoom through a window.
- **M13 Sticky stacking cards** (desktop).
- **M14 Horizontal track on desktop, native snap row on phones.**
- **M15 Scroll-linked marquee band** for proof (warranty, spare parts, delivery, instalments).

Atmosphere
- **M16 Shader water surface**: normal-mapped plane, moon glints, fresnel, fog; tap ripples analytic in the same shader.
- **M17 GPU particles**: spray as parabolas in the vertex shader (no CPU cost), stars, bubbles; counts by tier.
- **M18 Fog, mist and fake light**: halo sprites instead of bloom, vignette, grain.
- **M19 Ambient video loop**: the cheapest cinematic option once real footage exists; poster, muted, inline, paused off screen.
- **M20 Sound toggle**: off by default, fetched only after a tap (a pond-at-night loop is about 160 KB).

Navigation and continuity
- **M21 View transitions into the product page**: the card image morphs into the product hero (same-document in the App Router).
- **M22 An intro that never delays content**: the poster and the price are there on the first frame; the intro only decorates.
- **M23 Pointer-only flourishes**: magnetic buttons, cursor followers, hover distortion; desktop with a fine pointer only.
- **M24 Scrambled labels and rolling numerals**: heads-up-display details for clocks and small labels; tabular figures.

## 4. The ranking for a night-pond home page

1. Scroll-linked night-to-dawn light script with a running clock (M3).
2. Living pond hero: water shader, the machine, spray, tap ripples, tiered, with a pause button (M16, M17, M7).
3. Pinned exploded anatomy with leader lines (M5).
4. Type that performs: the giant word rising from the water, line reveals, a read-along sentence (M9–M11).
5. Dawn seam: mist, then the sun disc (M12).
6. Range deck with price, instalment and WhatsApp on each card; a snap row on phones (M13, M14, M21).
7. Continuity shot (M8), desktop.
8. Lenis on desktop wheels (M1).
A2 builds 1, 2, 3, 4 (without the read-along), 7 and 8; the dawn seam is partial (the scene turns to dawn as the last chapter enters).

## 5. 3D on the device floor: bytes, GPU time, tiers

GPU time per frame on a Mali-G52 MC2 at pixel ratio 1, 360 × 800 (estimates from the benchmark):
- Normal-mapped water with fresnel, moon specular and fog: 1–2 ms. Tap ripples in the same shader: under 0.2 ms.
- A 20k-triangle machine with matcap or Lambert materials: 0.5–1.5 ms; with PBR and an environment map: 2–4 ms.
- Spray, 1,200 points: under 0.3 ms; 6,000 points: 1–2 ms.
- Planar reflection (the scene rendered again into a 512² target): +2–5 ms and twice the draw calls. Bloom: 4–8 ms. A 1024² shadow map: +2–3 ms.
- A lean scene totals about 3–5 ms (60 fps possible); the same at pixel ratio 2 is 10–18 ms. Main-thread cost matters too: parsing about 600 KB of minified three.js takes 0.2–0.4 s on a Helio G85, and first shader compiles on Mali can take hundreds of ms per material, so load after the poster, compile with `renderer.compileAsync()` before fading in, and keep materials few.

Tiers (decide once on load):
- **Always**: the poster WebP is the LCP image.
- **Tier 0** (reduced motion, Save-Data, no WebGL, very low memory, or a lost context): the poster, nothing autoplays.
- **Tier 1** (Mali-G52 class): water at pixel ratio 1 without the mirror, cheap materials, about 1,000 spray points, ripples, rendering stopped off screen, a pause button.
- **Tier 2**: more particles, pixel ratio up to 1.5, optionally a ripple simulation.
- **Tier 3** (strong phones and desktops): the full model with PBR, a 256–512² reflection, pixel ratio up to 2.
Measure on a real Galaxy A06 or Redmi 13C/14C before launch: frame times from `requestAnimationFrame` deltas, `gl.getParameter(gl.RENDERER)`, a pixel-ratio sweep, main-thread time for the scene chunk, temperature after two minutes.

Best open starting points: a normal-mapped plane with a procedural sky (Three.js-Ocean-Scene, MIT); three.js `Water` for its fresnel and glint terms (MIT); `webgl_gpgpu_water` for a ripple simulation on stronger phones (MIT). FFT oceans, Water2 refraction and ray-traced caustics are too much for a turbid pond on a Mali GPU.

## 6. Licences of reference code

- MIT: three.js and its examples, Three.js-Ocean-Scene, Evan Wallace's WebGL Water, Lenis, Motion, React Three Fiber, detect-gpu; Codrops demos unless a demo says otherwise.
- GSAP and all its plugins: the "Standard No-Charge" licence, free for commercial use, proprietary, and it bars building competing visual animation tools. Fine for a store.
- OGL: the Unlicense per a mirror; check the repository's LICENSE before use.
- Olivier Larose's repositories have no licence file (all rights reserved): learn the technique from his tutorials, do not copy the code. JS Mastery clones say "not intended for commercial use": do not copy.
- MotionSites is a prompt library, not code; inspiration only. Write your own sketches either way.
