# SPEC: Replace cropperjs with @hungrysamurai/cropper

## Problem Statement

The photo calendar's crop tool is built on cropperjs, a general-purpose library configured against its grain to behave like a "fixed photo slot" cropper. The `ImageCropper` wrapper carries a pile of workarounds to get there: toggling `viewMode` and `dragMode` on every zoom event, forcing the crop box back to the container size, a `reset()` hack when zooming out, monkey-patched `initialZoomRatio`/`zoomRatio` fields (with a global type augmentation to match), a float-tolerance epsilon, a temporary `<img>` with its own object URL, a redundant canvas redraw, and a stylesheet linked straight out of `node_modules` plus a block of CSS overrides to tame cropperjs' chrome.

The result works, but it is fragile and hard to reason about. It also has quirks the developer never intended. The crop box can be resized and dragged freely at rest, and the first zoom silently throws that away. The zoom jumps abruptly from letterboxed to cover. Dragging only works after the first zoom.

The developer has built a purpose-made cropper library, `@hungrysamurai/cropper`, with exactly this project in mind: a headless engine plus a vanilla-DOM view, zero dependencies, and built-in zoom limits and clamping. They want to swap the underlying library while keeping the `ImageCropper` entity and the user-facing crop behaviour intact.

## Solution

`ImageCropper` keeps its public surface: the same constructor, the same callbacks, the same Apply/Cancel buttons in the crop controls container, and the same overlay positioned over the SVG `<image>`. Internally it drives a `CropperView` from `@hungrysamurai/cropper` instead of cropperjs.

For the user, the tool still starts from the photo exactly as the calendar shows it, letterboxed inside its slot. They can zoom (wheel, trackpad pinch, touch pinch) and pan. Pressing Apply with no zoom keeps the whole photo. Pressing Apply after zooming keeps exactly the visible part of the photo, with no white bars baked in. The result is saved to IndexedDB and shows in the slot immediately, as before. Zoom is now continuous from letterboxed to cover with no snap. Panning works whenever there is room to pan. Resizing the window keeps the framing. Keyboard control works: arrows nudge, `+`/`-` zoom, Enter applies, Esc cancels.

One small addition to the library makes this possible: an output option that clips the crop rect to the image bounds before rasterising. With it, `contain` mode yields bar-free results through the library's own accept path, including the Enter key.

## User Stories

