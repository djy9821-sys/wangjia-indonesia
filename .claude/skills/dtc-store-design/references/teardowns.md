# Teardowns of sites that set the bar

Measured on 2026-11-19 in a real browser (fonts, sizes, colours and timings read from the page with a script). Use these as calibration: when a design of ours feels "generic", compare it against these numbers and habits, not against other templates.

## Teenage Engineering (teenage.engineering) — hardware brand + store
- Black site. Navigation is four hand-drawn thin-line icons (products, store, latest, finder), each with a line of small text.
- Each screen below holds one product only: shot in a dark studio under one top light, reflective floor, a short line and the price in their own display face.
- Two custom typefaces (te-20, TechnoType). No animation library at all; plain code. About 6,000 px tall, 6 sections, 12 images, no video.
- Lesson: identity comes from studio photography plus owned type and icons. Effects are almost absent.

## Nothing (nothing.tech) — Shopify store, Tailwind
- Hero: full-bleed collage of studio product shots, rotated and cropped past the edges; one large headline bottom-left, one small button. Floating pill navigation with a yellow promo strip above it.
- Then light-grey category tiles, a full-bleed black product close-up, then editorial story blocks (mono place and date on the left, headline, one line and a black button on the right). Light and dark alternate.
- Stack: Shopify + Tailwind + Lenis smooth scrolling.
- Three type voices: NType82 for text and display, Ndot (dot-matrix) as the brand mark and for labels, Geist Mono / Lattera Mono for 11–14 px uppercase labels. Display 48 px, line-height 1.0, weight 400 (large type in a regular weight). Body 16/22.4.
- Palette: near-black #040404, white, grey #595A5A; the only colour is the yellow promo strip.
- Motion: opacity transitions of 100–500 ms on cubic-bezier(0.4, 0, 0.2, 1); transforms 500 ms. No pinned scroll scenes on the home page.
- Grid tokens: --cell-size ≈ 115 px, --grid-item-width 355 px. 11 sections, about 8,800 px.
- Lesson: a strict system (three faces with clear jobs, black/white/grey plus one yellow) and consistently lit product photos; motion so light you barely notice it, only to make scrolling feel smooth.

## DJI Mavic 4 Pro product page (dji.com) — machine with specs
- Hero: a landscape photo taken by the product itself; product name, one slogan, two buttons (buy, watch video). It sells the outcome, not the object.
- A sticky product sub-navigation (accessories, compare, specs, video, downloads, FAQ) with a blue buy button that never leaves.
- A centred grey intro paragraph that weaves the key specs into one sentence.
- A bento of rounded dark cards: a large close-up with one claim; small cards that draw the number as a thin-line icon (a stopwatch around "51" for 51 minutes of flight).
- Each chapter opens with a small label, one huge orange headline and a paragraph, then the product lit in darkness unfolds as you scroll.
- Next.js; Open Sans; ~38,000 px tall; 13 sections; 15 videos and 65 images; 9 sticky elements, several exactly one viewport tall (pinned scroll scenes). Headings 40–48 px weight 600, body 14–18 px.
- Lesson: the page is one story (outcome, then claims, then specs and buying), one message per screen, and the buy button is always within reach.

## MotionSites (motionsites.ai) — source of many "free website designs" seen on X
- A prompt library for AI-built pages; the author says about 90 % of designs are free, the rest need a paid plan.
- Names describe the moves: Smoothie Slider (a giant "Berry" behind a bottle), Flower Valley 3D ("Grown, not built." over cinematic flowers), Particle Brain 3D, Particle Self (scroll-driven 3D particles), Ink Reveal Hover, Sticker Type, Summit (a person in front of a giant word), Design World (a glass cube in front of giant words), Roadster 3D (outlined giant word behind a car on a reflective floor).
- Lesson: they are concept landing pages, each with imagery generated for it (consistent light and colour). The layout is simple: one giant word, one hero object, a few small labels. The imagery carries them; the code is not complicated.

## What they share
1. One idea carried all the way through (playful industrial minimalism; transparency + dot matrix; "the view you capture").
2. Imagery first: consistently lit product shots, footage of what the product does, renders. Effects are seasoning.
3. Type is the brand: owned faces or a fixed pairing; extreme contrast between 11 px mono labels and 48–100+ px display; large headings often in regular or medium weight.
4. Restrained colour: black, white, grey and one accent.
5. The page is a story, one message per screen: outcome, problem, product, proof, choice, purchase.
6. The way to buy is always visible: floating nav, sticky product bar, price under each product.
7. Light motion: 100–500 ms fades and moves, smooth scrolling, a few pinned scenes; nothing flying around.
