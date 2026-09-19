# Replace font-outline rendering with native SVG text

## Problem Statement

Every piece of text in a calendar mockup — day numbers, weekday labels, month titles, year titles — is currently rendered as a hand-generated vector outline (an SVG `<path>` traced from the font's glyph curves via `opentype.js`), not as real text. Because paths have no baseline, each string has to be manually re-centered using its own ink bounding box (`xShift`/`yShift` math in `OutlineCache`). This positioning workaround is fragile and adds a layer of indirection between "what the font looks like" and "what gets drawn," making the calendar-mockup code harder to reason about and maintain than it needs to be.

## Solution

Render all calendar text as native SVG `<text>` elements, centered with standard `text-anchor`/`dominant-baseline` attributes, everywhere text currently appears as an outline. This removes the manual bounding-box centering math and the `opentype.js`-based glyph-to-path pipeline entirely.

The same SVG markup is used for the live in-editor preview, the JPG export, and the PDF export today, and this stays true after the change — one rendering mechanism, not three. Because the JPG export rasterizes a detached, serialized copy of the SVG (via `img.src = blob:...`) and the PDF export renders through `svg2pdf.js`/`jsPDF`, neither of which inherits the page's own fonts, the project's selected font (bold + regular) must be embedded directly into the exported SVG/PDF so `<text>` keeps rendering in the correct typeface instead of silently falling back to a default font. Since exported files are print-ready (dimensions in mm), a silent font-fallback would mean a customer receives a wrong-typeface physical product, so this must not be allowed to fail silently.

## User Stories

1. As a calendar-app user, I want day numbers to appear correctly centered in their grid cells, so that the calendar looks polished regardless of which digits are shown.
2. As a calendar-app user, I want weekday labels (Mon–Sun) to be correctly centered above their columns, so that the header row looks aligned.
3. As a calendar-app user, I want the month title and year title to render in my chosen font, so that the calendar matches the style I picked.
4. As a calendar-app user, I want faded "previous month" and "next month" day numbers to remain visually distinguished (lighter fill, regular weight) from the current month's days, so that I can tell at a glance which days belong to the visible month.
5. As a calendar-app user selecting between EB Garamond, Montserrat, and Caveat, I want all three fonts to render correctly as text (including Caveat's irregular glyph shapes), so that my chosen typeface is represented faithfully.
6. As a calendar-app user creating a calendar in Russian, I want Cyrillic month names and weekday labels — including letters with descenders/ascenders (р, у, д, and similar) — to render and center correctly, so that Russian-language calendars look as polished as English ones.
7. As a calendar-app user creating a calendar in English, I want English month names and weekday labels to render and center correctly, so that English-language calendars look as polished as Russian ones.
8. As a calendar-app user, I want the live preview I see while editing to visually match what I get when I download, so that there are no surprises at export time.
9. As a calendar-app user downloading a JPG, I want the exported image to use my selected font for all text, so that the raster export matches the on-screen calendar.
10. As a calendar-app user downloading a single-page PDF, I want the exported PDF to use my selected font for all text, so that the PDF I print matches the on-screen calendar.
11. As a calendar-app user downloading a multi-page PDF (all months), I want every page's text to use my selected font consistently, so that the whole printed calendar looks uniform.
12. As a calendar-app user, I want my calendar's positioning (grid, title placement, layout) to look effectively the same as before this change, so that this feels like an internal improvement rather than a redesign.
13. As a developer maintaining this codebase, I want text placement to use standard SVG centering attributes instead of manually computed offsets, so that future layout changes don't require re-deriving bounding-box math per string.
14. As a developer maintaining this codebase, I want the font-loading pipeline to stop depending on `opentype.js` glyph parsing for rendering, so that the dependency footprint and code paths for text rendering are smaller.
15. As a developer maintaining this codebase, I want a single, testable place that decides how a font gets embedded for export (JPG and PDF), so that font-embedding correctness isn't duplicated or drifted between export formats.
16. As a developer sending a calendar to print on behalf of a customer, I want a way to visually verify that all three fonts render correctly in both languages before shipping this change, so that no customer receives a calendar with the wrong typeface.

## Implementation Decisions

- All text nodes currently produced via `OutlineCache`/`getAndPlaceOutline` (day-cell digits, weekday labels, month title, year title) are replaced with SVG `<text>` elements using `text-anchor="middle"` and `dominant-baseline="central"` for centering, removing the ink-bounding-box (`xShift`/`yShift`) centering calculation entirely.
- `opentype.js` is removed as a rendering dependency. Font files are still fetched as before, but are no longer parsed into glyph outlines — they're kept as raw bytes for font-embedding purposes only.
- Because the project's fonts ship as separate static TTFs per weight (not variable fonts), each weight is exposed as its own `font-family` name (e.g. a bold-specific family name and a regular-specific family name) so CSS `font-family` selection — not `font-weight` — picks the correct file, matching today's `bold`/`regular` split.
- Only the single font selected for the current project (bold + regular, i.e. the two files already loaded per project) needs to be made embeddable — not all font families bundled with the app.
- `FontsController` is extended (not replaced) to expose, per font + weight, an embeddable representation of the already-fetched font bytes: a base64 `@font-face` CSS block (for SVG/JPG use) and VFS-ready data suitable for `jsPDF.addFont()` (for PDF use). This replaces its current responsibility of producing parsed `opentype.js` font objects.
- The same embedded `@font-face` block is injected into the live-mounted SVG's own `<style>`, so the live in-editor preview renders the correct font without relying on any global app-level `@font-face` CSS (none currently exists).
- Before JPG rasterization, the cloned SVG has the selected font's `@font-face` block embedded in its `<style>` prior to serialization, so the detached, blob-rendered copy still resolves the correct font (an `<img>`-loaded SVG does not inherit the parent document's fonts).
- Before PDF generation, the selected font's bytes are registered with `jsPDF` via its virtual file system and `addFont()`, so `svg2pdf.js` resolves `<text>` `font-family` references to the correct embedded font instead of falling back to a default font.
- IndexedDB project persistence (`IDBController`/`DataController`) is unaffected by this change — it stores calendar configuration (format, year, month, selected font name, language) and uploaded images, not rendered SVG geometry, so no migration of previously saved projects is needed.
- Fill color and font weight distinctions for previous/next-month faded day numbers (`#999`, regular weight) versus current-month day numbers (default fill, bold weight) are preserved, expressed via `fill` and `font-family` on the `<text>` element instead of on the generated `<path>`.
- Minor visual differences in centering are accepted: font-metric-based centering (`dominant-baseline="central"`) may differ slightly from the current ink-bounding-box centering, most noticeably for Caveat's irregular glyph shapes. This is an accepted tradeoff, not a defect.

## Testing Decisions

- Tests should assert on the resulting SVG markup and structure (external, observable behavior), not on internal method calls or intermediate data shapes — consistent with the existing `createSVGElement` test in `src/test/utils.test.ts`, which constructs an element and asserts on its tag, attributes, and DOM placement.
- **`ViewController`** (existing entity, currently untested directly but exercised indirectly; other entities like `UploadManager` are unit-tested per `src/test/uploadManager.test.ts`'s pattern of constructing the class with mocked options and asserting on resulting DOM/behavior) gains coverage asserting that day-cell digits, weekday labels, month titles, and year titles are rendered as `<text>` elements (not `<path>`) with the expected content, centering attributes, fill, and font-family, for both current-month and adjacent-month (faded) day cells. Because the same SVG this produces is reused for live preview, JPG export, and PDF export, this single seam covers correctness for all three consumers.
- **`FontsController`** (existing entity) gains coverage asserting that, given a loaded font and a requested weight, it returns a correct embeddable `@font-face` CSS block and correct VFS-ready data for `jsPDF.addFont()` — independent of any canvas, PDF, or DOM rendering.
- **`DownloadManager`** (existing entity, currently untested; `uploadManager.test.ts` establishes the pattern of mocking its constructor options with `vi.fn()`) gains light integration coverage confirming it injects `FontsController`'s embeddable font data into the cloned SVG's `<style>` before JPG serialization, and passes it to `jsPDF.addFont()` before PDF generation — verifying the wiring between the two seams above, not re-testing their internals.
- Automated tests run under `vitest`/`jsdom`, consistent with the existing test setup, and do not attempt to verify actual visual/pixel rendering (jsdom doesn't render fonts).
- Outside of automated tests: before this change ships, manually verify all three fonts (EB Garamond, Montserrat, Caveat) in both languages (RU, EN — including Cyrillic descenders/ascenders such as р, у, д) render correctly in at least two browsers, across live preview, JPG export, and PDF export. A physical test print is recommended but not required before shipping.

## Out of Scope

- Any change to how calendar projects are persisted in IndexedDB (`IDBController`/`DataController`) — this data already stores configuration, not rendered geometry, and needs no migration.
- Any change to font selection UI, the set of available fonts, or font licensing.
- Dynamic text-fitting/auto-shrink logic for long strings — no such logic exists today (font sizes are fixed per output format) and none is being introduced.
- Subsetting embedded fonts to only the glyphs actually used (full font files are embedded as-is; this is an accepted size tradeoff, not a target for this work).
- Automated visual/pixel-level regression testing or automated print verification — verification here is manual, as described in Testing Decisions.
- Any change to the multi-page vs. single-page calendar layout logic, grid geometry, or output dimensions.

## Further Notes

- Output artifacts (JPG/PDF) are print-ready (dimensions specified in mm), so a font-embedding regression isn't merely cosmetic on-screen — it could result in a customer printing a physical calendar with the wrong typeface. This is why font-embedding correctness for both export paths is treated as a hard requirement rather than a nice-to-have, and why manual verification is called out explicitly above.
- This change was scoped through direct discussion and codebase investigation (`OutlineCache`, `FontsController`, `ViewController`, `DownloadManager`, `SVGToCanvasBlob`), not a written ADR — no existing ADR covers this area of the codebase.