1. As a calendar maker, I want the crop tool to open showing my photo exactly as it appears in the slot (letterboxed, not cropped), so that starting a crop never changes my photo by itself.
2. As a calendar maker, I want pressing Apply without zooming to keep my whole photo, so that opening the crop tool by accident never loses part of my image.
3. As a calendar maker, I want to zoom in with the mouse wheel, so that I can frame the part of the photo I care about.
4. As a laptop user, I want trackpad pinch to zoom the photo, so that zooming feels natural on my device.
5. As a phone or tablet user, I want two-finger pinch to zoom the photo, so that I can crop on a touch device.
6. As a calendar maker, I want zoom to anchor on the point under my cursor or fingers, so that the detail I'm zooming towards stays in place.
7. As a calendar maker, I want zoom to be smooth and continuous from the letterboxed view to a filled slot, so that the photo never jumps unexpectedly.
8. As a calendar maker, I want to drag the photo to pan it as soon as there is room to move on an axis, so that I don't have to zoom first just to reposition.
9. As a calendar maker, I want panning to stop at the photo's edges, so that I can't drag the photo out of the slot and leave empty gaps.
10. As a calendar maker, I want zooming out to stop at the fully-visible letterboxed view, so that I can always get back to the original framing.
11. As a calendar maker, I want to zoom in far (up to roughly 7–10× on desktop), so that I can crop tightly even on a photo that has already been cropped.
12. As a calendar maker, I want pressing Apply after zooming to keep exactly the visible part of my photo, so that what I see is what I get.
13. As a calendar maker, I want a crop that still has letterbox space on one axis to produce an image without white bars, so that the slot shows my photo, not baked-in padding.
14. As a calendar maker, I want the cropped image to appear in the slot immediately after Apply, so that I get instant feedback.
15. As a calendar maker, I want my cropped image to be saved to my project, so that it's still there when I reopen the project.
16. As a calendar maker, I want cropped images saved as JPEG, so that PDF export keeps working (it embeds stored bytes as-is and expects a single format).
17. As a calendar maker, I want tiny crops to be upscaled to at least 256 px and huge ones capped at 4096 px, so that output quality and size stay within the same sane bounds as today.
18. As a calendar maker, I want Cancel to close the crop tool and leave my photo untouched, so that I can back out safely.
19. As a keyboard user, I want the crop area focused when it opens, so that I can use the keyboard right away.
20. As a keyboard user, I want arrow keys to nudge the photo, so that I can fine-tune the framing without a mouse.
21. As a keyboard user, I want `+` and `-` to zoom, so that I can zoom without a wheel or touchpad.
22. As a keyboard user, I want Enter to apply the crop exactly as the Apply button does (same image, same save), so that both paths give the same result.
23. As a keyboard user, I want Esc to cancel the crop exactly as the Cancel button does, so that I can back out quickly.
24. As a keyboard user, I want a visible focus ring on the crop area, so that I know where keyboard input goes.
25. As a calendar maker, I want the page not to scroll or zoom while I wheel or pinch over the crop area, so that the layout stays stable while I crop.
26. As a calendar maker, I want resizing the window or rotating my phone mid-crop to keep the same part of the photo framed, so that I don't lose my work.
27. As a calendar maker, I want the crop overlay to stay aligned with the photo slot after a window resize, so that the crop area never drifts off the calendar.
28. As a calendar maker, I want the main controls to hide and the crop controls to show while cropping (and to swap back afterwards), so that the UI flow is unchanged.
29. As a calendar maker, I want the controls to swap back only after my crop has been saved, so that the UI doesn't suggest I'm done before the save finishes.
30. As a calendar maker, I want the loader to show while the photo is loading into the crop tool, so that I know something is happening.
31. As a calendar maker, I want the crop tool to fail gracefully if the photo can't be loaded (loader hidden, photo visible, controls unchanged), so that a failure never leaves the UI stuck.
32. As a calendar maker, I want pressing Crop while the tool is already open to do nothing, so that double-clicks don't create duplicate sessions.
33. As a calendar maker, I want the original SVG photo hidden while cropping, so that I only see one copy of the photo.
34. As a calendar maker, I want a clean, understated frame (a 3px grey outline, no grid, no corner handles), so that the crop tool matches the app's look and doesn't suggest the frame can be resized.
35. As a calendar maker, I want the frame to outline the whole slot, so that I can see exactly what will fill it.
36. As a calendar maker, I want this to work the same for portrait and landscape photos in every calendar format (single-page and multi-page), so that no format is left behind.
37. As a calendar maker, I want to re-crop a photo I've already cropped, so that I can refine my framing over several passes.
38. As a calendar maker, I want switching or closing a project to tear down the crop tool cleanly, so that no stray overlays, listeners or object URLs linger.
39. As the developer, I want `ImageCropper` to keep its constructor, callbacks and public members, so that `Calendar` barely changes.
40. As the developer, I want the cropperjs dependency, its stylesheet link and its CSS overrides removed, so that the codebase has no dead code for the old library.
41. As the developer, I want the patched cropperjs type augmentation removed, so that the global types describe only real things.
42. As the developer, I want the new library consumed through a local link, so that library fixes show up immediately without publishing.
43. As the developer, I want the production build to bundle the library, so that the uploaded build is self-contained and needs no npm publish.
44. As the developer, I want `ImageCropper` covered by unit tests against a mocked view, so that the wrapper's contract is verified without real image decoding.
45. As the developer, I want the library's new clip-to-image option unit-tested in the library, so that geometry correctness is verified where it lives.
46. As the developer, I want a manual acceptance checklist, so that real pointer, touch and export behaviour gets checked before release.
47. As the developer, I want the library repo normalised to LF line endings, so that diffs show only real changes.

## Implementation Decisions

### Library changes (`@hungrysamurai/cropper`, done first)

