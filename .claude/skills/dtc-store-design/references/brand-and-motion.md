# Brand idea, story, art direction, motion and speed (how the best DTC sites do it)

Collected 2026-11-19 from studio case studies (Work & Co on Aesop, ArcTouch on Liquid Death, Awwwards case studies of Norda, iyO, Palmer; Instrument on Oura; Code and Theory on Rivian; Tubik on SPYLT), growth guides (Demand Curve, Julian Shapiro), NN/g, web.dev, Chrome's motion guidance, Carbon, Webflow University and Framer Academy. Webflow's and Framer's free lessons are mostly tool tutorials and were useful only for motion. Agency metrics are self-reported. Several pages were read through search extracts.

> Updated 2026-11-20: `craft.md` (section 1) corrects parts of this file: motion runs on two clocks (interface 100–300 ms, scene 0.5–1 s and scroll-scrubbed), CSS scroll-driven animation is now Baseline, and the hero and price must never wait at opacity 0. Where the two differ, `craft.md` wins.

## 1. Find one idea and hold it
- Find it in the customer's real ritual: Work & Co trained in Aesop's skin consultations and visited the stores; the "unselling" idea became calm pages that teach, and conversion rose 15 % in 60 days. (work.co/clients/aesop)
- Pick one sentence that everything obeys: "Murder your thirst" runs from Liquid Death's hero through every section heading and into new product lines. (arctouch.com/portfolio/liquid-death)
- Make it a belief, not a look: Norda's essentialism, "buying better, not more". (awwwards.com/case-study-norda.html)
- Hold it with a system: components plus guidelines for photos, video and writing (Aesop); design tokens (Oura, commerce-ui.com/work/oura-website); one menu, component set and motion across every product (iyO).
- Guardrails: avoid "blanding" (the same sans, millennial pink and sage as everyone else; modernretail.co); Glossier's redesign was criticised for putting vibes over usability (futurecommerce.com); Palmer's experimental draggable shop keeps a toggle back to a plain grid; Awwwards juries give usability 30 % of the score (awwwards.com/about-evaluation).

## 2. Story structure
Homepage:
1. A hero that says what it is: a descriptive headline rather than a slogan, one or two sentences under it, one button. (NN/g homepage-design-principles; demandcurve.com hero lesson; julian.com landing pages)
2. Story, then technical features, then the product. (Norda)
3. Proof, and answers to the objections found by asking customers. (Shapiro)
4. The range, then stories, then where to buy (Liquid Death's store finder uses the visitor's location).
SPYLT runs these as scroll "beats": opening, flavours, benefits, video, reviews, store locator. (tubikstudio.com/blog/spylt-case-study)

Product page (Norda's order): an action shot in context, detail shots, a standard grid with add-to-cart always visible, the key technology, the founders. Keep specs and FAQ plain and put depth in demo and teardown videos (iyO); reveal the science step by step (Oura); show one in-scale shot because 56 % start with the images and 42 % judge size from them (Baymard).

## 3. Art direction
- Give each picture a job; raw action shots balance a technical product. (Norda)
- A photo style guide fixes lighting, colour tones, composition, editing and how people are directed. (shopify.com/blog/photography-style-guide)
- For each product: in use, with a person for scale, then details.
- Make light a rule (one Glossier shoot asked for "lots and lots of sunlight").
- No final photos yet? Rivian took 3,670 pre-orders without them; iyO rebuilt its device in 3D from the CAD files.
- Video: hero loops are short, can be paused, and respect reduced motion (viget.com background videos); demos sit one tap deeper; Aesop repeats its how-to content in order emails.

## 4. Type and colour
- Type is the voice: Rapha's six custom faces come from its racing archive; Aesop's type and layouts come from its packaging.
- Colour comes from the product: SPYLT's flavour colours act as navigation; iyO stays muted and gives each product one colour.
- Common thread: a neutral base, one colour the brand owns, a distinctive display face, a plain sans for the interface.

## 5. Motion
- Ease-out by default, 200–500 ms; bounce or elastic (800–1200 ms) only for playful brands. (web.dev choosing-the-right-easing)
- Toggles about 100 ms, modals 200–300 ms; past 500 ms it feels like a drag. (NN/g animation-duration)
- Sequences: small elements 0.4–0.6 s, overlap 0.1–0.2 s, stagger 0.05–0.15 s, a 0.1–0.2 s pause before the main button, one easing curve throughout. (Webflow University, sequencing and timing)
- Two modes: fast "productive" motion for the interface, slower "expressive" motion for brand moments, 70–700 ms in all; standard curves cubic-bezier(0.2, 0, 0.38, 0.9) and cubic-bezier(0.4, 0.14, 0.3, 1). (carbondesignsystem.com motion)
- Never animate what keyboard actions trigger; keep interface motion under about 300 ms; judge transitions in the finished layout, not in isolation. (emilkowal.ski; Framer Academy)
- Animate transform and opacity only; CSS scroll-driven animation only for extras; put motion inside `prefers-reduced-motion: no-preference`; anything that moves on its own for more than 5 s needs a pause control. (developer.chrome.com motion guidance)
- Motion carries the idea: Aesop's calm transitions mirror its stores.

## 6. Keeping it fast
- A 0.1 s faster mobile site lifted retail conversions 8.4 %. (web.dev milliseconds-make-millions)
- Never lazy-load the hero image; `fetchpriority="high"` cut Google Flights' LCP from 2.6 to 1.9 s; in Next.js the Image `priority` prop does both. (web.dev fetch-priority)
- Video: a poster image, `muted` and `playsinline`, lazy-load anything below the hero. (web.dev lazy-loading-video)
- Budget for cheap Android phones: a 3 s load for the slowest quarter allows about 730 KiB in total and at most 365 KiB of compressed JavaScript (2024 figures; the 2026 edition allows a little more). (infrequently.org performance-inequality-gap-2026)
- Scale effects to the device: iyO uses a quarter of its particles on old phones and a lower pixel ratio.

## 7. Ideas for a pond-aerator brand (suggestions from this research, not facts)
1. "The pond's night shift": oxygen in a pond usually drops lowest just before dawn (confirm with the owner before saying it), so the aerator's real work happens at night: a pre-dawn hero, one owned colour, the spray as the signature motion. Research it on a night round with farmers.
2. Shoot the pond, not the studio: each model running in a real tambak with a farmer beside it for scale; close-ups of paddles and gearbox; one product shot on white; a 6–8 s muted loop; a 60–90 s install-and-care video that also goes out on WhatsApp after an order.
3. A sizing helper plus a dealer or WhatsApp finder as the store: "How many aerators does my pond need?", the oxygen science step by step, content for the dry and rainy seasons; all within the 730 KiB budget.
