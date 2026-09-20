# Plan: Multi-project support

> Source SPEC: `spec/multi-project-support.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **IndexedDB schema (v1 → v2)**: database `Photo Calendar Project` bumped to version 2. Two new object stores replace the old ones:
  - `projects` — keyPath `id`, autoIncrement, index on `lastOpenedAt`.
  - `images` — keyPath `[projectId, monthIndex]`, index on `projectId`.
  - Old stores `current_project_data` / `current_project_images` are migrated into one project + its images inside the upgrade transaction, then deleted.
- **Key models**:
  - `CalendarData` gains `name: string`, `createdAt: number`, `lastOpenedAt: number`.
  - Stored project record = `CalendarData & { id: number }`.
  - Stored image record = `{ projectId: number; monthIndex: number; image: Blob }`. In-memory `StoredImage` (`{ id: monthIndex, image }`) stays as-is so `Calendar`/cropper are untouched.
- **Active project**: not persisted as a pointer. Startup opens the project with the greatest `lastOpenedAt`; create and open both bump it to `Date.now()`. `DataController` holds `activeProjectId`.
- **Image-save contract**: the `(blob: Blob, monthIndex: number)` callback consumed by `Calendar`/`ImageCropper` is unchanged; `DataController` prefixes with `activeProjectId` internally.
- **Generated name**: `Календарь {year} · {format label}`, reusing the format labels rendered in the format dropdown.
- **Overlay items**: the projects dropdown is a discriminated list — a sentinel "Новый" entry pinned first, then project entries. Reset to "Новый" every time the overlay opens.
- **Testing**: `fake-indexeddb` as a dev dependency, imported in `src/test/setup.ts`. All user-facing strings are Russian.

---

## Phase 1: Persistence foundation — v2 schema, migration, multi-project storage

**User stories**: 1, 17 (persistence half), 19, 20, 21, 29, 30, 34

### What to build

Replace the single-project persistence with a project list, end to end. The IDB controller opens v2, creates the `projects` / `images` stores, and migrates existing v1 data in the upgrade handler. Its API becomes: list projects (sorted by `lastOpenedAt` desc), get project by id, get images for project, create project (returns id), delete project (range-deletes its images), save image for `(projectId, monthIndex)`, touch project.

`DataController` gains `activeProjectId` and exposes create project, load project by id, restore last opened, and delete project; `saveImageToIDB` keeps its signature and writes under the active project. `main.ts` is rewired so "Создать" creates a new project (with a generated name and timestamps) instead of resetting, and page load restores the most recently opened project. No new UI in this phase — the overlay looks the same but stops destroying earlier projects.

`fake-indexeddb` is added and the persistence layer is covered by tests.

### Acceptance criteria

- [ ] Opening the DB on a browser with v1 data yields exactly one project in `projects` with a generated name, `createdAt`/`lastOpenedAt` set, and all v1 images re-keyed under its id; old stores no longer exist
- [ ] Pressing "Создать" twice results in two independent projects in IDB; the first one's images are untouched
- [ ] Cropping an image after a create writes an `images` record keyed `[activeProjectId, monthIndex]`
- [ ] Reloading the page reopens the project with the greatest `lastOpenedAt`, with its images rendered
- [ ] Creating a project sets its `lastOpenedAt` so it is the one restored on the next reload
- [ ] Tests (using `fake-indexeddb`): seeded v1 DB migrates correctly; create/list/get/delete round-trips; image save + range-delete on project delete; list ordering by `lastOpenedAt`; `restoreLastOpened` picks the right project; image save is scoped to the active project
- [ ] `pnpm lint`, `pnpm test:run` pass

---

## Phase 2: Project name input

**User stories**: 2, 3, 4, 5, 6, 28

### What to build

Add a "Название" text input at the top of the overlay options block and rename the heading to "Проект". The input is pre-filled with the generated name and regenerates whenever the year or format dropdown changes, until the user types (dirty flag). An empty/whitespace name on create falls back to the generated default. After a successful create the field resets to the (fresh) generated name and the dirty flag clears. The created project record carries the chosen name.

### Acceptance criteria

- [ ] Overlay heading reads "Проект"; name input with caption "Название" appears above the settings dropdowns
- [ ] On first open the input shows `Календарь {year} · {format label}` for the current dropdown values
- [ ] Changing year or format updates the suggested name while untouched
- [ ] After the user types, year/format changes no longer overwrite the field
- [ ] Creating with an empty name stores the generated default; creating with a custom name stores it verbatim
- [ ] After create the field shows the generated name again and is no longer dirty
- [ ] Two projects may share a name without any validation error

---

## Phase 3: Projects dropdown, open existing project, load-failure resilience

**User stories**: 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 27 (create side), 31, 32, 33

### What to build

`Dropdown` gains `setItems(items, value?)` to re-render its menu and re-select without recreating the component (with tests). A projects dropdown container is added above the mode radios and rendered with a pinned "Новый" sentinel followed by project entries, each as two lines: name plus a muted summary (year · first month · format). The dropdown is hidden when there are no projects and shown as soon as the first one is created; it is refreshed after every create and reset to "Новый" every time the overlay opens.

Selecting "Новый" shows the settings block + name input and the primary button reads "Создать". Selecting a project hides the settings block and the button reads "Открыть". Open: if the selected id equals `activeProjectId`, just close the overlay; otherwise load the project (record + images, bump `lastOpenedAt`), dispose the current calendar, mount the new one, close the overlay. Create also closes the overlay and mounts the calendar.

If loading a project fails (corrupt record, missing images, etc.) the error is logged, the app is left in the no-project state (no calendar, controls hidden), and the project remains in the dropdown so it can be deleted in Phase 4.

### Acceptance criteria

- [ ] `Dropdown.setItems(items, value?)` re-renders the menu, re-selects the given (or first) value, and is unit-tested
- [ ] Projects dropdown is absent/hidden with zero projects and visible immediately after the first create
- [ ] "Новый" is pinned first and pre-selected whenever the overlay opens
- [ ] Projects are listed most-recently-opened first; each item shows name plus a muted summary line
- [ ] Selecting a project hides the settings form and name input, primary button reads "Открыть"; selecting "Новый" restores them and the button reads "Создать"
- [ ] Opening a project renders its settings and all of its cropped images; subsequent crops are saved under that project
- [ ] Opening the already-active project only closes the overlay (no re-render)
- [ ] Overlay closes after both create and open
- [ ] A project whose load throws stays listed, the error is logged, and the app shows no calendar with controls hidden instead of crashing
- [ ] Style addition for the secondary line in dropdown items

---

## Phase 4: Delete project

**User stories**: 22, 23, 24, 25, 26, 27 (delete side)

### What to build

Add a "Удалить" button next to the primary button, visible only when an existing project is selected. Clicking it asks for native `confirm()`; on confirm the project and all of its images are removed from IDB, the dropdown list refreshes and resets to "Новый" (hiding itself if the list is now empty), and the overlay stays open. If the deleted project was the active one, the calendar is disposed, the container cleared, the controls hidden, and `activeProjectId` cleared in the data controller.

### Acceptance criteria

- [ ] "Удалить" is hidden for "Новый" and visible when a project is selected
- [ ] Cancelling the confirm leaves everything unchanged
- [ ] Confirming removes the project record and every `images` record for its id (verified by test from Phase 1's range-delete plus an integration check)
- [ ] After delete the dropdown shows the updated list, "Новый" is selected, the form is visible, and the overlay remains open
- [ ] Deleting the active project clears the calendar container, hides the controls, and leaves the app in the no-project state
- [ ] Deleting a non-active project leaves the current calendar untouched
- [ ] Deleting the last project hides the projects dropdown