- Add a `clipToImage` boolean to `RenderCropOptions`. When it is true, the crop rect is intersected with the image bounds (`0, 0, naturalWidth, naturalHeight`) before the output size is computed and before rasterising. The result's `rect` (as returned by `accept()` and in the `accept` event payload) is the clipped rect. When it is false or absent, behaviour is unchanged.
- The option works for the view's `accept()`, which includes the keyboard Enter path, and for the standalone `renderCrop`/`renderCropToBlob`.
- Unit tests cover:
  - no-op in cover mode or when the rect is already inside the image;
  - clipping on one axis and on both axes;
  - output-size bounds applied after clipping.
- Correct the README's install path example and document the new option.
- Add LF line-ending normalisation to the library repo.
- Build `dist` so that consumers can resolve it.

### Dependency and build

- Remove `cropperjs`. Add `@hungrysamurai/cropper` as a `link:` dependency pointing at the sibling standalone checkout (four levels up, then `standalone/cropper`).
- The production build bundles the library into the project's output. No npm publish is needed. The one requirement is that the library's `dist` exists on the building machine, because it is gitignored in the library repo. Document this build prerequisite.
- Verify that the Vite dev server serves the symlinked package, which lives outside the project root. Adjust Vite's fs allow list or dependency optimisation only if needed.

### `ImageCropper` entity

- Its public surface is preserved:
  - the constructor takes the crop controls container and `ImageCropperCallbacks` (unchanged type);
  - `start(imageElement)`, `isActive`, `dispose()`;
  - the Apply and Cancel buttons, rendered into the crop controls container with the existing icons and ids.
- The one caller change: `Calendar` checks `isActive` instead of reaching into the internal `cropper` field.
- The overlay element (`cropper-outer-container`, appended to the body) is kept and positioned over the SVG `<image>`'s bounding rect. A `CropperView` is constructed once on it with:
  - `fit: 'contain'`: the rest state matches the SVG's default `preserveAspectRatio` (meet) letterboxing;
  - `maxScale: 8`: the default of 1 would allow only about 1.2–1.8× zoom on desktop, because stored photos are shrunk to about 1100 px;
  - `grid: false`;
  - `output`: JPEG, min 256×256, max 4096×4096, `clipToImage: true`. There is no `fillColor`, because clipping means there are no areas outside the image.
- `start` flow:
  1. Do nothing if already active.
  2. Remember the SVG image and position the overlay.
  3. Show the loader.
  4. Fetch the image's `blob:` href into a `Blob` and pass it to `CropperView.start`.
  5. On success, hide the SVG image, enable overlay pointer events and register the window resize listener. The view revokes its own object URL.
  6. On failure, restore visibility, disable pointer events, log the error and leave the tool inactive.
  7. Always hide the loader at the end.
- Accept flow:
  - the Apply button calls the view's `accept()`, and the keyboard Enter path does the same inside the view;
  - a single `accept` event handler swaps the SVG image href to a new object URL of the result blob, revokes the previous href, and awaits `saveImage(blob, currentMonthIndex)`;
  - only then does it run teardown and `onAfterRemove`.
- Cancel flow: the Cancel button calls the view's `cancel()`, and Esc does the same inside the view. A single `cancel` event handler runs teardown and `onAfterRemove`, without saving.
- Teardown is not driven by `statechange → idle`, because that fires before the async save completes. Teardown:
  - restores SVG image visibility;
  - disables overlay pointer events;
  - removes the window resize listener.
- Resize: the existing window resize listener only repositions the overlay. The view's own `ResizeObserver` keeps the framing.
- `dispose()` destroys the view (which ends any session and removes its DOM, listeners and style) and removes the overlay.
- These are removed: the temporary `<img>` and its object URL, the redundant canvas redraw, the use of `canvasToBlob` in this path, `ZOOM_EPSILON`, and all `viewMode`/`dragMode`/`reset`/zoom-ratio logic.

### Types

- Remove the global `Cropper` interface augmentation (`initialZoomRatio`, `initialCanvasData`, `zoomRatio`, `options`).

### Styling

- Remove the cropperjs stylesheet link from the HTML entry and the cropperjs override block from the main stylesheet.
- Remove the temporary-image rule from the overlay's styles. Keep the overlay container rules.
- Theme the view through custom properties on the overlay:
  - line colour: the app's `--shadow-grey`;
  - line width: 3px;
  - focus colour: `--shadow-grey`.
