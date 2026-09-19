# Plan: Replace font-outline rendering with native SVG text

> Source PRD: `outline-to-text-prd.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Text rendering**: every calendar string (day digits, weekday labels, month title, year title) is an SVG `<text>` element. No `<path>` outlines, no `opentype.js` at render time.
- **Centering / placement — nothing moves**:
  - Day digits and weekday labels (currently ink-box centered via `OutlineCache`) use `text-anchor="middle"` + `dominant-baseline="central"` at the same `x`/`y` they are centered on today.
  - Month and year titles are currently placed by `getPath(text, x, y, size)`, i.e. left-aligned with the baseline at `y`. They keep exactly that: `text-anchor="start"`, no `dominant-baseline` override, same `x`/`y`. They are **not** switched to centered.
  - The RU `Ср` `descenderException` y-offset exists only to compensate ink-box centering; it is dropped once labels are native text.
  - Minor sub-glyph shifts from metric-based vs. ink-based centering are accepted (most visible with Caveat).
- **Font identity**: fonts ship as separate static TTFs per weight, so each weight is its own `font-family`. The family name is the existing file base name from `sourceFontsData` (`EBGaramondBold`, `EBGaramondRegular`, `MontserratBold`, `MontserratMedium`, `CaveatBold`, `CaveatRegular`). Weight is selected by `font-family`, never by `font-weight`.
- **Font data model**: `FontData` (what `Calendar` passes to `ViewController`/`DownloadManager`) becomes `{ bold, regular }` where each entry is an _embeddable font_: its family name, raw bytes, and derived base64. It no longer contains `opentype.js` `Font` objects.
- **Single embedding seam**: `FontsController` is the one place that turns fetched font bytes into (a) a `@font-face` CSS block (base64 `data:` URL, `format('truetype')`) for SVG/JPG/live preview, and (b) VFS-ready data for `jsPDF.addFont()`. `ViewController` and `DownloadManager` consume; they never build these themselves.
- **Where the CSS lives**: each generated mockup `<svg>` carries its own `<style>` element with the selected font's two `@font-face` rules. This makes the live preview, the cloned JPG SVG, and the PDF input self-describing — no global app CSS.
- **Fill / weight preservation**: current-month digits, labels, titles → `fill="#231f20"`, bold family. Prev/next-month digits → `fill="#999"`, regular family.
- **Failure policy**: missing embeddable font data for the selected font is an error surfaced through the existing `showLoader`/`hideLoader` + `console.log` catch paths, never a silent fallback to a default typeface.
- **Persistence**: `IDBController`/`DataController` project storage is untouched (stores font _name_, not geometry).
- **Tests**: `vitest` + `jsdom`; assert on resulting SVG markup (tag, attributes, text content, `<style>` content), not internal calls. Mock constructor options with `vi.fn()` as in `src/test/uploadManager.test.ts`.

---

## Phase 1: Day digits as native text in the live preview

**User stories**: 1, 4, 5, 6, 12, 13

### What to build

`FontsController` stops parsing TTFs with `opentype.js` and instead keeps the raw bytes, exposing for the selected font (bold + regular) a family name and a `@font-face` CSS block. `ViewController` injects that block into a `<style>` inside every mockup `<svg>` (single-page and all 12 multi-page mockups) and renders every day-cell digit — current month and faded prev/next month — as a centered `<text>` element with the correct fill and per-weight `font-family`. Weekday labels and titles remain outline-rendered in this phase, so `opentype.js` is still loaded alongside the raw bytes; the SVG is temporarily mixed.

End-to-end: open the app, pick any font/language, the grid digits render in the chosen typeface, centered in their cells, with faded adjacent-month digits lighter and regular weight.

### Acceptance criteria

- [ ] `FontsController` test: given a loaded font and a weight, returns the expected family name and a `@font-face` block containing that family name and a base64 `data:` URL.
- [ ] `ViewController` test: each mockup `<svg>` contains a `<style>` whose content includes both `@font-face` rules for the selected font.
- [ ] `ViewController` test: day cells contain `<text>` (no `<path>`) with `text-anchor="middle"`, `dominant-baseline="central"`, `x`/`y` at the cell center, correct digit content.
- [ ] `ViewController` test: current-month digits have `fill="#231f20"` and the bold family; prev/next-month digits have `fill="#999"` and the regular family.
- [ ] Works for both single-page and multi-page calendar types.
- [ ] Manual: digits visibly render in the selected font in the live preview for all three fonts.

---

## Phase 2: JPG export embeds the font

**User stories**: 8, 9, 15

### What to build

`DownloadManager` receives the embeddable font data through its options. Before the cloned SVG is serialized for canvas rasterization, it ensures the clone's `<style>` contains the selected font's `@font-face` block (re-injecting it if the clone lacks one), so the detached blob-loaded `<img>` resolves the family names. If the font data is absent, the download fails loudly through the existing error path rather than producing a fallback-font image.

End-to-end: download JPG; day digits appear in the chosen typeface, matching the preview.

### Acceptance criteria

- [x] `DownloadManager` test: the SVG handed to the rasterizer contains a `<style>` with the selected font's `@font-face` rules (rasterizer mocked).
- [x] `DownloadManager` test: missing font data results in the error path (loader hidden, no download triggered).
- [ ] Manual: JPG export shows correct typeface for all three fonts, in at least two browsers.

---

## Phase 3: PDF export embeds the font (single page and all pages)

**User stories**: 8, 10, 11, 15

### What to build

`FontsController` additionally exposes VFS-ready data (base64 string + virtual file name + family name) per weight. `DownloadManager` registers both weights of the selected font on the `jsPDF` instance (`addFileToVFS` + `addFont`) once per document, before any `pdf.svg()` call, so `svg2pdf.js` resolves the `<text>` `font-family` references to embedded fonts on every page. Both the current-page and all-pages ranges go through the same registration.

End-to-end: download current-page PDF and all-pages PDF; digits on every page are in the chosen typeface.

### Acceptance criteria

- [x] `FontsController` test: VFS-ready data for a weight has the expected family name, file name, and base64 payload.
- [x] `DownloadManager` test: `addFileToVFS`/`addFont` are called for both weights before the first `svg()` call, for both `Current` and `All` ranges (jsPDF mocked).
- [x] `DownloadManager` test: missing font data results in the error path.
- [ ] Manual: single-page and 12-page PDFs show the correct typeface on every page; fonts are embedded (visible in the PDF viewer's font list).

---

## Phase 4: Weekday labels, month titles, year titles as native text

**User stories**: 2, 3, 6, 7, 12

### What to build

The remaining outline-rendered strings become `<text>` in both single-page and multi-page mockups. Weekday labels are centered (`middle`/`central`) at their current per-column `x` and existing `y`; the RU `Ср` `descenderException` branch is removed. Month and year titles use `text-anchor="start"` at their existing `x`/`y` so the baseline and left edge stay where the outline placed them. All use the bold family and `#231f20` fill. Because Phases 2–3 embed fonts for the whole SVG, these strings export correctly in JPG and PDF with no further export changes.

