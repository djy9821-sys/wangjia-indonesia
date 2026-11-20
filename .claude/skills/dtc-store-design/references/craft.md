# Craft: what separates award-level pages from competent ones

Distilled from research on 2026-11-20: Emil Kowalski's and GreenSock's own published agent skills (exact numbers), Rauno Freiberg's and Vercel's interface guidelines, Josh W. Comeau, Material 3 motion tokens, Apple's HIG and WWDC23 springs, NN/g on scroll-jacking, Butterick, Typewolf, Typotheque, Utopia, the syllabi of Awwwards Academy, Domestika, Flux Academy, SuperHi and Framer Academy, and Codrops case studies 2025–26. It adds to `visual-craft.md` and `brand-and-motion.md` and corrects them where noted. A critique of mock-ups A and B by these rules closes the file.

## Contents
1. Corrections to the older references
2. Motion: two clocks and roles
3. Scroll: linked once, triggered everywhere else
4. Hover, press, reduced motion, speed
5. Typography
6. Composition and art direction
7. Details checklist (40)
8. What the courses teach
9. What A and B lacked (the critique in short)

## 1. Corrections to the older references

1. **Two clocks, not one.** 200–500 ms is the interface clock (taps, hovers, menus). Brand moments run on a scene clock: entrances 0.5–1.0 s, display line reveals 0.8–0.9 s, and scroll-scrubbed scenes have no duration at all. Putting every element on one 700 ms fade-up belongs to neither clock and is itself a template tell.
2. **CSS scroll-driven animation is Baseline** (Chrome 115, Safari 26, Firefox 159, web.dev October 2026). Use it behind `@supports` for light scroll-linked effects; keep GSAP for pinned multi-step scenes.
3. **Transform and opacity, plus two:** `clip-path` and small blur (about 2 px to mask a crossfade, never above 20 px).
4. **Ease-in has one job:** something leaving the screen may accelerate briefly (≤ 200 ms). Everything that enters or answers a tap decelerates.
5. **Display tracking depends on the face.** Take it from the foundry's display tokens or the `opsz` axis and check at the real size (Inter levels off near −0.022 em above 32 px; Geist headings sit around −0.045 to −0.06 em; heavy condensed capitals at poster size near 0).
6. **"Nothing moves on its own on phones" means loops and auto-advancing content.** Entrances and scroll-linked motion are started by the user and are fine on phones with reduced motion respected; loops over 5 s need a pause control.
7. **Never hide the hero or the price at opacity 0, and never wait for `document.fonts.ready`.** Chrome ignores opacity-0 elements for LCP; on a slow connection the first screen stays empty.

## 2. Motion: two clocks and roles

| Clock | Element | Duration | Easing |
|---|---|---|---|
| Interface | button press | 100–160 ms, to `scale(.97)` | strong ease-out |
| | tooltip, popover | 125–200 ms | ease-out |
| | dropdown | 150–250 ms | ease-out |
| | modal | 250 ms from `scale(.96)` and opacity 0 | ease-out |
| | drawer, bottom sheet | 500 ms from `translateY(100%)` | `cubic-bezier(.32,.72,0,1)` |
| | exit | faster than the entrance (250 in, 200 out) | |
| Scene | block entrance | 0.5–0.6 s, 100–150 ms between items | ease-out |
| | display line reveal | 0.8–0.9 s, 0.04–0.1 s per line, `yPercent` 105 → 0 | expo out `cubic-bezier(.16,1,.3,1)` |
| | scrubbed scene | none; scrub smoothing 0.5–1 s | `ease: "none"` inside |

Curves to keep as tokens: strong ease-out `cubic-bezier(.23,1,.32,1)` (≈ GSAP power4.out, practically what A and B used), strong ease-in-out `cubic-bezier(.77,0,.175,1)` (clip-path wipes), drawer `cubic-bezier(.32,.72,0,1)`, expo out `cubic-bezier(.16,1,.3,1)`, `linear` for rotating impellers, progress and scrubbed timelines.

