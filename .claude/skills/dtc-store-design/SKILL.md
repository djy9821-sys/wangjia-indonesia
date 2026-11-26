---
name: dtc-store-design
description: Design or redesign the pages of an independent online store (a DTC brand site) so they read like a top brand site instead of a template — homepages, hero sections, product pages, listing pages, landing pages, the visual system (type, colour, spacing), motion, and cinematic heroes or scroll stories built with video or real-time 3D. Use this skill whenever the user wants the shop or website to look better, more premium, more creative or "like the designs on X", asks to redesign or critique the home page, hero or product page, or wants options to choose from, including the WANGJIA aerator web shop in apps/storefront, even if they never say "design system" or "DTC".
---

# DTC store design

## 中文概要

这个 skill 记录了怎么把独立站做到顶级品牌站的水平。资料来自四类：顾客体验研究（Baymard、Nielsen Norman Group、Shopify），视觉和动效的手艺（排版、配色、间距、动效节奏的课程和文章），获奖网站和硬件品牌的做法（苹果、大疆、拓竹、Teenage Engineering、Nothing 的实测拆解，以及 Aesop、Oura 等案例），还有这个项目里走过的弯路。核心：第一屏要是会动的画面，产品在统一的光里干活，让画面先把品牌概念讲出来，文字只补一句；颜色和字体要克制，画面和动效要大胆。没有实拍素材时，就照产品照片建一个实时 3D 场景。拿不准口味时做两三个差别很大的小样，摆在参考网站旁边比，不靠猜。首页做好以后，还要把顾客从进站、挑选、加购、付款到回来买配件的整条路在手机上量一遍：顶栏、菜单、页脚、购物车、结账这些每页都有的部分往往还是模板原样；讲故事的页面用夜色，办事和阅读的页面用纸色（见 `references/store-system.md`）。下面的正文是写给 AI 的工作流程和检查清单。

## Why this skill exists

Earlier rounds on this shop failed in an instructive way: gradients, glows, bubbles and counters were added to a page that had almost no imagery, one generic font and no single idea, and the user kept saying it looked ordinary. Every site that sets the bar (see `references/teardowns.md`) does the opposite: imagery and one idea first, then a strict type and colour system, then a story told one screen at a time, and only light motion on top. The user also judges by looking, not by reading proposals, so options must be shown, not described.

Round two (mock-ups A and B, 2026-11-19) then obeyed every rule and still looked static: the idea "while you sleep, the pond keeps breathing" was only written. There was no water, no night, and the machine was a still cut-out. Restraint belongs to colour and type, not to imagery and motion. Round three (A2, `docs/mockups/home-2026-11-20/`) shows the idea instead: a real-time 3D night pond with the machine working, and a scroll story that runs from night to dawn. `references/cinematic-scenes.md` records how it was built.

Round four (2026-11-26) found the other half of the job. The hero was the night pond, and everything a buyer touches after it was still the starter template: a phone had no menu, the cart's buttons were 16 px, tax first appeared at checkout, the desktop bar broke at 1024 px. A store is judged on the whole path, so after a story page lands, audit and design the system around it. `references/store-system.md` records the audit, the surface rule and the recipes.

## Workflow

Work through these steps in order. Each one produces something concrete; skipping one is how designs drift back to "template".

