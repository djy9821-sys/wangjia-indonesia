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
- New cut-outs: macOS Vision lifts a subject off a plain background well (`VNGenerateForegroundInstanceMaskRequest`), then `sharp` (already in node_modules) writes WebP.

## Colours found in the product
Float blue, paddle orange or yellow, stainless grey, and the logo's blue. The site has used near-black, white, a yellow accent (#FFD23F) and cyan glows; keep to one accent at a time.

## Technical frame
- Next.js 15 App Router + Tailwind 3 in `apps/storefront`; Medusa v2 backend. Home sections live in `src/modules/home/components/`, the page in `src/app/[countryCode]/(main)/page.tsx`.
- `next.config.js` has `images.unoptimized: true`, so ship right-sized WebP yourself; give the hero image `priority`.
- Google Fonts are unreachable from the development Mac: add fonts as `@fontsource/<font>` with `pnpm --filter @b2b-starter/storefront add @fontsource/<font> --registry=https://registry.npmmirror.com` and import the weight CSS files.
- No animation library yet. Lenis, GSAP (free, including ScrollTrigger) and Motion are acceptable when a design needs them; plain CSS first. Respect `prefers-reduced-motion`.
- The page body is white on purpose (a dark-mode browser would otherwise show sections without a background on black).
- Facts and lessons from earlier rounds are in `docs/DESIGN-TEARDOWN.zh-CN.md` and `docs/WORKLOG.zh-CN.md`.

## Working on this machine
- The built-in browser pane opens only localhost; outside sites need the user's Chrome (Claude in Chrome). When that tool blocks some page text, ask the user to paste it; do not transform text to slip past the filter.
- In the pane, animations pause while the pane is hidden: before judging a screenshot, check `element.getAnimations()` or scroll once to force a repaint.
- The dev servers (Postgres, backend, storefront) stop whenever a session ends; check ports 5432, 9000 and 8000 first.

## What the owner has said about design
- "很普通没啥创意" about template-looking pages; wants the level of the designs that trend on X.
- Picked, in order: the dark "night pond" direction over editorial and blueprint mock-ups (still not enough), then MotionSites' "Design World" layout (giant words with the machine in front) for the hero.
- Wants it practical, not bloated, and to see options rather than be asked abstract questions.
