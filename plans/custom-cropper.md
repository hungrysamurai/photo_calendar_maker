# Plan: Replace cropperjs with @hungrysamurai/cropper

> Source SPEC: `spec/custom-cropper.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Dependency**: `@hungrysamurai/cropper` is consumed as `link:../../../../standalone/cropper` (the sibling standalone checkout). `cropperjs` is removed. The production build bundles the library; no npm publish. Prerequisite: the library's `dist` (gitignored in the library repo) must be built on the building machine.
- **Repos and branches**: library commits go in the library repo; calendar work goes on the `custom-cropper` branch. Library work lands first.
- **Library API addition**: `RenderCropOptions.clipToImage?: boolean`. When true, the crop rect is intersected with `0, 0, naturalWidth, naturalHeight` before output sizing and rasterising, and the result's `rect` is the clipped rect. When false or absent, behaviour is unchanged.
- **Wrapper contract**: `ImageCropper` keeps its constructor `(cropControlsContainer, ImageCropperCallbacks)`, the `ImageCropperCallbacks` type, `start(imageElement)`, `isActive` and `dispose()`, plus the Apply/Cancel buttons (`#apply-crop`, `#cancel-crop`, existing icons) in the crop controls container. The only caller change is that `Calendar` checks `isActive` instead of the internal `cropper` field.
- **Overlay**: the `cropper-outer-container` div is appended to the body and positioned over the SVG `<image>`'s bounding rect. One `CropperView` is constructed on it for the wrapper's lifetime.
- **View config**: `fit: 'contain'`, `maxScale: 8`, `grid: false`, output `{ JPEG, min 256×256, max 4096×4096, clipToImage: true }`, no `fillColor`.
- **Lifecycle**: the view's `accept` and `cancel` events drive teardown (not `statechange → idle`, which fires before the async save completes). Teardown restores the SVG image's visibility, disables overlay pointer events and removes the window resize listener, then calls `onAfterRemove`.
- **Testing**: library geometry is tested in the library's Vitest `core`/`dom` projects. The calendar tests `ImageCropper` in jsdom against a module-mocked fake `CropperView` (real `on`/`emit`, controllable `state`, stubbed `start`/`accept`/`cancel`/`destroy`), and asserts only public behaviour, callbacks and DOM side effects.

---

## Phase 1: Library: LF normalisation and the `clipToImage` output option

**User stories**: 13 (library side), 45, 47

### What to build

Normalise the library repo to LF line endings in a standalone commit, so later diffs show only real changes. Then add the `clipToImage` option to `RenderCropOptions`, honoured by `renderCrop`/`renderCropToBlob` and by the view's `accept()` (and so by the Enter key path), with the clipped rect reported in the `accept()` result and the `accept` event payload. Add unit tests next to the existing geometry and render tests. Fix the README's install path example and document the new option. Build `dist` so the calendar can resolve the package.

### Acceptance criteria

- [x] A `.gitattributes` in the library repo enforces LF, and renormalisation is committed on its own; afterwards `git status` shows no line-ending-only changes
- [x] With `clipToImage: true`, a contain-mode crop that extends past the image on one axis or both produces output clipped to the image bounds, with no fill area
- [x] It is a no-op in cover mode and when the rect is already inside the image
- [x] Output min/max size bounds are applied after clipping
- [x] The `accept()` result and `accept` event payload report the clipped `rect`
- [x] Without the option, behaviour is unchanged (existing tests pass)
- [x] The README documents `clipToImage` and shows the correct install path
- [x] Library typecheck, lint and tests pass; `dist` is built

---

## Phase 2: Calendar tracer bullet: open, zoom, pan and cancel on the new library

**User stories**: 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 23, 25, 28, 30, 32, 33, 36, 39, 40, 41, 42, 44 (partial)

### What to build

Swap the dependency to the `link:` package and confirm the Vite dev server serves the symlinked package from outside the project root (adjust the fs allow list or dependency optimisation only if needed). Rewrite `ImageCropper` internals around a single `CropperView` with the agreed config. `start()` is a no-op while active. Otherwise it remembers the SVG image, positions the overlay, shows the loader, fetches the `blob:` href into a `Blob`, calls `CropperView.start`, hides the SVG image, enables pointer events, registers the resize listener, and always hides the loader. Cancel (the button calls `view.cancel()`; Esc does the same inside the view) goes through a single `cancel` handler that tears down and calls `onAfterRemove` without saving. `Calendar` switches to `isActive`.

Removing cropperjs forces the full cleanup in the same phase: the package, the HTML stylesheet link into `node_modules`, the cropperjs override block in the main stylesheet, the global `Cropper` type augmentation, and the old workaround code (temporary `<img>`, the redundant redraw, `ZOOM_EPSILON`, viewMode/dragMode/reset/zoom-ratio logic). Apply is wired to `view.accept()` but is only fully correct from Phase 3.

### Acceptance criteria

