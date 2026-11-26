# The whole store as one system

Written on 2026-11-26 after an audit of every page of the WANGJIA shop and a study of how strong brand stores build the parts between the story pages: the bar, the menu, the footer, the cart, the checkout, the payment page, the spare-parts pages. Read it before touching anything that appears on more than one page, before designing a cart or checkout, and when a round is about "make the whole site better" rather than one page. Page-level story and motion are in `hardware-playbook.md`, `craft.md` and `moves.md`.

## Contents
1. Why a system round is needed
2. The surface rule: night for story, paper for tasks
3. The bar, the menu and the footer
4. The cart and the path to payment
5. Machines and their spare parts
6. Craft worth adding, and craft to leave out
7. How to audit and how to study
8. Sources and what is not verified

## 1. Why a system round is needed

A hero can be excellent while the shop around it is still the starter template. The audit of 2026-11-26 found exactly that. The home page was the night pond; everything a buyer touches after it was untouched:

- A phone had no menu at all. Products and help were reachable only from the footer.
- The footer was a 980 px column of 20 px links with no way to reach a person.
- The cart's minus and plus were 16 px squares; "remove" was a 24 px pill.
- The cart drawer showed one subtotal "before delivery and tax". The 11 % tax first appeared at checkout.
- A WhatsApp button floated over prices and buttons on every page.
- Between 1024 and 1280 px the desktop bar wrapped into three lines and pushed the page sideways.
- Every page shipped the search code: 278 KB of compressed scripts before anyone searched.
- A listing page loaded 830 KB of images for its first screen, and on a phone the first product started 1055 px down.

None of this shows in a screenshot of the hero. The lesson: after a story page lands, walk the whole path a buyer walks (land, browse, compare, add, cart, pay, come back for a part) on a 375 px screen and measure it. The fixes are small and each one is felt.

Results of the round: scripts 278 → about 200 KB compressed (search loads on first touch), listing images 830 → about 90 KB, the 2 HP page's first-screen images 417 → 49 KB, the first product on a phone at 241 px instead of 1055 px, the public folder 2.9 → 0.4 MB.

## 2. The surface rule: night for story, paper for tasks

