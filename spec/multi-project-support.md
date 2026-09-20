# Multi-project support

## Problem Statement

The app can hold only one calendar project at a time. Everything the user does (choosing settings, cropping photos for each month) is persisted to IndexedDB automatically, but the moment they press "Создать" for a new calendar, the previous project and all of its cropped images are silently overwritten. A user who wants to work on two calendars (e.g. one for the family, one for the office, or an A4 and an A3 version of the same year) has to finish and download one completely before starting the next, and can never come back to an earlier one.

## Solution

Turn the single implicit project into a list of named, saved projects. The existing "new project" overlay becomes a project picker: a dropdown lists all saved projects plus a pinned "Новый" entry. Choosing "Новый" shows the familiar settings form (with a new, pre-filled name field) and a "Создать" button. Choosing an existing project hides the form and offers "Открыть" and "Удалить". On page load the app reopens whichever project the user had open last. Existing users' single project is migrated transparently into the new list.

## User Stories

1. As a user, I want to create a new calendar project without losing the one I already have, so that I can work on several calendars in parallel.
2. As a user, I want to give a project a name when I create it, so that I can tell my projects apart later.
3. As a user, I want the name field pre-filled with a sensible default based on the year and format, so that I can just press "Создать" when I don't care about naming.
4. As a user, I want the default name to update as I change the year or format dropdowns, so that the suggestion stays accurate.
5. As a user, I want the default name to stop updating once I've typed my own, so that my edits are not overwritten.
6. As a user, I want an empty name to fall back to the generated default, so that I never end up with an unnamed project.
7. As a user, I want to see a dropdown listing all my saved projects on the overlay, so that I can find the one I need.
8. As a user, I want the projects dropdown to be hidden when I have no saved projects, so that the first-run experience stays simple.
9. As a user, I want the dropdown to appear as soon as I create my first project, so that I can immediately see it is saved.
10. As a user, I want "Новый" to be the pre-selected option whenever I open the overlay, so that creating a calendar stays the fastest path.
11. As a user, I want projects listed most-recently-opened first, so that the ones I'm actively working on are at the top.
12. As a user, I want each list item to show the project name plus a short summary of its settings (year, month, format), so that two similarly named projects are distinguishable.
13. As a user, I want to be allowed to give two projects the same name, so that I am not blocked by validation when I don't care.
14. As a user, I want the settings form to hide when I select an existing project, so that I am not misled into thinking I can change its settings.
15. As a user, I want the button to read "Открыть" when an existing project is selected, so that it is clear what will happen.
16. As a user, I want the form and "Создать" button to return when I switch back to "Новый", so that I can create a project after browsing the list.
17. As a user, I want opening a project to load its settings and all of its cropped images, so that I continue exactly where I left off.
18. As a user, I want opening the project that is already active to simply close the overlay, so that my calendar is not needlessly re-rendered.
19. As a user, I want images I crop after switching projects to be saved to the project I'm looking at, so that projects never contaminate each other.
20. As a user, I want the app to reopen the project I last had open when I reload the page, so that a refresh doesn't send me back to the picker.
21. As a user, I want a project I create or open to be treated as "last opened", so that the reload behaviour matches what I expect.
22. As a user, I want a "Удалить" button when an existing project is selected, so that I can clean up projects I no longer need.
23. As a user, I want a confirmation before a project is deleted, so that I don't lose work by misclick.
24. As a user, I want deleting a project to remove all of its stored images, so that my browser storage doesn't fill up with orphaned photos.
25. As a user, I want deleting the currently active project to clear the calendar behind the overlay and hide the controls, so that I'm not looking at a calendar that no longer exists.
26. As a user, I want the dropdown to reset to "Новый" after I delete the active project, so that I can immediately start a new one.
27. As a user, I want the dropdown list to refresh immediately after I create or delete a project, so that it never shows stale entries.
28. As a user, I want the overlay title to be neutral ("Проект"), so that it makes sense in both create and open modes.
29. As an existing user, I want the single project I already have to appear in the list after the update, so that I don't lose my calendar and images.
30. As an existing user, I want the migrated project to get a sensible generated name, so that it is recognisable in the list.
31. As a user, I want a project that fails to load (e.g. corrupt data) to still appear in the list, so that I can delete it.
32. As a user, I want a failed load to leave the app in the "no project" state rather than crash, so that I can still create or open another project.
33. As a user, I want the overlay to close after I create or open a project, so that I get to the calendar right away.
34. As a developer, I want the persistence layer covered by tests including the schema migration, so that a future change cannot silently destroy users' projects.

