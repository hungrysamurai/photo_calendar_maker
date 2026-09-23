# Edit project settings

## Problem Statement

Once a calendar project is created, its settings are frozen. If the user picked the wrong year, wants the calendar to start from a different month, or wants to try another font or language, the only option is to create a new project and re-upload and re-crop every photo. Photos are the expensive part of a project, so a small settings mistake costs the user all of their work on images.

## Solution

Saved projects become editable. When a saved project is selected in the project picker, a new "Изменить" button appears next to "Открыть" and "Удалить". It shows the familiar settings form pre-filled with that project's settings. The name, start year, first month, language and font can be changed. The format and the calendar type are shown but locked. "Сохранить" persists the changes and opens the project; "Отмена" discards them. When the first month changes, each photo moves with its calendar month, so a January photo stays on January.

## User Stories

1. As a user, I want to change the settings of an existing project, so that I don't have to recreate it and re-upload all photos after a settings mistake.
2. As a user, I want an "Изменить" button whenever a saved project is selected in the picker, so that editing is discoverable next to "Открыть" and "Удалить".
3. As a user, I want to be able to edit any saved project, not only the one currently open, so that I can fix a project before opening it.
4. As a user, I want the settings form to be pre-filled with the project's current settings when I press "Изменить", so that I only change what I need.
5. As a user, I want to change the project's start year, so that I can reuse a calendar for another year.
6. As a user, I want to change the project's first month, so that I can shift the calendar period (e.g. school year instead of calendar year).
7. As a user, I want to change the calendar language, so that I can produce the same calendar in Russian or English.
8. As a user, I want to change the calendar font, so that I can try another look without losing my photos.
9. As a user, I want to rename a project, so that I can keep my project list meaningful.
10. As a user, I want to see the format and calendar type in the edit form but not be able to change them, so that I understand the full project configuration.
11. As a user, I want a hint explaining that format and type cannot be changed after creation, so that I don't think the form is broken.
12. As a user, I want my photos to follow their calendar month when I change the first month, so that seasonal photos stay on the right month.
13. As a user, I want the photo move to work across the year boundary (e.g. start moves from January to March and January becomes the 11th page), so that no photo is lost or misplaced.
14. As a user of a single-page calendar, I want my single photo to stay in place when I change the first month, so that editing never breaks my layout.
15. As a user, I want my photos to stay untouched when I change only the year, language, font or name, so that editing is safe.
16. As a user, I want an auto-generated project name to update when I change the year, so that the name does not become misleading.
17. As a user, I want a name I typed myself to stay as it is when I change the year, so that my custom naming is respected.
18. As a user, I want an emptied name field to fall back to the generated name on save, so that a project never ends up unnamed.
19. As a user, I want the year dropdown to include my project's current year even if it is already in the past, so that I can keep it unchanged.
20. As a user, I want the year dropdown in edit mode to otherwise offer the same years as when creating, so that editing does not invite arbitrary past years.
21. As a user, I want "Сохранить" and "Отмена" buttons while editing, so that it is clear how to finish or abandon the edit.
22. As a user, I want the project picker to be locked while I'm editing, so that I can't accidentally switch projects mid-edit.
23. As a user, I want "Отмена" to discard my changes without a confirmation, so that backing out is quick.
24. As a user, I want closing the overlay while editing to act like "Отмена", so that I never save changes unintentionally.
25. As a user, I want the picker to return to the project-selected state (Открыть / Изменить / Удалить) after I cancel, so that I can continue from where I was.
26. As a user, I want the "Новый" form to keep the values I had entered before I started editing a project, so that editing doesn't destroy my draft of a new project.
27. As a user, I want the edited project to open and the overlay to close after "Сохранить", so that I immediately see the result.
28. As a user, I want the currently open calendar to be re-rendered after I save its settings, so that the new year, month, language or font is visible.
29. As a user, I want a saved edit to count as "last opened", so that reloading the page brings me back to this project.
30. As a user, I want the project's creation date to stay unchanged after editing, so that project metadata remains truthful.
31. As a user, I want "Сохранить" with no changes to behave like "Открыть", so that nothing is needlessly rewritten.
32. As a user, I want the project list to reflect the new name and summary right after saving, so that the list is never stale.
33. As a user, I want a failed save to leave the overlay open in edit mode with my values intact, so that I can retry or cancel.
34. As a user, I want a failed save to leave my project exactly as it was, so that a storage error never mixes old and new settings or loses photos.
35. As a user, I want the calendar I had open to remain usable after a failed save, so that an error does not put the app into the "no project" state.
36. As a developer, I want the photo re-indexing and the settings update to happen in one IndexedDB transaction, so that they either both succeed or both fail.
37. As a developer, I want the re-indexing and update logic covered by tests, including year-boundary wrap-around and the single-page case, so that a regression cannot silently scramble users' photos.

