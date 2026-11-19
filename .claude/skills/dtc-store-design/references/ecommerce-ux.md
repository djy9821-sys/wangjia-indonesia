# E-commerce UX rules (research-backed)

Sources: Baymard Institute, Nielsen Norman Group (NN/g) and Shopify's theme guidance, collected 2026-11-19. Some Baymard figures came from search extracts of the cited pages because the site blocked direct fetching. Tests are mostly with US/European shoppers; [J] marks a judgment rather than a finding. Use these as defaults and break them only with a reason you can state.

## Homepage
- Say what you sell and how you differ, and show the full range. (NN/g, ecommerce-homepages-listing-pages)
- Put the main action in the first screen: it gets 57 % of viewing time, the first two screens 74 %. (NN/g, scrolling-and-attention)
- A small catalogue should skip intermediate category pages (31 % of testers struggled with them); link "View all". (Baymard, dtc-avoid-intermediary-category-pages)
- Tell the brand story (origin, materials, manufacturing, quality): over 60 % of DTC testers looked for it, against 37 % on retail sites. (Baymard, dtc-users-informational-needs)
- Carousels never rotate by themselves on mobile. (Baymard, homepage-carousel) For this shop: a hero slider may only move when tapped, or at most on desktop and never while pointed at.

## Category and listing
- Each item shows price, name, thumbnail, rating with count and variants; spec-driven products add the key spec (for an aerator: power, number of paddles). (Baymard, product-listing-information)
- Every attribute shown on items gets a filter; show counts per value and disable values with zero results. (Baymard; Shopify storefront filtering UX)
- Prefer "Load more" plus lazy loading over pagination or endless scroll, and say "Viewing 40 of 333". (Baymard; NN/g alternatives-pagination-listing-pages)
- Spec-driven goods need comparison (67 % of testers used it, rarely on mobile); a static table works up to 5 options, about 2 columns on phones. (Baymard, provide-comparison-features; NN/g comparison-tables)

## Product page
- Title, price and the buy action are prominent. (Shopify theme design best practices)
- At least 3–5 images, one showing scale: 42 % try to judge size from photos and 37 % of sites lack such an image. (Baymard)
- Video goes in the gallery as a supplement: 41 % watched it, 59 % skipped. (Baymard, embedding-product-page-videos)
- 2–6 highlights, each an icon or image plus a line of text (78 % of sites have none). (Baymard, structure-descriptions-by-highlights)
- Collapsible sections stacked vertically, not horizontal tabs (the worst of four layouts tested). (Baymard, avoid-horizontal-tabs)
- Key points first, jargon explained, a unit on every spec value. (NN/g ecommerce-product-pages; Baymard product-spec-sheet-ux-design)
- Shipping or total-cost estimate beside the buy button: 64 % looked for it there. (Baymard, show-shipping-costs-on-product-pages)
- Link to chat from the product page and state hours and reply time. (NN/g, chat-ux)

## Cart and checkout
- The average checkout has 23.48 form elements (14.88 fields); 12–14 elements (7–8 fields) is achievable. (Baymard)
- Guest checkout as the top option (47 % of sites hide it). (Baymard)
- Explain why a phone number is needed, inline; 14 % abandon when it is simply required. (Baymard, explain-phone-number-field)
- Give a delivery date range, not "2–5 days" (41 % don't). (Baymard)
- Unexpected extra costs are the top abandonment reason (40 % in 2026); show unusual fees on the product page, ideally with a postcode estimate. (Baymard cart-abandonment-rate; NN/g ecommerce-taxes-fees)
- On mobile: order summary at the top, guest option in the first screen. (NN/g, mobile-checkout-ux)

## Trust and payment
- Credibility comes from design quality, upfront disclosure (contact, fees, guarantees), complete content that shows people and process, and links to the wider web. (NN/g, trustworthy-design)
- Hidden prices sent business buyers to competitors; show at least sample prices or ranges. (NN/g, show-price)
- On-site reviews of a DTC brand carry little weight; 62 % would check third-party reviews of an unfamiliar brand. (Baymard, user-reviews-dtc)
- Instalments are normal for expensive goods; offer a few non-card methods, not fourteen. (NN/g)
- Payment step: preselect the main method, no dropdown; summarise instalment fees, interest and schedule. (Baymard)
- No fake countdowns, stock levels or viewer counts. (Shopify theme store requirements)
- 60 % of shoppers would feel less confident buying if a product image were AI-generated. (Baymard, 2026) Use real product photos; generated imagery only for atmosphere, never for the product or results.

## Mobile
- Tap targets at least 7×7 mm (Baymard), 1×1 cm (NN/g), 48×48 px with 8 px gaps (Shopify).
- Tel or numeric keyboards for numbers; never require brackets or dashes. (Baymard, mobile-touch-keyboards)
- Avoid sticky chat widgets that cover content; also place static chat links in the header, footer and help areas. (Baymard, live-chat-usability-issues) [J] For a WhatsApp-first shop a chat button is worth keeping, but give it its own reserved space rather than floating over content.
- Swipeable gallery with pinch zoom (40 % of sites lack it). (Baymard, mobile-image-gestures)
- Product categories at the top level of the menu. (Baymard, ecommerce-navigation-best-practice)
- Never lazy-load the first large image; Shopify's theme floor is Lighthouse performance 60 and accessibility 90. (Shopify performance best practices)
- Past 1 second users lose their flow; at 10 seconds many leave. (NN/g, response-times-3-important-limits)

## Search
- A niche DTC shop rarely needs search below about 20 unique products. (Baymard, dtc-search)
- Support model numbers, product types, features, symptoms and non-product queries (66 % of sites fail the last). (Baymard)
- Suggest corrections for misspellings and map synonyms. (Baymard)
- Autocomplete: at most 10 suggestions on desktop, 4–8 on mobile, plus "View all results". (Baymard; Shopify predictive search UX)
- A visible search box at least 27 characters wide; on mobile a submit button beside it. (NN/g; Baymard)
- No-results page: alternatives, categories and a direct sales contact. (Baymard)

## The five that matter most for an expensive machine sold through WhatsApp to farmers on phones [J]
1. Full cost on the product page, never "price on WhatsApp": cash price, delivery (and installation) cost by area, the instalment plan (down payment, monthly amount × months, total, fees).
2. WhatsApp wherever questions arise: a static button beside the price, in the specs, on no-results and order pages, prefilled with the product name, with hours and reply time stated.
3. Answer "will it suit my pond?" before the chat: real photos of it running with a person for scale, a short video, highlights (power, paddles, pond area once confirmed), specs with units.
4. Prove the brand is real: address, warranty, spare-part prices and stock, service contacts, links to YouTube, marketplace ratings and named customers; no fake urgency, no AI-generated product photos.
5. Build for a cheap phone at the pond's edge: fast first image, 48 px targets, tel keyboard, a guest form of at most 8 fields that says the number is for WhatsApp updates.