- Hide the corner markers (`.hs-cropper__handle`), because the frame cannot be resized.

### Behaviour changes, accepted deliberately

- Zoom is continuous from letterboxed to cover. There is no snap to cover on the first zoom and no reset near the start.
- Dragging works whenever there is slack on an axis. It is no longer gated on the first zoom.
- The frame outlines the whole slot rather than hugging the letterboxed photo.
- Keyboard control is new.
- Resizes keep the framing.
- The freeform, movable and resizable crop box that cropperjs allowed at rest is dropped.
- The centre-cross decoration is dropped.

## Testing Decisions

- A good test checks external behaviour through the entity's public interface and its callbacks and DOM side effects, not internal fields or call order. Geometry correctness belongs to the library's own tests, not the calendar's.
- **Library:** unit tests for `clipToImage` alongside the existing geometry and `renderCrop` tests in the library's `core` and `dom` Vitest projects. These follow the existing style in the geometry and render test files.
- **Calendar:** a new `ImageCropper` test in the project's jsdom Vitest setup, following the style of the existing entity tests (upload manager, download manager, view controller). `@hungrysamurai/cropper` is module-mocked with a small fake `CropperView` that has a real `on`/`emit`, a controllable `state`, and stubbed `start`/`accept`/`cancel`/`destroy`. The test covers:
  1. `start()` positions the overlay from the image's bounding rect, hides the SVG image, enables pointer events, and shows then hides the loader.
  2. A failing `start()` hides the loader, restores the image's visibility, disables pointer events and leaves `isActive` false.
  3. An `accept` event, emitted directly to simulate Enter as well as via the Apply button:
     - swaps the href and revokes the old URL;
     - calls `saveImage` with the blob and the current month index;
     - calls `onAfterRemove` exactly once, after the save.
  4. A `cancel` event (the button or a direct emit simulating Esc) restores visibility and calls `onAfterRemove` once, without saving.
  5. `start()` while active does nothing, and `dispose()` destroys the view and removes the overlay.
  6. The view is constructed with `fit: 'contain'`, `maxScale: 8`, `grid: false`, and the JPEG/256/4096/`clipToImage` output.
- **Manual acceptance checklist:**
  - Portrait and landscape photos in each single-page and multi-page format.
  - Wheel, trackpad pinch, touch pinch and drag.
  - Apply at rest returns the whole photo.
  - Apply mid-zoom returns the visible part with no bars.
  - Re-cropping an already-cropped photo can still zoom.
  - A window resize or phone rotation mid-crop keeps the framing and the overlay alignment.
  - Keyboard: Tab focus ring, arrows, `+`/`-`, Enter and Esc match the buttons.
  - Reloading the project keeps the cropped image.
  - PDF export (current and all pages) and JPG export work after a crop.
  - A failed load leaves the UI usable.

## Out of Scope

- A movable or resizable crop frame (on the library's roadmap; would restore the dropped freeform-box behaviour properly).
- Rotation and flip.
- Restoring a previous crop rect when reopening the crop tool (library `initialRect` roadmap item). Crops remain destructive, as today.
- A relative zoom cap (for example "N× the fit scale") in the library.
- On-screen zoom buttons or a zoom slider in the calendar UI.
- Publishing `@hungrysamurai/cropper` to npm, and CI builds that would need it.
- The library's React binding.
- Changes to upload, storage, PDF/JPG export or the SVG mockup structure.

## Further Notes

- Order of work: the library phase (`clipToImage`, README fix, LF normalisation, build) comes first. The calendar phase depends on it. Library commits go in the library repo, and calendar work goes on the `custom-cropper` branch.
- The library README's "Migrating from cropperjs" wrapper is a useful skeleton, but it gets this project wrong in two ways: it uses `fit: 'cover'` (which would crop photos the moment the tool opens) and the default `maxScale: 1`. Update that section to reflect the final wrapper once it lands.
- The Esc key also closes open dropdowns through a global listener. This is harmless alongside cancelling a crop.
- Projects are built locally and uploaded as ready builds (per the site wrapper's deploy scripts), so the `link:` dependency never needs to resolve on the server.
