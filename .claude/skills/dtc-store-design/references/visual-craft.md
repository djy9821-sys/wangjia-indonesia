# Visual craft: the rules that separate designed pages from templates

Collected 2026-11-19 from Refactoring UI (free articles and previews; the paid book only by chapter title), Butterick's Practical Typography, Laws of UX, WCAG 2.2, Material Design layout and type guidance, Every Layout, Utopia, Tailwind's docs, Josh Comeau on shadows and Anthony Hobday's "safe rules". Some Refactoring UI, Medium and Material pages were read through search extracts. Source keys are listed at the end.

> Updated 2026-11-20: `craft.md` (section 1) corrects parts of this file: motion runs on two clocks (interface 100–300 ms, scene 0.5–1 s and scroll-scrubbed), CSS scroll-driven animation is now Baseline, and the hero and price must never wait at opacity 0. Where the two differ, `craft.md` wins.

## Hierarchy
- Rank every element. Use colour and weight before size: 2–3 text colours (dark, grey, light grey) and 2 weights (400/500 and 600/700); nothing under 400 in interface text. De-emphasise with a lighter colour or smaller size, not a thinner weight. [7T]
- At most three type sizes in one view; the most important thing is the biggest. [NNG]
- One standout per view, and not signalled by colour alone. [VR]
- Buttons: primary solid, secondary outline, tertiary styled as a link. [7T] One primary per view.
- Labels are a last resort: "12 left in stock", not "In stock: 12". [LBL]
- Group by proximity and by a shared background or border; put things where people expect them; key navigation first or last; fewer, highlighted choices. [PROX][CR][JAK][SP][HICK]

## Typography
- Body text 15–25 px [PT], at least 16 px on the web [AH].
- Line height 120–145 % [PT]: looser for wide lines (1.5–2), tighter for big type (display at 1.0) [LH]. Tailwind's pairs are good defaults: 14/20, 16/24, 18/28, 24/32, 30/36, 36/40, 48+ at 1. [TWF]
- Measure 45–90 characters [PT]; cap prose at about 60ch [EL].
- Scale: a hand-tuned set (12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72) [TWF] or one strict ratio (1.5, 1.618) [ELS]; make it gentler on phones, e.g. ratio 1.2 at 320 px growing to 1.333 at 1500 px (fluid type) [UTO].
- Tracking: capitals get +0.05 to +0.12 em and never more than one line; never track lowercase body text [PTL][PT]. Tighten display type and loosen small labels: Material sets 96 px at −0.016 em and 12 px labels at +0.5 px [M3T]; Tailwind's tracking-tight is −0.025 em [TWL].
- Typefaces: "Most documents can tolerate a second font. Few can tolerate a third." Give each face a fixed role and never mix them in a paragraph [MIX]. Avoid system defaults such as Arial [PT].
- Headings inside content: the smallest visible size step plus space around them; at most three levels [HEAD].

## Spacing and layout
- One spacing scale: an 8 px grid, 4 px for icons, type and tight stacks [M2S]; every measurement relates to the others [AH].
- Start with too much white space [TOC]. More space between groups than within them [PROX]; outer padding at least the inner padding [AH].
- You don't have to fill the whole screen; grids are overrated (use them, but don't let them force a layout) [TOC].
- Grid: 4 columns with 16 px margins under 600 px, 8 columns with 32 px margins up to about 900 px, 12 columns above; gutters 16–24 px; cap the content width and let the margins absorb the rest [M2G]. Breakpoints near 600 / 840 / 1200 / 1600 [M3B].
- Align everything to something; trust optical alignment over mathematical [AH].
- Touch targets at least 24×24 px, 44×44 for key actions, and spaced apart [C258][FITTS].

## Colour
- Define the shades up front: 8–10 greys (the darkest text a very dark grey rather than black, the lightest an off-white background), 1–2 primary hues plus sparing accents, each with 5–10 shades from 100 to 900; 500 works as a button background; on an alert use 900 text on 100, then 700 on 300 [PAL].
- Near-black and near-white; tint neutrals slightly with the brand hue (under 5 % saturation), warm or cool but not both; give each colour a distinct brightness [AH].
- Never grey text on a coloured background: hand-pick a shade of that hue [7T].
- Contrast: text 4.5:1; large text (24 px, or 18.7 px bold) 3:1; no rounding up (4.499 fails) [C143]. Input borders, focus rings and meaningful icons 3:1 [C1411]; links shown by colour alone 3:1 against the surrounding text [G183].
- An accent border (card top, alert side, active nav item) livens a bland layout [7T].

