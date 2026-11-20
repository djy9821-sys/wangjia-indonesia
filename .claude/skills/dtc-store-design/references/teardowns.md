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

## Apple AirPods Pro 3 (apple.com/airpods-pro), measured 2026-11-20
- 28,782 px tall (about 34 screens), white page, 19 sections, 12 sticky elements.
- Hero: full-bleed film of what the product does (a dancer inside rings of sound, i.e. silence), not a packshot. Claim headline bottom-left (SF Pro Display 600, 64/68 px, tracking -0.009 em), a proof line under it ("up to 2x more than AirPods Pro 2"), and a price pill with Buy bottom-right, inside the hero.
- A sticky product bar after the hero: name, Overview, Hearing Health, Tech Specs, Compare, and a blue Buy.
- "Get the highlights": a film gallery with a pause button and dot progress, controlled by the user.
- The middle of the page is one chapter about 21 screens long: sticky stages whose pictures change with scroll (84 elements with inline transforms, 67 with inline opacity, driven by Apple's own script; no GSAP, no canvas).
- 16 videos: muted, playsinline, preload none, started by script only when in view.
- One family in weight 600 for all display type: 96/100 (-0.015 em), 64/68, 56/60, 28/32; feature titles 17/25. CSS transitions are short (100 ms linear, 200–400 ms); the large movement is scroll-linked, not timed.

## Bambu Lab H2D (bambulab.com/en/h2d), measured 2026-11-20
- 51,986 px tall (about 62 screens), Next.js, light grey page holding dark full-width chapters and rounded dark cards.
- Hero: full-bleed dark macro footage of the toolhead under hard top light; small product name, two-line headline (Manrope 700, 48 px), white "Buy now" and outlined "Watch video". Sticky product bar with a green Buy.
- Second screen: a centred 72 px headline whose second line is in the one accent (green), then a bento of outcome pictures (what people make with it).
- "Dive In": each capability is a chapter with a centred title and a one-line subtitle on black, then a full-width film with a progress bar.
- 14 videos (the first autoplays once, muted; the rest loop with posters, preload metadata). Heavy: 822 KB of scripts and 3.3 MB of images on first load, not a budget to copy.

## DJI Store buy page, DJI Mini 5 Pro (store.dji.com, Chinese store), measured 2026-11-20
- The plain buy page that sits next to the story page: about 12,300 px (15 screens) at 1470 x 835, 67 images.
- Gallery on the left, sticky (707 px tall), with a counter (1/8) and tabs for pictures and product introduction. Buy box on the right: title (32 px), the price large, then **the instalment line directly under the price** (interest-free, from 798 a month x 6, with the payment services named), then a card of service promises (7-day returns, trade-in, official warranty), then a short highlights list, then a promotion card.
- **A fixed bottom bar on desktop**, 84 px: delivery to the visitor's city with the shipping day and the expected arrival date, the price, Add to cart and Buy now. It never leaves the screen.
- Sections below: choose your bundle (each option with its price), best-selling accessories, deep dive, what is in the box, pictures taken with it, which model suits you (comparison), related questions.
- Lesson: a buy page is plain and light, the price and the way to pay sit together, delivery is stated before the cart, and the buy action is always one tap away.

## What they share
1. One idea carried all the way through (playful industrial minimalism; transparency + dot matrix; "the view you capture"; silence you can see).
2. Imagery first, and moving: the first screen is footage or a living scene of the product at work in dramatic, consistent light; studio shots and renders carry the rest. Effects are seasoning; motion of the imagery itself is not.
3. Type is the brand: owned faces or a fixed pairing; extreme contrast between 11 px mono labels and 48–100+ px display; large headings often in regular or medium weight.
4. Restrained colour: black, white, grey and one accent.
5. The page is a story, one message per screen: outcome, problem, product, proof, choice, purchase.
6. The way to buy is always visible: floating nav, sticky product bar, price in the hero and under each product.
7. Interface motion is light (100–500 ms fades and moves, smooth scrolling); the big movement comes from scroll-linked sticky chapters where the picture changes as you scroll.