End-to-end: preview, JPG and PDF show all text in the chosen font, in RU and EN, with layout visually unchanged.

### Acceptance criteria

- [x] `ViewController` test: weekday labels are `<text>` with `middle`/`central` centering, correct content for RU short/long and EN short/long lists, bold family.
- [x] `ViewController` test: month title and year title are `<text>` with `text-anchor="start"`, correct content, positioned at the configured title `x`/`y`.
- [x] `ViewController` test: no `<path>` text elements remain anywhere in a generated mockup.
- [x] No reference to `descenderException` remains in rendering code.
- [ ] Manual: RU labels with descenders/ascenders (`р`, `у`, `д`) and all three fonts look correctly placed; titles have not shifted compared to the previous build.

---

## Phase 5: Remove the outline pipeline and verify

**User stories**: 13, 14, 16

### What to build

Delete `OutlineCache`, `getAndPlaceOutline`, all `opentype.js` imports, the `opentype.js` and `@types/opentype.js` dependencies, and the `Font`-based `FontData`/`FontArray` types. `FontsController` becomes bytes-only. Run the full manual verification matrix and record the result.

### Acceptance criteria

- [ ] `opentype.js` is absent from `package.json`, the lockfile, and all source imports; `pnpm build`, `pnpm lint`, `pnpm test:run` pass.
- [ ] No `xShift`/`yShift` or bounding-box centering code remains.
- [ ] Manual verification matrix completed: 3 fonts × 2 languages × {live preview, JPG, single PDF, all-pages PDF} × 2 browsers, with no fallback typeface observed.
- [ ] (Recommended) one physical test print of a PDF page.