- [ ] `cropperjs` is gone from `package.json`, the lockfile, `index.html`, the styles and `types.ts`; `@hungrysamurai/cropper` resolves via `link:`
- [ ] The dev server loads the crop tool with no module-resolution or fs-access errors
- [ ] Opening the crop tool shows the photo letterboxed exactly as in the slot; the SVG photo is hidden; main controls hide and crop controls show
- [ ] Wheel, trackpad pinch and touch pinch zoom continuously from letterboxed to cover, anchored on the pointer; zoom-out stops at the letterboxed view; zoom-in goes up to about 8×
- [ ] Dragging pans whenever an axis has slack and stops at the photo edges
- [ ] The page does not scroll or zoom while wheeling or pinching over the crop area
- [ ] Cancel and Esc close the tool, leave the photo untouched and swap the controls back
- [ ] Pressing Crop while active does nothing
- [ ] It works for portrait and landscape photos in single-page and multi-page formats
- [ ] Tests cover: `start()` positions the overlay from the image rect, hides the image, enables pointer events, and shows then hides the loader; cancel via the button and via a direct `cancel` emit restores visibility and calls `onAfterRemove` once without saving; `start()` while active is a no-op; the view is constructed with the agreed config
- [ ] Typecheck, lint and tests pass

---

## Phase 3: Accept and save: Apply and Enter produce a bar-free JPEG that is saved and shown

**User stories**: 2, 12, 13, 14, 15, 16, 17, 22, 29, 37, 44 (partial)

### What to build

A single `accept` event handler serves both the Apply button (which calls `view.accept()`) and the keyboard Enter path inside the view. It sets the SVG image href to a new object URL of the result blob, revokes the previous href, awaits `saveImage(blob, currentMonthIndex)`, and only then tears down and calls `onAfterRemove`. `clipToImage` guarantees there are no baked-in bars.

### Acceptance criteria

- [ ] Apply at rest returns the whole photo (no cropping, no bars)
- [ ] Apply after zooming returns exactly the visible part, with no white bars even when one axis is still letterboxed
- [ ] The result is JPEG, upscaled to at least 256 px and capped at 4096 px
- [ ] The cropped image appears in the slot immediately and persists after reloading the project
- [ ] Controls swap back only after the save completes
- [ ] Enter produces the same image and save as the Apply button
- [ ] An already-cropped photo can be opened, zoomed and re-cropped
- [ ] Tests cover: an `accept` via the Apply button and via a direct emit swaps the href, revokes the old URL, calls `saveImage` with the blob and the current month index, and calls `onAfterRemove` exactly once, after the save resolves
- [ ] Typecheck, lint and tests pass

---

## Phase 4: Robustness: failed load, resize and dispose

**User stories**: 26, 27, 31, 38, 44 (rest)

### What to build

A failure in `start()` (fetch or view start) restores the SVG image's visibility, disables overlay pointer events, logs the error, hides the loader and leaves the tool inactive. While a crop is active, the window resize listener only repositions the overlay; the view's own `ResizeObserver` keeps the framing. `dispose()` destroys the view (ending any session and removing its DOM, listeners and style) and removes the overlay, so switching or closing a project leaves nothing behind.

### Acceptance criteria

- [ ] A failed load leaves the UI usable: loader hidden, photo visible, controls unchanged, `isActive` false
- [ ] Resizing the window or rotating a phone mid-crop keeps the same part of the photo framed, and the overlay stays aligned with the slot
- [ ] The resize listener is removed on accept, on cancel and on dispose
- [ ] Switching or closing a project mid-crop leaves no overlay, listeners or object URLs behind
- [ ] Tests cover: a failing `start()` hides the loader, restores visibility, disables pointer events and leaves `isActive` false; `dispose()` destroys the view and removes the overlay
- [ ] Typecheck, lint and tests pass

---

## Phase 5: Styling: themed frame, no handles, focus ring

**User stories**: 19, 24, 34, 35

### What to build

Theme the view through custom properties on the overlay: the line colour and focus colour use `--shadow-grey`, and the line width is 3px. Hide the corner markers (`.hs-cropper__handle`), because the frame cannot be resized. Remove the leftover temporary-image rule from the overlay styles and keep the overlay container rules. The crop area is focused when it opens and shows a visible focus ring.

### Acceptance criteria

- [ ] The frame is a 3px `--shadow-grey` outline around the whole slot, with no grid, no corner handles and no centre cross
- [ ] The crop area receives focus on open; Tab shows a `--shadow-grey` focus ring
- [ ] Arrow keys nudge the photo and `+`/`-` zoom
- [ ] No stale cropperjs or temporary-image styles remain
- [ ] Lint and format checks pass

---

## Phase 6: Production build, docs and acceptance

**User stories**: 43, 46

### What to build

Confirm that `vite build` bundles the linked library into `build/` as a self-contained output. Document the build prerequisite (the library's `dist` must be built first) in the project. Update the library README's "Migrating from cropperjs" section to match the final wrapper (`fit: 'contain'`, `maxScale: 8`, `clipToImage`, event-driven teardown). Run the manual acceptance checklist against the production build.

### Acceptance criteria

- [ ] `vite build` succeeds, and the output contains no reference to the `link:` path or to `node_modules`
- [ ] The build prerequisite is documented
- [ ] The library README's migration section reflects the final wrapper
- [ ] Manual checklist passes:
  - [ ] Portrait and landscape photos in every single-page and multi-page format
  - [ ] Wheel, trackpad pinch, touch pinch and drag
  - [ ] Apply at rest returns the whole photo; Apply mid-zoom returns the visible part with no bars
  - [ ] Re-cropping an already-cropped photo can still zoom
  - [ ] A resize or rotation mid-crop keeps the framing and the overlay alignment
  - [ ] Keyboard: Tab focus ring, arrows, `+`/`-`, and Enter/Esc match the buttons
  - [ ] Reloading the project keeps the cropped image
  - [ ] PDF export (current page and all pages) and JPG export work after a crop
  - [ ] A failed load leaves the UI usable