**Cast every element by role** (Emil Kowalski's choreography):
- **Lead**, one per moment: travels farthest and lasts longest (e.g. a heading through a line mask, 0.9 s).
- **Support**: shorter and smaller (e.g. 6–12 px, 0.4–0.6 s).
- **Decoration**: opacity only, 0.3 s, or no motion.
- **Static**: data people read (prices, specs, tables, form fields) does not move.

Order by importance, not markup. A repeated action skips the build-up. Stagger 30–80 ms in interfaces; 100–150 ms for first-visit marketing; stagger only the first five items of a list; exits are simultaneous. A row of four cards arrives as one unit from the centre out.

**Hero order** (usable buy button by about 0.8 s): the atmosphere is already on the first frame; the lead arrives 0–600 ms; the product rises 80–700 ms; idea line, price and button are present from 0 ms (or arrive together by 640 ms); decoration after 600 ms.

**Springs** only where motion must be interruptible or follow a hand (drags, pointer followers, a product "surfacing"). Apple: duration plus bounce; 0 is smooth, about 0.15 hardly reads, about 0.3 visibly bounces. No bounce on anything people read.

## 3. Scroll: linked once, triggered everywhere else

- **Scroll-linked** (reverses with the scroll) for one pinned scene that tells the idea: 150–250 vh of scroll per scene, at most three beats; the picture moves continuously, the copy changes only at beats. **Scroll-triggered** (plays once at `start: "top 85%"`) for everything else.
- NN/g "Scrolljacking 101": hijacked scrolling disorients people, worst when the scroll rate changes while text changes. Never change the scroll speed; Lenis at its default `lerp: 0.1`, wheels only (`syncTouch: false` keeps native touch), driven from `gsap.ticker` with `lagSmoothing(0)`.
- GSAP: put the ScrollTrigger on the timeline, not a child tween; `ScrollTrigger.refresh()` after fonts and images settle; create triggers top to bottom; `anticipatePin: 1` for large pins; register eases explicitly or tree-shaking turns them linear.
- Parallax small (10–15 % of an element's height) and off under reduced motion; parallax is WCAG 2.3.3's own example.
- Under reduced motion, unpin scenes into stacked stills or cut between states.

## 4. Hover, press, reduced motion, speed

- Press: `:active { transform: scale(.97) }` on every button and card, 160 ms; never start anything from `scale(0)`.
- Hover only inside `@media (hover: hover) and (pointer: fine)`; in about 125 ms, out about 450 ms; never change font weight on hover.
- Touch: `-webkit-tap-highlight-color: transparent` plus your own `:active`; `touch-action: manipulation` on controls; inputs at 16 px or more.
- Reduced motion: reduce, don't remove. Keep opacity and colour changes, drop movement and delays, show groups at once; a sliding bar becomes a fade.
- Speed: GSAP (free for commercial use since 3.13) about 28 KB gzip, with ScrollTrigger about 46 KB, Lenis about 5 KB. `will-change` only during heavy scenes; pause loops off screen; avoid live `backdrop-filter` blur on fixed bars on low-end Android (use a solid 94–95 % fill below 768 px).
- Same-document View Transitions are Baseline; Next.js still marks its `viewTransition` option experimental, so do not build store navigation on it yet.

## 5. Typography

- **Display type is an image once per page.** Everywhere else use few sizes: label 12–13, small 15, body 17–18, lead 20, one heading step, one display. The giant word is sized to its box with a rem floor.
- **Zoom-safe fluid type**: write sizes as rem + vw and keep each step's max ÷ min ≤ 2.5 (Barvian, Smashing 2023), so 200 % zoom works. The giant word cannot meet this, so the descriptive headline must also exist at a normal size.
- **Variable axes**: set `wght`, `wdth` and `opsz` through `font-weight`, `font-stretch`, `font-optical-sizing`; keep `font-variation-settings` for custom axes (it overrides and resets the others). Animating an axis is not composited: one element, short, once.
- **Mono is for specs, times and model codes.** Selling notes ("Bisa bayar bertahap", "Dibalas di jam kerja") go in the text face at 14–15 px weight 500; people read them outdoors on phones. Line up numbers with tabular figures, not a mono font.
- **All caps only for short lines**, never for sentence-length headings.
- **Licences**: Pangram Pangram trial fonts may not be used on any website; Fontshare (ITF Free Font License) may be self-hosted but not modified or subset; Velvetyne is mostly OFL, check each; Fontsource packages are OFL or Google fonts with subsets. On a free budget, identity comes from how type is used (axis, scale, cropping, motion), not from a rare face.
- **Free faces worth trying for this brand**: Archivo (wdth 62–125: 62 for the poster word, 85–100 headings, 112–125 numerals), Big Shoulders Stencil (crate markings, serial plates: "bisa dicek"), Bricolage Grotesque (opsz 12–96, ink traps). Test with "KINCIR AIR", "Rp 6.500.000", "2 HP", "SS304", "1:14".

## 6. Composition and art direction

- **One master split** reused in every section (e.g. 4 | 8 of 12 on desktop, full bleed with a 16–20 px gutter on phones); start text on a column other than the first at least once; one full-bleed moment every two or three screens; offsets in grid units.
- **One giant element per view, crossing an edge.** No product centred in a padded box; let it bleed, overlap type and sit on a horizon.
- **Vary how sections open** (statement, split, sticky list, horizontal row, full bleed). A and B opened four sections identically (mono label, heading left, lead right, 7fr / 5fr).
- **Art direction without photography is light, grade and texture**: one key light per scene that every gradient, rim and reflection agrees with; grade cut-outs into the scene (darker, cooler, a warm rim on the dawn side, a contact line and ripples where they touch water) or they read as pasted; gradients interpolated `in oklch` with an sRGB fallback; a grain tile at 3–10 % over large gradients; glows from radial gradients, not blurred shapes.
- **3D on a cheap-phone budget**: lazy-load after the poster, one hero model, device tiers (skip WebGL on the lowest tier), a timeout on shader compilation. Lando Norris (Awwwards Site of the Year 2025) mixed baked 3D with real-time effects and faked an expensive glass effect with noise and a texture.
- **Time-of-day theming** (a 2026 Codrops case): theme the page by Jakarta time, night design 18.00–05.00, gold at dawn and dusk, a light high-contrast theme by day for farmers reading outdoors at noon. Set it before the first paint, never animate the switch, offer a toggle. Not built yet; a strong next step for the night idea.
- **How juries score** (Awwwards): design 40 %, usability 30 %, creativity 20 %, content 10 %. E-commerce Site of the Year 2025 went to Scout Motors (a vehicle maker's store; scroll, text and video animation).

## 7. Details checklist (40)

Type and text
1. `text-wrap: balance` on headings, `pretty` on paragraphs.
2. `font-variant-numeric: tabular-nums` on prices, clocks, counters and tables.
3. `&nbsp;` inside glued terms: Rp&nbsp;6.500.000, 1,5&nbsp;kW, 175&nbsp;cm, Ø&nbsp;67&nbsp;cm, 2&nbsp;HP.
4. Units as words and real glyphs: "1 tahun" (never "1th"), O₂, ×, Ø, –.
5. `text-box: trim-both cap alphabetic` on display lines and buttons, with a margin fallback.
6. Measure the giant word's left side bearing and align its first stroke to the grid.
7. Hang punctuation with a negative indent.
8. Never change font weight on hover or selection.
9. No interface text below weight 400; headings 500–600 look best.
10. Registered axes through standard properties; `font-variation-settings` for custom axes only.
11. Subset and preload the display font.
12. A `::selection` colour from the palette.
13. `translate="no"` on WANGJIA and model codes (browser translation is common on Indonesian phones).
14. Format numbers with `Intl.NumberFormat("id-ID")`, no decimals for rupiah.

Motion and interaction
15. `:active` scale .97 on every button and card, 160 ms.
16. Hover motion only on hover-capable pointers.
17. Hover in about 125 ms, out about 450 ms.
18. Never `transition: all`.
19. Never enter from `scale(0)`; start at 0.9–0.97.
20. Exit faster than enter.
21. Stagger only the first five items.
22. Pause loops off screen or when the tab is hidden.
23. Spinners only after 150–300 ms, shown at least 300–500 ms.
24. Anchor links with `scroll-margin-top`; plain jumps under reduced motion.
25. Theme changes never animate.
26. `will-change` only while a heavy scene runs.
27. Rotating SVG parts: transform a `<g>` with `transform-box: fill-box; transform-origin: center`.
28. Popovers grow from their trigger.
29. `blur(2px)` with opacity .7 during image crossfades.

Touch and platform
30. Tap highlight reset plus your own `:active`; `touch-action: manipulation`.
31. `overscroll-behavior: contain` on drawers and menus.
32. Inputs at 16 px or more.
33. `<meta name="theme-color">` and `color-scheme: dark` on dark pages.
34. An SVG favicon that follows `prefers-color-scheme`.
35. `<video autoplay muted loop playsinline>` with a poster, gated by reduced motion and paused off screen.
36. Preload only above-the-fold images; width and height on every image; never hide the LCP element at opacity 0.

Surfaces
37. Glows from radial gradients; fades to dark from background images, not masks.
38. A grain tile at 3–10 % over large gradients.
39. Gradients `in oklch` with an sRGB fallback.
40. `pointer-events: none` on decorative layers.

## 8. What the courses teach

Awwwards Academy (Duarte Pires on art direction; Joseph Berry on award-winning animation in Webflow; Louis Paquet on motion with purpose), Domestika (Paquet; Pablo Stanley on compositions), Flux Academy, SuperHi and Framer Academy all treat as essential: a brief and a moodboard, hierarchy and composition, typography rules set early, a palette, an imagery style, grids, mobile, motion with a purpose, prototyping and presenting. The award-oriented courses add three things: **concept exploration with quick design tests, storytelling, and a few designed set pieces** (an intro with dynamic interaction, a 3D object with mouse interaction, a reveal card, a scroll-driven feature). Pires: an award site should evoke a feeling, a texture or an emotion. A and B had the basics and lacked the set pieces.

## 9. What A and B lacked (the critique in short)

Shared: one 700 ms fade-up on 36–42 elements including tables and spare-part rows; no scroll-linked story; no signature motion tied to the product; one daylight cut-out reused five times and pasted ungraded onto night; every section opening the same way; no press states and ungated hovers; selling points set in 10.5–12 px mono; 13–15 fixed font sizes; banding sRGB gradients.
A: the hero (machine, price, button) waited for `fonts.ready` and started at opacity 0; on phones the buy button fell below the first screen; the chart's labels rendered at about 6 px on phones; hover-only anatomy hotspots.
B: the hero was the SaaS split (text left, boxed image right) and showed no product on the first phone screen; the facts band's 104 px numerals outranked the hero heading; 28 border declarations (boxes inside boxes); a drawn phone mock-up; Geist plus Geist Mono reads as a developer tool; "1th".
A2 answers most of this: a living hero with price and button from the first frame, one scrubbed night, the exploded machine as the set piece with spare-part prices, roles and two clocks, gated hovers, press states, selling notes in the text face.
