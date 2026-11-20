# WANGJIA creative brief (read before designing anything for this shop)

## The business
- WANGJIA® paddle-wheel pond aerators ("kincir air"): 1 HP, 2 HP, a 2 HP jet aerator and a model without gearbox (YC-055), plus spare parts (impeller, gearbox, motor, floats, shaft, pillow block, coupling, mechanical seal, frame).
- Buyers: shrimp (vaname) and fish farmers in Indonesia, mostly on Android phones, often outdoors in bright light. WhatsApp is the main sales channel; many pay in instalments.
- The web shop is Indonesian first (Bahasa Indonesia), English second. The owner of the project (米杰) reads Chinese and decides by looking at mock-ups.

## What may be claimed (catalogue facts only)
- Gearbox bevel gear with mechanical seal; "hemat listrik 25%".
- Shaft and frame in stainless SS304; HDPE floats 175 cm.
- Motor warranty 1 year; authenticity and warranty activation by scanning the QR label on the machine.
- 1 HP has two impellers ("2 kipas"); 2 HP has four impellers and three floats (type YC-1.5A).
- Jet aerator 2 HP, 3 phase, 3.6 A, 2,800 rpm, "DO support > 0.75 kg/jam" (from the catalogue image).
- Complete spare parts, instalment payments ("bayar bertahap"), delivery across Indonesia, group buying ("patungan").
- Anything else (oxygen levels, area or biomass per HP, testimonials, comparisons with other brands) needs the owner's confirmation first. Do not invent numbers: a farmer could lose a harvest on a wrong one.

## Assets that exist (apps/storefront/public/products, apps/backend/static/products)
- Good: front-view cut-outs of the 2 HP and 1 HP with orange paddles (`kincir-2hp-oranye-front.webp`, `kincir-1hp-oranye-front.webp`); three-quarter cut-outs with yellow paddles (`kincir-2hp-cutout.webp`, `kincir-1hp-cutout.webp`, which carry a faint "WANG JIA" watermark from the source photo).
- Weak: catalogue photos of parts and the jet aerator (low resolution, some with text or watermarks). Placeholder illustrations (`aerator-*.png`, `gearbox.png`, `float.png`, `impeller.png`) are not product photos.
- Logo files: `wangjia-logo-horizontal.png`, `wangjia-logo.png`, `wangjia-mark.png`.
- Missing and most wanted: studio shots on a dark seamless background, footage from Indonesian ponds (dawn mist, rows of aerators, slow-motion splash, harvest), a 3D model from the factory, testimonials with permission.
- Made by us (2026-11-20): a procedural three.js model of the 2 HP built from the catalogue photos, with water, spray and night light, plus poster frames rendered from it (`docs/mockups/home-2026-11-20/`). It is an illustration from real proportions; ask the owner to check the part layout before launch.
- New cut-outs: macOS Vision lifts a subject off a plain background well (`VNGenerateForegroundInstanceMaskRequest`), then `sharp` (already in node_modules) writes WebP.

## Colours found in the product
Float blue, paddle orange or yellow, stainless grey, and the logo's blue. The site has used near-black, white, a yellow accent (#FFD23F) and cyan glows; keep to one accent at a time.

## Technical frame
- Next.js 16.3.8 App Router with React 19.0.5 and Tailwind 3 in `apps/storefront` (the repository's AGENTS.md still says Next.js 15); Medusa v2 backend. Measure the shared JavaScript with the storefront's `analyze` script before adding animation libraries. Home sections live in `src/modules/home/components/`, the page in `src/app/[countryCode]/(main)/page.tsx`.
- `next.config.js` has `images.unoptimized: true`, so ship right-sized WebP yourself; give the hero image `priority`.
- Google Fonts are unreachable from the development Mac: add fonts as `@fontsource/<font>` with `pnpm --filter @b2b-starter/storefront add @fontsource/<font> --registry=https://registry.npmmirror.com` and import the weight CSS files.
- The live site has no animation library yet. Mock-up A2 uses three.js, GSAP with ScrollTrigger and Lenis (about 207 KB gzip together); Motion is also acceptable. Plain CSS for interface motion. Respect `prefers-reduced-motion`.
- The page body is white on purpose (a dark-mode browser would otherwise show sections without a background on black).
- Facts and lessons from earlier rounds are in `docs/DESIGN-TEARDOWN.zh-CN.md` and `docs/WORKLOG.zh-CN.md`.

## Working on this machine
- The built-in browser pane opens only localhost; outside sites need the user's Chrome (Claude in Chrome). When that tool blocks some page text, ask the user to paste it; do not transform text to slip past the filter.
- In the pane, animations pause while the pane is hidden: before judging a screenshot, check `element.getAnimations()` or scroll once to force a repaint.
- The dev servers (Postgres, backend, storefront) stop whenever a session ends; check ports 5432, 9000 and 8000 first.

## What the owner has said about design
- "很普通没啥创意" about template-looking pages; wants the level of the designs that trend on X.
- Picked, in order: the dark "night pond" direction over editorial and blueprint mock-ups (still not enough), then MotionSites' "Design World" layout (giant words with the machine in front) for the hero.
- 2026-11-19: neither full mock-up (A night, B engineering drawing) was picked; the owner asked whether I should study more. Static, rule-following pages read as ordinary to them; what they admire moves (MotionSites on X, Apple and Bambu Lab product pages).
- Their reference video (the MotionSites author on TikTok) says: start from a strong existing design, pick a niche, and the beautiful animation and interaction is what clients pay for.
- Wants it practical, not bloated, and to see options rather than be asked abstract questions.
