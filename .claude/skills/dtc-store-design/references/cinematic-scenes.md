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

Measured for A2 (gzip): three.js with the scene code 156 KB, GSAP 28 KB, ScrollTrigger 18 KB, Lenis 5 KB, so about 207 KB of JavaScript. Fonts 206 KB (subset or drop the mono to save 58 KB). HTML 14 KB. Range images load lazily. That is about 440 KB before scrolling, within the 730 KiB page and 365 KiB JavaScript budget.

- **Low-power path** (≤ 4 cores, ≤ 4 GB memory, or a short side under 520 px): pixel ratio 1.25, no MSAA, three distant machines instead of six, 900 particles, reflection at 0.4 scale.
- **No WebGL:** the canvas keeps a CSS night gradient; the page still works. For production, render a poster frame (WebP) from the same scene and show it until the first frame.
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