## Depth and imagery
- Light comes from above: shadows mostly with a vertical offset, not a big blur or spread [7T]; one offset ratio for every shadow [JC].
- Higher elements get a larger offset and blur and a lower opacity; blur about twice the offset; two layered shadows like Tailwind's shadow-sm to shadow-xl; tint shadows with the background hue [JC][AH][TWS].
- Fewer borders: use a shadow, two background tints or space instead. If you use borders, they contrast with both the container and the background; avoid two hard dividers side by side; stick to one depth technique; no drop shadows on dark interfaces [7T][AH].
- Photos: specific, never generic stock; one focal point. Text over a photo needs a scrim (dark 20–40 %, light 40–60 %) only behind the text; put simple things on complex backgrounds and the reverse [IMG][AH].
- Icons at their intended size; to make one more prominent, enclose it in a tinted shape rather than enlarging it; soften icons that sit next to text [7T][AH].

## Finishing details
- Curly quotes, a real ellipsis (…), ©/™, proper dashes, kerning on; bold or italic, never both; underline only links [PT].
- Nested radii: inner radius = outer radius minus the gap; button padding horizontally about twice the vertical [AH].
- Supercharge the defaults (styled checkboxes, selects, focus states), decorate backgrounds, design the empty states [TOC].
- Polish raises perceived usability: people forgive more on a page that looks cared for [AUE].

## Ten template tells and their fixes
1. Flat or shouting hierarchy → one hero per view; 2–3 text colours, 2 weights, at most 3 sizes.
2. System font, browser-default heading sizes, untouched tracking → one good family, a tuned scale, tightened display, tracked capitals.
3. Text running the full container width → a 45–75ch measure.
4. Arbitrary, uniform gaps → one spacing scale, bigger gaps between groups.
5. Pure greys and pure black, the brand colour everywhere → a 100–900 palette, tinted neutrals, accents only for meaning.
6. Borders on every box and muddy `0 0 10px` shadows → space and tints first; vertical, layered, tinted shadows.
7. Several filled buttons competing → one primary per view.
8. Generic stock, mixed crops, text on busy photos → real product photos, a fixed aspect ratio with object-cover, scrims.
9. "Label: value" rows and blown-up icons → merged labels; icons at native size in tinted shapes.
10. Straight quotes, "...", mismatched radii, no focus or empty states → real characters, nested radii, 3:1 focus rings, designed empty states.

## Source keys
[7T] medium.com/refactoring-ui/7-practical-tips-for-cheating-at-design-40c736799886 · [PAL] refactoringui.com/previews/building-your-color-palette · [LH] refactoringui.com/previews/line-height-is-proportional · [LBL] refactoringui.com/previews/labels-are-a-last-resort · [TOC] refactoringui.com/book/table-of-contents · [PT] practicaltypography.com/summary-of-key-rules.html · [PTL] practicaltypography.com/letterspacing.html · [MIX] practicaltypography.com/mixing-fonts.html · [HEAD] practicaltypography.com/headings.html · [PROX] lawsofux.com/law-of-proximity · [CR] lawsofux.com/law-of-common-region · [VR] lawsofux.com/von-restorff-effect · [JAK] lawsofux.com/jakobs-law · [SP] lawsofux.com/serial-position-effect · [HICK] lawsofux.com/hicks-law · [FITTS] lawsofux.com/fittss-law · [AUE] lawsofux.com/aesthetic-usability-effect · [C143] w3.org/WAI/WCAG22/Understanding/contrast-minimum · [C1411] w3.org/WAI/WCAG22/Understanding/non-text-contrast · [C258] w3.org/WAI/WCAG22/Understanding/target-size-minimum · [G183] w3.org/WAI/WCAG22/Techniques/general/G183 · [M3T] api.flutter.dev/flutter/material/TextTheme-class.html · [M2S] m2.material.io/design/layout/spacing-methods.html · [M2G] m2.material.io/design/layout/responsive-layout-grid.html · [M3B] m3.material.io/foundations/layout/applying-layout · [IMG] m1.material.io/style/imagery.html · [EL] every-layout.dev/rudiments/axioms · [ELS] every-layout.dev/rudiments/modular-scale · [UTO] utopia.fyi/blog/designing-with-fluid-type-scales · [TWF] tailwindcss.com/docs/font-size · [TWL] tailwindcss.com/docs/letter-spacing · [TWS] tailwindcss.com/docs/box-shadow · [JC] joshwcomeau.com/css/designing-shadows · [AH] anthonyhobday.com/sideprojects/saferules · [NNG] nngroup.com/articles/principles-visual-design