1. **Brief.** For WANGJIA read `references/wangjia-brief.md` first (audience, allowed claims, assets, stack, owner's taste so far). For anything else fill `assets/creative-brief-template.md`. Output: the brief, short.
2. **References.** Ask the person for two or three sites, posts or screenshots they love and what they love in each; taste cannot be guessed reliably. Open each and measure it the way `references/teardowns.md` does: fonts and sizes, colours, motion timings, libraries, page structure. On this machine outside sites open only in the user's Chrome (Claude in Chrome). Output: what to take from each reference.
3. **Audit what exists.** Check the current page against the checklists below and list the problems by severity. This keeps the redesign honest about what is actually wrong. When the round is about the whole shop, audit the path a buyer walks instead of one page, by script and at 320, 360, 375, 1024 and 1440 px (`references/store-system.md`, section 7).
4. **Idea and art direction.** Write the brand idea in one sentence and decide what imagery serves it. List what exists, what to shoot or render, and the fallback if it never arrives. Product imagery must be real (60 % of shoppers would feel less confident buying if a product image were AI-generated); generated imagery is only acceptable for atmosphere. Then choose the **signature moment**: the one moving picture that shows the idea, such as footage of the product at work, a real-time 3D scene built from the catalogue dimensions (`references/cinematic-scenes.md`), or a scroll-scrubbed sequence. A still cut-out on a flat colour is not a signature moment.
5. **System.** Fix the tokens before drawing pages: display, text and label faces; a type scale; tracking; a spacing scale; the grid; ink, paper, 8–10 greys and one accent; radius; shadows (none on dark surfaces); motion durations and one easing curve. Put them in `tailwind.config.js` or a tokens file so every section draws from the same set.
6. **Story.** Outline each page screen by screen (recipes below). One message per screen, and for each screen what the picture does (camera, light, state of the product), not only what the text says.
7. **Mock-ups.** Build two or three genuinely different directions as static HTML at real size, with real product images and real copy, at desktop and phone width, and show them side by side. Before showing them, put each mock-up beside screenshots of the references at the same size. If it looks static or template-like next to them, it is not done: fix the picture before polishing details. Let the user pick before touching the real pages; it is far cheaper to throw away a mock-up than a built page.
8. **Build.** Implement the picked direction with the tokens. Prefer server components; keep client JavaScript small; size images yourself; give the first large image `priority`.
9. **QA.** Run the checklists at 375 px and 1440 px, in a dark-mode browser, with reduced motion, and on a throttled network. Record what was checked and what was not.
10. **Show and iterate.** Put the page in front of the user (browser pane, screenshots) and ask one question at a time.

## Principles

- **Imagery first, and alive.** The first screen shows the product at work in one consistent light: footage, or a real-time scene, or renders from real dimensions. Studio shots and honest photos carry the rest. When imagery is weak, build the picture (a 3D scene from the catalogue photos) instead of covering the gap with effects such as glows, gradients and counters.
- **One idea, shown before it is told.** A sentence every headline, picture and motion obeys; the picture must make it visible without the words. It comes from the customer's real situation (Aesop's consultations, Liquid Death's "murder your thirst"), not from a mood board.
- **Type is the brand.** A distinctive display face, a plain text face, at most a mono for labels; extreme contrast between small tracked labels and large display type; large headings often look better in regular or medium weight.
- **Restraint in colour and type, boldness in imagery and motion.** A neutral base, one colour the brand owns (taken from the product), greys tinted toward it. Using several bright colours at once is the most common template tell; a static first screen is the second.
- **Story, not a stack of sections.** Homepage: what it is, why it matters, how it works, the range, proof, where to buy. Product page: in use, details, buy, technology, people.
- **Buying is always within reach.** The price and the buy button in the hero (Apple and Bambu Lab both do it), a sticky product bar after it, prices on listings and product pages, WhatsApp next to the price and in the specs, with hours stated.
- **Motion on two clocks, cast by role.** The interface clock is quick and quiet: 100–300 ms (a press is `scale(.97)` over 160 ms), hovers only where hover exists. The scene clock is the show: entrances 0.5–1 s, headings through line masks over 0.8–0.9 s, one pinned chapter per page scrubbed by the scroll, and an ambient living hero. Give each element a role (lead, support, decoration, static); data people read (prices, specs, tables, forms) does not move. One fade-up applied to everything is a template tell. Nothing advances content on its own; ambient motion longer than 5 s gets a pause control; reduced motion keeps fades, drops movement and cuts between scene states. Never hide the hero or the price at opacity 0 or behind `document.fonts.ready`. Details: `references/craft.md`.
- **Facts only.** Copy claims only what the catalogue or the business owner confirms; a wrong number can cost a farmer a harvest.
- **Speed is design.** Aim for about 730 KiB total and under 365 KiB of compressed JavaScript for a cheap Android phone on a slow network; never lazy-load the first large image. A 3D hero fits: A2 ships about 210 KB of JavaScript (three.js, GSAP, Lenis), about 520 KB before scrolling, and paints a poster frame first.

## Page recipes

**Homepage.** A living hero that says what it is (the product at work, the idea in one line, the price and one primary button) → a scroll chapter that shows why it matters (the problem, told by the picture) → how it works (the product opened up, parts labelled) → the range with key specs and prices → proof and answers to objections (warranty, spare parts, delivery, instalments, real customers) → where and how to buy (WhatsApp with hours, location).

**Product page.** Action shot in context with a person for scale → 3–5 more images and a short video in the gallery → title, price, the instalment example and delivery estimate beside the buy and WhatsApp buttons → 2–6 highlights with icons → specs with units, in collapsible sections stacked vertically → the technology explained step by step → FAQ. For a machine sold in Indonesia, follow the twelve-screen outline in `references/hardware-playbook.md` (buy box first, the anatomy with spare-part prices, delivery per island, instalments in motorbike-credit form). The shop's product page follows it since 2026-11-20 ("As built" in that file). The owner wants the night of A2 there too: shown a light buy page on 2026-11-24, they asked whether it was wrong, so product pages share the home page's ink, type and accent, open on a night stage (the machine cut-out on dark water, the model set huge behind it, its reflection), keep prices and specs still and at least 4.5:1, and end the night on a light band before the footer. Ask before giving one page of a picked direction a different look.

**Listing.** Name, price, image, the key spec (power, paddles) on every card; filters for every attribute shown; "Load more" with a count; a comparison table for up to five models.

**Bar, menu, footer, cart, checkout.** Night chrome on every page; a 56 px phone bar with menu, logo, WhatsApp and cart; a full-screen menu that lists the machines with prices; a footer that opens with the way to ask a person; the whole sum with tax in the cart; a paper checkout; a payment-instruction page that opens from a WhatsApp link. A machine page lists its wear parts with prices, a part page names the machines it fits. Recipes and measurements: `references/store-system.md`.

Details and sources: `references/ecommerce-ux.md` and `references/brand-and-motion.md`.

## Checklists

**Visual craft** (details in `references/visual-craft.md`)
- One standout per view; 2–3 text colours, 2 weights, at most 3 sizes per view.
- A tuned type scale; display tracked tighter, capitals tracked +0.05–0.12 em; prose at 45–75 characters per line; body at least 16 px.
- One spacing scale (8 px, 4 px for tight spots); more space between groups than within.
- Neutrals tinted toward the brand hue; one accent; text contrast 4.5:1 (3:1 for large text), focus rings 3:1.
- Few borders; shadows vertical, layered and tinted; no drop shadows on dark surfaces.
- Real product photos with fixed aspect ratios; scrims behind text on photos.
- Real typographic characters (curly quotes, …), nested radii, designed focus and empty states.
- Mono only for spec values, times and model codes; selling notes in the text face at 14–15 px, weight 500.
- Every section opens differently (statement, split, sticky list, row, full bleed); one master grid split reused throughout; at least one element per view crosses an edge.
- The 40-item details list in `references/craft.md` (non-breaking spaces in prices, `translate="no"` on brand names, press states, `theme-color`, and so on).

**Store UX** (details in `references/ecommerce-ux.md`)
- The first screen says what is sold and holds the main action.
- Prices are never hidden; total cost (delivery, instalments) shown before checkout.
- Tap targets: 48 px is the aim for rows and buttons, 44 px the floor for icons in the bar, with 8 px gaps; measure them by script. Tel keyboards for phone numbers; forms at most 8 fields; field text at least 16 px.
- Story pages (home, product, listing) and the chrome are night, task and reading pages are paper, and one page never mixes the two.
- The cart shows subtotal, tax and total before checkout, and says what is not in the sum yet.
- The bar holds one line at 1024 px; no page scrolls sideways from 320 px up, also while it is loading.
- No auto-rotating carousel on phones; no floating widget over the content: chat gets fixed places (the bar, beside the price, the menu, the footer).
- Trust: address, warranty, spare parts, contact hours, links to outside reviews; no fake urgency.

**Motion and speed**
- Durations and easing come from the tokens; reduced motion shows the finished state.
- First large image has `priority`; video has a poster, `muted`, `playsinline`, and is lazy below the fold.
- Page weight and JavaScript checked against the budget.
- A WebGL scene renders only while a scene chapter is on screen, has a low-power path, a pause control, a poster frame, and a fallback without WebGL.

## Working in this repository (WANGJIA)

- Home page: `apps/storefront/src/modules/home/components/night/` (the A2 build: `scene.ts` three.js scene, `stage.tsx` scroll choreography, `index.tsx` server markup with prices from the shop, `night.css` scoped styles); route: `apps/storefront/src/app/[countryCode]/(main)/page.tsx`; Tailwind tokens: `apps/storefront/tailwind.config.js`.
- Open the dev server as `http://localhost:8000`, not `127.0.0.1`: Next.js 16 blocks dev resources for other hosts, so the page never hydrates and nothing moves.
- Next resizes every image to the size it shows (WebP; on since 2026-11-25, the backend host comes from `NEXT_PUBLIC_MEDUSA_BACKEND_URL` in `next.config.js`), so give each `fill` image a real `sizes`. Catalogue photos with a coloured backdrop: `scripts/photo_bg.swift` finds them and puts the subject on pure white with macOS Vision (`VNGenerateForegroundInstanceMaskRequest`), keeping the file name.
- Listing pages and the product card: `modules/store/templates/listing.css` gives Medusa UI's CSS variables night values inside `.wj-list`, and `modules/products/components/product-card/` draws every card (machines on a small night stage, photos multiplied onto a pool of light; light again on the paper band under a product page).
- The chrome: `modules/layout/templates/nav/` (the bar), `modules/layout/components/mobile-menu/` (the phone menu, styles under `.wj-menu` in `styles/globals.css`), `modules/layout/templates/footer/`, `modules/layout/templates/not-found/`, `modules/cart/components/cart-drawer/`. Night pages mark themselves with `data-wj-night`, `data-wj-product` or `data-wj-list`; everything else sits on the paper body. `lib/util/machines.ts` holds which part fits which machine.
- The public browse-only copy (GitHub Pages) is rebuilt with `node scripts/build-preview.mjs --publish` from `apps/storefront`. The browser pane blocks that host's files: check the live copy with `curl`, and look at it through a local static server instead.
- Research agents sent to study other sites use search and page fetching only. The browser pane waits for a site approval from a person, and an unattended agent stalls there.
- Fonts come from `@fontsource/*` (Google Fonts are blocked here); install with `--registry=https://registry.npmmirror.com`.
- three.js 0.187, GSAP 3.15 (ScrollTrigger included, free for commercial use) and Lenis 1.3 install from npmmirror too; esbuild 0.28 is already in `node_modules` for bundling a mock-up. Mock-up A2 (`docs/mockups/home-2026-11-20/`, source in `a2-scene.source.js`) is the reference implementation of a 3D hero and scroll story.
- Mock-ups: write static HTML in the session scratchpad, serve it on 127.0.0.1 only, view it in the browser pane at 1440 and 375 px. The pane pauses animations while hidden: check `getAnimations()` or scroll once before judging a screenshot.
- When the Chrome tool blocks page text (it filters text that looks like query strings), ask the user to paste it. Never transform text to get past the filter.
- Start by checking that Postgres (5432), the backend (9000) and the web shop (8000) are running; they stop when a session ends.
- Record each round in `docs/WORKLOG.zh-CN.md` and reply to the user in Chinese, result first.

## Reference files

- `references/wangjia-brief.md`: always, for work on this shop.
- `references/teardowns.md`: measured habits of Teenage Engineering, Nothing, DJI, MotionSites, Apple and Bambu Lab; use it to calibrate.
- `references/craft.md`: motion on two clocks and by role, scroll rules, hover and press, reduced motion, typography and font licences, composition, art direction without photography, a 40-item details list, and what the top design courses teach.
- `references/hardware-playbook.md`: how hardware brands and 独立站 courses sell a machine, Indonesian payment and delivery norms, the local competition, and the WANGJIA product page outline.
- `references/moves.md`: the 24 set-piece techniques award sites use, their cost in KB and GPU time on the phones Indonesians buy (Mali-G52 class), the device tiers, and the licences of reference code.
- `references/store-system.md`: when the work is the whole shop or anything shared between pages: the audit of 2026-11-26, night for story and paper for tasks, the bar, menu and footer, the cart and the path to payment, machines and their spare parts, how to audit by script and how to run a study.
- `references/visual-craft.md`: when setting type, spacing, colour, depth and finishing details.
- `references/ecommerce-ux.md`: when designing homepages, listings, product pages, checkout, trust and mobile behaviour.
- `references/brand-and-motion.md`: when finding the idea, structuring the story, briefing imagery, choosing motion and setting the speed budget.
- `references/cinematic-scenes.md`: when there is no footage and the hero or a scroll story needs a living picture (a real-time 3D scene: model, water, light, choreography, budget, fallbacks, testing).
- `assets/creative-brief-template.md`: to start a new brand or page.