## Implementation Decisions

### Data model

- The calendar data type gains three fields: `name` (string), `createdAt` (timestamp), and `lastOpenedAt` (timestamp). Stored project records additionally carry an auto-incremented numeric `id`.
- The auto-generated name format is `Календарь {year} · {format label}` (e.g. `Календарь 2026 · A4 вертикальный`), reusing the same format labels shown in the format dropdown.
- The "active" project is not stored as a separate pointer; on startup the app opens the project with the greatest `lastOpenedAt`. Create and open both set `lastOpenedAt` to now.

### IndexedDB schema (v1 → v2)

- The database version is bumped to 2.
- Two new object stores replace the old ones:
  - `projects` — keyPath `id`, autoIncrement, with an index on `lastOpenedAt`.
  - `images` — keyPath `[projectId, monthIndex]`, with an index on `projectId`. Composite key keeps the existing "put image by month index" semantics with a project prefix, and allows loading or deleting all of a project's images with a single key range.
- The upgrade handler migrates the v1 data: the single `current_project_data` record and all `current_project_images` records become one project (with generated name and timestamps set to now) and its images; the old stores are then deleted. Migration runs entirely inside the upgrade transaction.

### IDB controller

- Replaces the single-project API with: list projects (sorted by `lastOpenedAt` desc), get project by id, get images for project, create project (returns new id), delete project (also range-deletes its images), save image for `(projectId, monthIndex)`, and touch project (bump `lastOpenedAt`).
- Every image write is scoped by project id; there is no "current" store anymore.

### Data controller

- Holds `activeProjectId` alongside the in-memory calendar data and images.
- Exposes: list projects, load project by id (fetches record + images, bumps `lastOpenedAt`, sets in-memory state), create project (persists, sets it active), delete project (and clears in-memory state if it was the active one), and "restore last opened" for startup.
- The existing image-save callback used by the calendar/cropper keeps its `(blob, monthIndex)` signature and internally prefixes with `activeProjectId`.

### Dropdown component

- Gains a `setItems(items, value?)` method that re-renders the menu and re-selects, so the projects list can be refreshed after create/delete without recreating the component.
- Project items render as two lines: name, plus a muted summary line. A small style addition supports the secondary line.

### Overlay UI and flow

- New elements: a projects dropdown container (above the mode radios), a name text input with caption "Название" (top of the options block), and a "Удалить" button next to the primary button. Overlay heading becomes "Проект".
- Projects dropdown items are a discriminated list: a sentinel "Новый" entry pinned first, followed by project entries. Hidden when there are zero projects. Reset to "Новый" every time the overlay opens.
- Selecting "Новый": settings block and name input visible, primary button "Создать", delete button hidden.
- Selecting a project: settings block hidden, primary button "Открыть", delete button visible.
- Name input: pre-filled with the generated name; regenerates on year/format change until the user types (dirty flag); resets to the generated name after a successful create.
- Create: persists project, refreshes list, closes overlay, mounts calendar.
- Open: if the selected id equals `activeProjectId`, only close the overlay; otherwise load the project, dispose the current calendar, mount the new one, close overlay.
- Delete: native `confirm()`; on confirm delete from IDB, refresh list, select "Новый"; if it was the active project, dispose calendar, clear container, hide controls. Overlay stays open.
- Load errors are logged and leave the app in the no-project state (overlay still lists the project so it can be deleted).

### Tests

- Add `fake-indexeddb` as a dev dependency, imported in the test setup.
- IDB controller tests: seed a v1 database, open v2, assert the migrated project and images and the absence of old stores; create/list/get/delete round-trips; image save and range-delete on project delete; ordering by `lastOpenedAt`.
- Data controller tests: restore-last-opened picks the correct project; image save is scoped to the active project.
- Dropdown tests for `setItems`.

## Out of Scope

- Renaming a project after creation.
- Duplicating / copying a project.
- Exporting or importing projects (files, cloud sync).
- Editing the settings (year, format, type, etc.) of an existing project.
- Per-item actions inside the dropdown menu (e.g. inline trash icons).
- Showing a read-only preview of a project's settings when it is selected.
- Storage quota handling or warnings.

## Further Notes

- The migration is the riskiest part: it is the only code path that can destroy an existing user's work, and it runs exactly once per browser. It must be covered by an automated test that seeds the v1 schema.
- Blob storage per crop is unchanged in cost; only the key shape changes. Do not embed image arrays inside the project record.
- All user-facing strings are Russian, matching the existing UI.