## Implementation Decisions

### Editable fields

- Editable: `name`, `startYear`, `firstMonthIndex`, `lang`, `font`.
- Locked: `format`, `type`. They are displayed with the project's values and disabled.

### Photo re-indexing

- Stored image indices are page positions (0..11), not calendar months. In multi-page projects, a change of first month re-maps every image of the project: `newIndex = (oldIndex + oldFirstMonth − newFirstMonth) mod 12` (normalised to a non-negative result).
- Single-page projects store only index 0 and are never re-indexed.
- Year, language, font and name changes do not touch images.
- Re-indexing reads all images of the project, range-deletes them, and writes them back under new keys. In-place per-key rewrites are avoided because intermediate keys collide.

### IDB controller

- New `updateProject(id, patch, reindexShift?)` operation. It updates the project record and, when a shift is given, re-indexes that project's images, all in a single read-write transaction spanning the `projects` and `images` stores.
- `createdAt` is preserved. `lastOpenedAt` is set to now.

### Data controller

- New "update project" operation. It computes whether anything changed and, if nothing did, skips the write. Otherwise it computes the re-index shift (only for the multi-page type with a changed first month), calls the IDB update, and then loads the project as active (settings + images), the same way opening does.

### Dropdown component

- Gains `setDisabled(disabled)`, which blocks opening the menu and applies a disabled modifier class for styling.
- Gains a way to select a value programmatically without emitting `onChange` (a public, non-emitting select), used to pre-fill the form and to restore the "Новый" snapshot.
- Style addition for the disabled state.

### Overlay UI and flow

- The overlay gains an explicit edit mode on top of the existing "Новый" and "project selected" states:
  - "Новый": form visible, "Создать".
  - Project selected: form hidden, "Открыть" · "Изменить" · "Удалить".
  - Editing: form visible and pre-filled; format dropdown and type radios disabled, with a hint "Формат и тип нельзя изменить после создания"; picker disabled; "Сохранить" · "Отмена".
- On entering edit mode, a snapshot of the "Новый" form state is taken: all dropdown values, the type radio, the name input value and the name dirty flag. It is restored on every exit (save, cancel, overlay close).
- The year dropdown's items in edit mode are the standard year list plus the project's year when it is missing, sorted. The standard list is restored on exit.
- Name dirty flag on entering edit: dirty if the project name differs from the generated name for the project's original year and format. It is recalculated on year changes, exactly as in create mode.
- Save: trim the name and fall back to the generated name if it is empty. On success, re-render the calendar (dispose + mount) and close the overlay. If nothing changed and the project is already active, only close the overlay; if it is not active, open it. Then refresh the projects list.
- Save failure: the error is logged and edit mode stays active with the entered values. The current calendar is not disposed.
- Cancel / close button: leave edit mode, restore the snapshot, and return to the project-selected state for the same project.

### Tests

- IDB controller: `updateProject` updates fields and preserves `createdAt`; re-index with positive and negative shifts, including wrap-around; no re-index when no shift is given; a failed transaction leaves both the record and the images unchanged.
- Data controller: no-op save performs no write; the shift is computed only for multi-page projects with a changed first month; the updated project becomes active with the re-mapped images.
- Dropdown: `setDisabled` blocks opening; programmatic select does not emit `onChange`.
- Name dirty-flag derivation for auto-generated vs custom names.

## Out of Scope

- Changing the format (paper size / orientation) of an existing project.
- Changing the calendar type (single-page ↔ multi-page).
- Keeping original (uncropped) photos to allow re-cropping for another format.
- Choosing an arbitrary past year beyond the project's own year.
- Undo of a saved edit / edit history.
- Editing from outside the overlay (e.g. a settings button in the calendar controls).
- Duplicating a project with changed settings ("save as copy").

## Further Notes

- This spec reverses the "Editing the settings of an existing project" and "Renaming a project after creation" out-of-scope items of the multi-project support spec. Only the date, language, font and name fields are affected.
- Photo re-indexing is the riskiest part: it is the only path in this feature that rewrites a user's images. It must be transactional and covered by tests.
- Stored images are already shrunk/cropped to the placeholder of their project's format. This is why format changes are excluded.
- All user-facing strings are Russian, matching the existing UI.