Dark-branded stores do not stay dark all the way. Teenage Engineering, Analogue and Eiger keep a dark bar and dark story pages, then turn light for the cart, the forms and the checkout; all three checkouts read in the study were light. Forms on a dark ground are harder to fill (Nielsen Norman Group's dark-mode work, 2020 and 2023), and a farmer reads a phone outdoors.

The rule for this shop:

| Surface | Pages | Values |
|---|---|---|
| Night chrome | bar, announcement line, phone menu, footer, missing-page screen | ground `#060b15`, text `#f2f4f7`, lines `rgba(190,210,255,.12)` and `.24`, greys `#a7b1c4` and `#7f8aa0` |
| Night story | home, product, listing | the same, plus the scene |
| Paper task | cart, sign-in, account, checkout, policies, articles, group order | ground `#f6f4ef`, ink `#121417`, text `#2b2f36`, lines `#dedad0` |
| The one accent | the primary button on every surface | amber `#ffb547`, hover `#ffcb80`, text on it `#1a1205` |

The bar and the footer are night on every page, so a paper page sits between two night bands like a sheet on a desk. Never mix inside one page: a white card on a night page, or a night panel in a paper form, reads as a bug. Form fields on paper: white fill, a 1.5 px ink border, text at least 16 px (smaller text makes iOS zoom the page), labels above the field.

## 3. The bar, the menu and the footer

Measured on ten brand stores at 375 px: most are too small to tap. Header icons were 23 to 32 px and quantity steppers 19 to 32 px. The two worth copying were Peak Design (header targets 56 × 64 px, 48 px rows) and Eiger (53 px rows).

**The bar.** 56 px tall on a phone and four things only: menu, logo, WhatsApp as the word "Tanya" with the green mark, cart with a count. Every target at least 44 × 44 px. Search, account and quotes live in the menu. On desktop the few destinations sit in the bar itself (a hover menu that holds two categories is theatre). Check 1024 px: links must not wrap; shorten a label or hold one back until 1280 px rather than let the bar grow a second line. Icons take `currentColor`; a fixed grey from a template disappears on night.

**No floating button.** A chat bubble over the content hides prices and buttons on a small screen. WhatsApp gets fixed places instead: the bar, beside the price, the end of the menu, the head of the footer, the end of every policy page. Each link carries a prefilled first sentence that names the page, and the opening hours stand next to it.

**The menu.** With four machines the menu can be the range itself: a full-screen night sheet whose first rows are the machines by name with "mulai Rp …" on the right, then "Suku Cadang · 11 produk", then help links, the WhatsApp button, sign-in and the hours. Rows 52 to 56 px. Only the first five rows arrive in sequence; a long list that staggers feels slow. No bottom tab bar: it costs 56 px of every screen for four destinations the bar already holds.

**The footer.** It opens with the one thing a buyer here does before buying, in the display face ("Tanya dulu, baru beli."), with the WhatsApp button and hours. Then at most three short lists in 48 px rows. It closes with the legal entity. Indonesian stores add an official block here (legal name and address, the Ministry of Trade's consumer-complaints contact, banks and cargo partners); add it only with wording and numbers the owner has confirmed.

**The missing page.** In the shop's design, with links to the machines, the parts and WhatsApp. An unmatched address outside the shop layout renders the root `not-found`, so both need it.

## 4. The cart and the path to payment

**The drawer and the cart.** Show the whole sum before checkout: subtotal, tax as its own line, total, and one honest sentence about what is not in it yet ("Ongkos kirim kargo dihitung sesuai alamat."). A total that first appears at checkout is the most common reason carts are left. Quantity buttons 44 × 44 px with spoken labels, the number at 16 px. The drawer opens only when the count really changes. An empty cart is a page too: say it is empty and offer the four machines.

**The cart page**, on paper: the lines, the payment schedule in plain words (for a machine: down payment, then the rest), at most three parts that fit what is in the cart, the WhatsApp button outlined next to the amber checkout button.

**Checkout.** Indonesian brand stores read in the study do not let a guest pay on their own site: one sends buyers to marketplaces, one requires an account. This shop's B2B base requires an account too, so the form must earn it: one page on paper, 56 px fields, a sentence under the phone field saying what the WhatsApp number is used for, the cheapest reliable method preselected.

**The payment-instruction page is the real checkout here.** With bank transfer and virtual accounts the buyer leaves the site to pay, often hours later, often from a WhatsApp link. That page must open from a link without a session and show, in this order: the amount and the account in large tabular figures each with a "Salin" button, the deadline as a date and time (gateways default to 24 hours for a virtual account; one large retailer allows 6), "Cara bayar" as numbered steps per bank, a way to send proof where the method is a manual transfer, and the status. After it, an order page with five dated steps (order received, payment confirmed, packed, handed to cargo with the receipt number, delivered).

**Policies and help.** Each page opens with "Ringkasnya": three lines that answer the question most people came with. Then numbered steps, the date it was last updated, and the WhatsApp line.

## 5. Machines and their spare parts

A machine that works in salt water for years is bought once and repaired many times. The parts pages are where the shop earns the second and third sale, and where a buyer decides whether this brand can be kept running.

What stores that sell a machine with its parts do (a thin study, see section 8 for what was really read):

1. **One fit list per part, shown three times**: in the name or on the card, beside the buy button, and as a filter on the parts listing. Framework's parts shop has a "Compatible with" filter grouped by product family with counts, and its links carry the model in the address, so a filtered list can be sent to someone.
2. **Parts are reachable from the machine's own page**, not only from a parts catalogue.
3. **Stock has states and a way to be told**: in stock, coming soon, out of stock, "tell me when it is back".
4. **Help for "which machine do I have?"**: where the nameplate sits and what the number looks like.
5. **Comparison tables** (Nielsen Norman Group, read in full): models as columns, attributes as rows; a static table suits fewer than five items; a phone shows two columns side by side at most; leave out attributes that do not help the choice and take out rows that read the same for every model; keep headers fixed and cells short. The usual failure is inconsistent content, not design.

Built on 2026-11-26, from the catalogue's own numbers (`lib/util/machines.ts` holds which part fits which machine, how many each machine carries, and the shop's own listing order):

- **On a machine page, "Satu rusak, ganti satu".** Every part of that machine with the quantity per machine, the price and a link. It answers "what will this cost me later" before the buyer asks, and it is the proof behind "spare parts available". It ends with a way to send a photo on WhatsApp, because a farmer often knows what broke only by sight.
- **On a part page, "Dipakai di".** The machines the part fits, by name, directly under the buy button. A part without its fit is a risk the buyer has to carry. State only fits the catalogue states: "does not fit the jet aerator" is a claim too, and nobody has confirmed it.
- **On a machine page, "Pilih yang pas".** The four machines side by side with the current one first, rows straight from the spec sheet. A row that reads the same for all four (the warranty) leaves the table and becomes one sentence under it.
- **Cards.** A photo on white (catalogue photos with coloured backdrops are cut out with `scripts/photo_bg.swift`), name, one line, price. The line is the spec that separates the machines ("4 kipas · 3 pelampung") or, on a part, the machines it fits ("Untuk kincir 1 HP & 2 HP"). Quick add only when the product has a single variant; a machine with a phase choice goes to its page.
- **The listing's own order.** A search index and an API return products in no order a buyer would choose: a Rp 90.000 bearing block came first and the machines were scattered among the parts. A listing nobody has sorted now shows the four machines as a range, then the parts in packing-list order (`byShopOrder`), all on one page.

Next, in this order: "Untuk mesin" chips above the parts listing with the filter in the address; the comparison as two columns on a phone, the current machine fixed and the second chosen with chips; a stock line with a WhatsApp "tell me" on part pages; "Gambar bagian", one numbered still of the machine taken apart above a real list that carries the links; "Mesin saya tipe apa?" with a photo of the nameplate or the QR label; and, large, the warranty QR opening that unit's model, warranty date and parts list.

## 6. Craft worth adding, and craft to leave out

Restraint from the main skill still holds: one living picture per page, data that does not move. What a system round adds is consistency of the small things: the same press (`scale(.97)`, 160 ms), the same row heights, the same line colour, the same label style (12 px, tracked, uppercase, grey) on every page. Task pages run on the interface clock only: no reveals, no loops, no pinned scenes. Delight goes in inverse proportion to how often a thing is used.

The newer craft is mostly CSS the browser runs by itself, so it costs no script and the heavy libraries stay on the home page. Chromium ships these first, which suits buyers on Android; every one goes behind `@supports` and `prefers-reduced-motion`, and the page must be complete without it. The version numbers below come from memory and search extracts: check MDN or caniuse before relying on one.

Added on 2026-11-26:
- **A stage that answers the scroll.** On a product page the model's name sinks behind the machine and the reflection thins while the first screen leaves: two keyframes on `animation-timeline: scroll(root block)` with `animation-range: 0px 70vh`, transform and opacity only. A trap: `view()` follows the nearest scroll container, and `overflow: hidden` makes one, so an element inside a clipped stage never moves with `view()`; use `scroll(root)` or a named timeline. Put `animation-timeline` after the `animation` shorthand, which resets it.
- **A `<details>` that grows open.** `interpolate-size: allow-keywords` on the element, `block-size: 0` to `auto` on `::details-content`, with `content-visibility` transitioned `allow-discrete`. Elsewhere it opens at once.

Candidates, by effect per unit of work:
1. Instant feedback on buying: the count and the line change before the server answers (React's `useOptimistic`; this shop's cart context already does it), and the confirmation enters with `@starting-style` instead of script.
2. One card on container queries (`cqi` units), reused as listing card, cart line and order thumbnail, so the small night stage follows a machine through the whole purchase.
3. A view transition from a listing card to the product stage: the cut-out and the model name travel instead of teleporting. Same-document view transitions reached every engine in late 2025; in the App Router it depends on the React and Next versions, so check the installed packages first. Two named elements at most, 200 to 300 ms, measured on a cheap phone, because every named element is a GPU snapshot. Persistent chrome (the bar, the buy bar, the cart dialog) stays outside the transition.
4. `scroll-state` container queries to restyle a bar once it is stuck (the buy bar, the listing's filter bar).
5. `linear()` springs for one-shot feedback such as an "added" tick. They have a fixed duration and cannot be interrupted, so never on anything a user can reverse mid-way, and never on prices.
6. Popover with anchor positioning for instalment and spec notes; `field-sizing: content` on the order-note field.

Leave out: WebGL page transitions with a custom router (they fight the App Router and the GPU budget), fly-to-cart animations (slower than a count that ticks), variable-font axes animated on scroll (not composited), eager prerendering on mobile data (it spends the buyer's quota), a bottom tab bar.

## 7. How to audit and how to study

**Audit by script, not by eye.** At 375 × 812 run `getBoundingClientRect()` over every `a` and `button` in the bar, the footer and the cart and list what is under 44 px; check `document.documentElement.scrollWidth > innerWidth` for sideways scroll; repeat at 360 and 320 px (360 is the commonest Android width, and a phone set to a large display size reports about 320), then at 1024, 1280 and 1440 px (the 1024 to 1280 band is where bars break). Measure once while the page is still loading: a skeleton with fixed widths can be wider than the screen even when the finished page is not. Hidden things count too: a field at `opacity: 0` still takes its width. Read transferred bytes per page from the network panel with the cache off. Count the pixels to the first product.

**Study with a brief, in parallel, and time-boxed.** Three research agents were sent out (chrome and purchase path; machines with spare parts; craft of 2025–26). Two of them stalled for 50 minutes because they opened the browser pane, which waits for a site approval from a person; nobody was there. Rules that follow:
- Background research uses search and page fetching only. The browser pane is for the main session, with the user present.
- Give each agent a call budget and a report format: findings ranked by what the customer feels, the page address for each, "read on the page" marked apart from "seen in a search extract", and a list of what could not be verified.
- Never send the brand, the owner, the repository or the preview address to a search engine; describe the product generically.
- Check on agents after a few minutes, not after an hour.
- Expect thin evidence from fetching alone. Restarted with search and page fetching only, the two agents could read four pages between them: the fetch tool refused most design and shop sites ("unable to verify if domain is safe"), and others answered 403 or 429. A measured teardown of a live site (sizes at 375 px, timings, libraries) needs a real browser with the user present; plan that part of a study for the main session, and say plainly in the write-up what was read and what was only seen in a search summary.
- Apply only what survives a second look. Of the agents' proposals this round, the ones built were those that could be checked against the shop itself in minutes (a fit line, a leaner table, a listing order, a CSS scroll effect); the ones resting on unread numbers went to the roadmap.

**Show the result where the user can open it.** The browse-only copy on GitHub Pages is rebuilt with `node scripts/build-preview.mjs --publish` from `apps/storefront`. The browser pane blocks that host's files, so verify the live copy with `curl` or the local Pages-like server, and tell the user to open it in Chrome or Safari.

## 8. Sources and what is not verified

Read live at 375 × 812 for sections 2 to 4: nothing.tech, analogue.co, teenage.engineering/store, store.dji.com, us.store.bambulab.com, peakdesign.com, erigostore.co.id, eigeradventure.com, polytron.co.id, tokopedia.com; Nielsen Norman Group's articles on dark mode; a payment gateway's documentation for virtual-account expiry.

Read as text for section 5: Framework's parts listing and one part page (frame.work/marketplace/parts, frame.work/products/battery) and Nielsen Norman Group's article on comparison tables. Seen only in search summaries: Baymard's work on compatibility filters and on product-page suggestions, Kärcher's parts finder, iFixit's part verification, Rad Power Bikes' per-model parts pages. Not reachable: Fairphone, iFixit's shop, eReplacementParts, PartsTree. No exploded-view site was read; the "Gambar bagian" recipe is a judgment, not an observation.

Read in full for section 6: Chrome's overview of CSS features in e-commerce case studies (developer.chrome.com/blog/css-ui-ecommerce). Everything else in that section (award lists, the Codrops shop templates, browser versions, the designers' principles) comes from search summaries or memory and was not opened.

Not verified, do not print on the site without the owner: the consumer-complaints contact and the regulation behind it (seen in other stores' footers, the regulation itself not read); the end of manual bank transfer on a large marketplace in March 2025 (search extract only); this shop's own reply hours, delivery times and warehouse city, which are statements for the owner to confirm. No study of screens in sunlight was read; the case for paper task pages rests on the stores observed and the dark-mode articles.
