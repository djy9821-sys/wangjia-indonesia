---
name: dtc-store-design
description: Design or redesign the pages of an independent online store (a DTC brand site) so they read like a top brand site instead of a template — homepages, hero sections, product pages, listing pages, landing pages, the visual system (type, colour, spacing) and motion. Use this skill whenever the user wants the shop or website to look better, more premium, more creative or "like the designs on X", asks to redesign or critique the home page, hero or product page, or wants options to choose from, including the WANGJIA aerator web shop in apps/storefront, even if they never say "design system" or "DTC".
---

# DTC store design

## 中文概要

这个 skill 记录了怎么把独立站做到顶级品牌站的水平，内容来自三类资料：顾客体验研究（Baymard、Nielsen Norman Group、Shopify）、视觉设计基本功（Refactoring UI、排版、配色、间距），以及 Aesop、Liquid Death、Norda、Oura 这些品牌站的案例；也收进了我们自己拆解 Teenage Engineering、Nothing、大疆的实测结果，以及这个项目里走过的弯路。核心就一句话：先有画面和一个品牌概念，再定字体、配色和故事线，动效只轻轻加一点；拿不准口味时做两三个差别很大的小样给人挑，不靠猜。下面的正文是写给 AI 的工作流程和检查清单。

## Why this skill exists

Earlier rounds on this shop failed in an instructive way: gradients, glows, bubbles and counters were added to a page that had almost no imagery, one generic font and no single idea, and the user kept saying it looked ordinary. Every site that sets the bar (see `references/teardowns.md`) does the opposite: imagery and one idea first, then a strict type and colour system, then a story told one screen at a time, and only light motion on top. The user also judges by looking, not by reading proposals, so options must be shown, not described.

## Workflow

Work through these steps in order. Each one produces something concrete; skipping one is how designs drift back to "template".

