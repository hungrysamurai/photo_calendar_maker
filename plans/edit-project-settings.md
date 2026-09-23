# Plan: Edit project settings

> Source SPEC: `spec/edit-project-settings.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **IndexedDB schema**: unchanged (v2). `projects` (keyPath `id`) and `images` (keyPath `[projectId, monthIndex]`, index `projectId`) are reused as-is.
- **Editable fields**: `name`, `startYear`, `firstMonthIndex`, `lang`, `font`. Locked: `format`, `type` (shown, disabled).
- **IDB operation**: `updateProject(id, patch, reindexShift?)` runs as one read-write transaction over `projects` + `images`. It preserves `createdAt` and sets `lastOpenedAt = now`.
- **Re-index formula**: stored `monthIndex` is a page position. `newIndex = ((oldIndex + oldFirstMonth − newFirstMonth) mod 12 + 12) mod 12`. Only multi-page projects whose first month changed are re-indexed. It works as read all → range-delete → write back, never per-key in place.
- **Data controller**: an "update project" operation. If nothing changed → no write. Otherwise → compute the shift → IDB update → load as active (settings + images), the same way open does.
- **Dropdown API additions**: `setDisabled(disabled)` (blocks opening, adds a `dropdown--disabled` modifier) and a public non-emitting select.
- **Overlay states**: "Новый" (form + "Создать"), project selected (form hidden + "Открыть" · "Изменить" · "Удалить"), editing (form pre-filled, format/type disabled + hint "Формат и тип нельзя изменить после создания", picker enabled (picking any item acts as "Отмена"), "Сохранить" · "Отмена").
- **"Новый" snapshot**: taken on entering edit mode (all dropdown values, type radio, name value, name dirty flag) and restored on every exit (save, cancel, overlay close).
- **Strings**: all user-facing strings are Russian.

---

## Phase 1: Edit mode shell — enter, pre-fill, cancel

**User stories**: 2, 3, 4, 10, 11, 21, 22, 23, 24, 25, 26

### What to build

When a saved project is selected in the picker, an "Изменить" button appears next to "Открыть" and "Удалить". Pressing it (for any saved project, active or not) takes a snapshot of the "Новый" form and enters edit mode. The settings form becomes visible and is pre-filled from the project record, using the non-emitting select. The format dropdown and type radios are disabled and show the hint. The picker is disabled. The action buttons become "Сохранить" and "Отмена".

"Отмена" and the overlay close button both leave edit mode without asking for confirmation. They restore the snapshot, re-enable everything and return to the project-selected state for the same project. "Сохранить" is present but not wired to persistence yet; it may simply behave like "Отмена" until Phase 2.

`Dropdown` gains `setDisabled` and the public non-emitting select, plus the disabled-state style.

### Acceptance criteria

- [ ] "Изменить" is visible only when a saved project is selected; it is hidden for "Новый"
- [ ] Entering edit mode shows the form pre-filled with the selected project's name, year, first month, language, font, format and type
- [ ] Format dropdown and type radios are disabled; the hint "Формат и тип нельзя изменить после создания" is shown only in edit mode
- [ ] The picker cannot be opened while editing
- [ ] Buttons read "Сохранить" · "Отмена"; "Открыть" / "Удалить" / "Создать" are hidden
- [ ] "Отмена" and the close button return to the project-selected state (Открыть / Изменить / Удалить) for the same project
- [ ] After leaving edit mode, switching to "Новый" shows exactly the values (including the name and its dirty flag) that were there before editing
- [ ] Dropdown tests: `setDisabled(true)` blocks opening and applies the modifier class; `setDisabled(false)` restores it; the programmatic select updates the value without calling `onChange`
- [ ] `pnpm lint`, `pnpm test:run` pass

---

## Phase 2: Save name, language, font and year

**User stories**: 1, 7, 8, 9, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35

### What to build

`updateProject(id, patch)` (no shift yet) is added to the IDB controller: one transaction, `createdAt` preserved, `lastOpenedAt` bumped. The data controller gains its "update project" operation. It detects a no-op and skips the write. Otherwise it writes and then loads the project as active.

"Сохранить" is wired up. The name is trimmed and falls back to the generated name when it is empty. When something changed, the project is saved, the calendar is disposed and remounted, the snapshot is restored, the overlay closes and the projects list is refreshed. When nothing changed and the project is already active, the overlay only closes. When nothing changed and the project is not active, it opens like "Открыть".

When a save fails, the error is logged. Edit mode stays active with the entered values, and the current calendar is left mounted and usable.

Photos are not re-indexed yet. To avoid putting photos on the wrong month, the first-month dropdown stays disabled in edit mode until Phase 4 removes that guard.

### Acceptance criteria

- [ ] Changing name, language, font or year and pressing "Сохранить" persists the change, closes the overlay and shows the re-rendered calendar
- [ ] Editing a non-active project opens it after save
- [ ] `createdAt` is unchanged and `lastOpenedAt` is updated; reloading the page reopens the edited project
- [ ] Images are untouched by these edits
- [ ] "Сохранить" with no changes performs no IDB write (and behaves like "Открыть")
- [ ] The projects list shows the new name and summary right after saving
- [ ] A forced save failure keeps the overlay open in edit mode with the entered values; the project record and images are unchanged; the previously open calendar still works
- [ ] IDB tests: `updateProject` updates the fields, preserves `createdAt`, sets `lastOpenedAt`, and leaves the images alone when no shift is given
- [ ] Data controller tests: a no-op save performs no write; after an update the project is active with its settings and images
- [ ] `pnpm lint`, `pnpm test:run` pass

---

## Phase 3: Year list and name auto-suggestion in edit mode

**User stories**: 5, 16, 17, 18, 19, 20

### What to build

On entering edit mode, the year dropdown's items become the standard year list plus the project's year when it is missing, sorted. The standard list is restored on every exit.

The name dirty flag is derived when entering edit mode: the name is dirty when it differs from the generated name for the project's original year and format. Year changes during editing re-suggest the name only while it is not dirty, the same as in create mode. The empty-name fallback on save (Phase 2) uses the currently selected year.

### Acceptance criteria

- [ ] Editing a project whose year is already past shows that year in the dropdown, selected; the other options match the create-mode list
- [ ] After leaving edit mode, the year dropdown offers only the standard list again
- [ ] A project with an auto-generated name gets its name updated when the year is changed
- [ ] A project with a custom name keeps it when the year is changed
- [ ] Clearing the name and saving stores the generated name for the new year
- [ ] Tests for the dirty-flag derivation: an auto-generated name counts as not dirty, a custom name counts as dirty
- [ ] `pnpm lint`, `pnpm test:run` pass

---

## Phase 4: First-month change with transactional photo re-indexing

**User stories**: 6, 12, 13, 14, 36, 37

### What to build

`updateProject` accepts an optional `reindexShift`. When it is given, the same transaction reads all of the project's images, range-deletes them and writes them back under `newIndex = (oldIndex + shift) mod 12`, normalised to a non-negative value. The data controller computes `shift = oldFirstMonth − newFirstMonth`, but only for multi-page projects whose first month changed. Single-page projects never get a shift. Any Phase 2 guard against first-month changes is removed.

### Acceptance criteria

- [ ] In a multi-page project, changing the first month keeps every photo on its calendar month (e.g. start January → March: the January photo becomes page 11)
- [ ] A single-page project keeps its photo at index 0 after a first-month change
- [ ] Changing only the year, language, font or name does not rewrite any image
- [ ] IDB tests: positive shift, negative shift, wrap-around at the year boundary, no shift → images untouched, and an aborted transaction leaves both the record and the images unchanged
- [ ] Data controller tests: the shift is computed only for multi-page projects with a changed first month; the updated project becomes active with the re-mapped images
- [ ] Other projects' images are never affected
- [ ] `pnpm lint`, `pnpm test:run` pass