1. **Brief.** For WANGJIA read `references/wangjia-brief.md` first (audience, allowed claims, assets, stack, owner's taste so far). For anything else fill `assets/creative-brief-template.md`. Output: the brief, short.
2. **References.** Ask the person for two or three sites, posts or screenshots they love and what they love in each; taste cannot be guessed reliably. Open each and measure it the way `references/teardowns.md` does: fonts and sizes, colours, motion timings, libraries, page structure. On this machine outside sites open only in the user's Chrome (Claude in Chrome). Output: what to take from each reference.
3. **Audit what exists.** Check the current page against the checklists below and list the problems by severity. This keeps the redesign honest about what is actually wrong.
4. **Idea and art direction.** Write the brand idea in one sentence and decide what imagery serves it. List what exists, what to shoot or render, and the fallback if it never arrives. Product imagery must be real (60 % of shoppers would feel less confident buying if a product image were AI-generated); generated imagery is only acceptable for atmosphere.
5. **System.** Fix the tokens before drawing pages: display, text and label faces; a type scale; tracking; a spacing scale; the grid; ink, paper, 8–10 greys and one accent; radius; shadows (none on dark surfaces); motion durations and one easing curve. Put them in `tailwind.config.js` or a tokens file so every section draws from the same set.
6. **Story.** Outline each page screen by screen (recipes below). One message per screen.
7. **Mock-ups.** Build two or three genuinely different directions as static HTML at real size, with real product images and real copy, at desktop and phone width, and show them side by side. Let the user pick before touching the real pages; it is far cheaper to throw away a mock-up than a built page.
8. **Build.** Implement the picked direction with the tokens. Prefer server components; keep client JavaScript small; size images yourself; give the first large image `priority`.
9. **QA.** Run the checklists at 375 px and 1440 px, in a dark-mode browser, with reduced motion, and on a throttled network. Record what was checked and what was not.
10. **Show and iterate.** Put the page in front of the user (browser pane, screenshots) and ask one question at a time.

## Principles

- **Imagery first.** Studio shots with consistent light, footage of the product doing its job, renders from CAD. When imagery is weak, design around what is real (cut-outs, honest photos, typography) rather than covering the gap with effects.
- **One idea, held everywhere.** A sentence every headline, picture and motion obeys. It comes from the customer's real situation (Aesop's consultations, Liquid Death's "murder your thirst"), not from a mood board.
- **Type is the brand.** A distinctive display face, a plain text face, at most a mono for labels; extreme contrast between small tracked labels and large display type; large headings often look better in regular or medium weight.
- **Restraint in colour.** A neutral base, one colour the brand owns (taken from the product), greys tinted toward it. Using several bright colours at once is the most common template tell.
- **Story, not a stack of sections.** Homepage: what it is, why it matters, how it works, the range, proof, where to buy. Product page: in use, details, buy, technology, people.
- **Buying is always within reach.** Prices visible on listings and product pages, a sticky or repeated buy action, WhatsApp next to the price and in the specs, with hours stated.
- **Light motion with a job.** 200–500 ms ease-out for most things, 0.05–0.15 s stagger, one curve. Animate transform and opacity only. Nothing that moves on its own on phones; anything that moves on its own for more than 5 s gets a pause control. Everything inside `prefers-reduced-motion: no-preference`.
- **Facts only.** Copy claims only what the catalogue or the business owner confirms; a wrong number can cost a farmer a harvest.
- **Speed is design.** Aim for about 730 KiB total and under 365 KiB of compressed JavaScript for a cheap Android phone on a slow network; never lazy-load the first large image.

## Page recipes

**Homepage.** A hero that says what it is (descriptive headline, one or two sentences, one primary button, the price where it fits) → the brand story or the problem it solves → how it works (the technology, shown) → the range with key specs and prices → proof and answers to objections (warranty, spare parts, delivery, instalments, real customers) → where and how to buy (WhatsApp with hours, location).

**Product page.** Action shot in context with a person for scale → 3–5 more images and a short video in the gallery → title, price, the instalment example and delivery estimate beside the buy and WhatsApp buttons → 2–6 highlights with icons → specs with units, in collapsible sections stacked vertically → the technology explained step by step → FAQ.

**Listing.** Name, price, image, the key spec (power, paddles) on every card; filters for every attribute shown; "Load more" with a count; a comparison table for up to five models.

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

**Store UX** (details in `references/ecommerce-ux.md`)
- The first screen says what is sold and holds the main action.
- Prices are never hidden; total cost (delivery, instalments) shown before checkout.
- Tap targets at least 48 px with 8 px gaps; tel keyboards for phone numbers; forms at most 8 fields.
- No auto-rotating carousel on phones; no floating widget covering content without reserved space.
- Trust: address, warranty, spare parts, contact hours, links to outside reviews; no fake urgency.

**Motion and speed**
- Durations and easing come from the tokens; reduced motion shows the finished state.
- First large image has `priority`; video has a poster, `muted`, `playsinline`, and is lazy below the fold.
- Page weight and JavaScript checked against the budget.

## Working in this repository (WANGJIA)

- Home sections: `apps/storefront/src/modules/home/components/`; page: `apps/storefront/src/app/[countryCode]/(main)/page.tsx`; tokens and keyframes: `apps/storefront/tailwind.config.js`.
- `images.unoptimized` is on: produce right-sized WebP with `sharp`; cut subjects out with macOS Vision (`VNGenerateForegroundInstanceMaskRequest`).
- Fonts come from `@fontsource/*` (Google Fonts are blocked here); install with `--registry=https://registry.npmmirror.com`.
- Mock-ups: write static HTML in the session scratchpad, serve it on 127.0.0.1 only, view it in the browser pane at 1440 and 375 px. The pane pauses animations while hidden: check `getAnimations()` or scroll once before judging a screenshot.
- When the Chrome tool blocks page text (it filters text that looks like query strings), ask the user to paste it. Never transform text to get past the filter.
- Start by checking that Postgres (5432), the backend (9000) and the web shop (8000) are running; they stop when a session ends.
- Record each round in `docs/WORKLOG.zh-CN.md` and reply to the user in Chinese, result first.

## Reference files

- `references/wangjia-brief.md`: always, for work on this shop.
- `references/teardowns.md`: measured habits of Teenage Engineering, Nothing, DJI and MotionSites; use it to calibrate.
- `references/visual-craft.md`: when setting type, spacing, colour, depth and finishing details.
- `references/ecommerce-ux.md`: when designing homepages, listings, product pages, checkout, trust and mobile behaviour.
- `references/brand-and-motion.md`: when finding the idea, structuring the story, briefing imagery, choosing motion and setting the speed budget.
- `assets/creative-brief-template.md`: to start a new brand or page.
