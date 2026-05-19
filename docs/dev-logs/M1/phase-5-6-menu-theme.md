# M1 Phases 5 & 6 — Native menu + theme + typography

**Status:** DONE (5 commits on `main`, not pushed)

Phases bundled together because Task 5.3's `App.tsx` rewrite imports
`toggleTheme` from `src/styles/theme.ts` (created in Phase 6). The
Phase 4 follow-up (try/catch around action calls, surface errors via
`@tauri-apps/plugin-dialog`'s `message()`) is folded into the same
5.3 commit.

## What landed

| SHA       | Subject                                                                  |
|-----------|--------------------------------------------------------------------------|
| `cbb2bd1` | feat(theme): css variable tokens + light/dark + typography               |
| `1d23736` | feat(theme): toggleTheme cycle + restoreThemeFromStorage with tests      |
| `3bb0f5f` | feat(tauri/menu): native macos menu bar                                  |
| `065efe9` | feat(menu): frontend menu event dispatcher with tests                    |
| `f20970e` | feat(app): wire native menu + safe action handlers + theme toggle        |

## Surface area

### Phase 6.1 — Design tokens + themes

- `src/styles/tokens.css` — shared, theme-agnostic `--knot-*` tokens
  (font stacks, radius, padding, line-height, base font size).
- `src/styles/theme-light.css` — `:root` + `:root[data-theme="light"]`
  colour palette (white background, dark text, blue accent).
- `src/styles/theme-dark.css` — `:root[data-theme="dark"]` palette plus
  a `prefers-color-scheme: dark` block scoped to `:root:not([data-theme])`
  so OS-level dark mode takes effect when the user has not picked a
  preference (i.e. theme === "system").
- `src/styles/typography.css` — `body` defaults and `.milkdown ...`
  rules (headings, code, pre, blockquote, links, selection) using only
  CSS variables. Lets the editor inherit theme colours automatically.
- `src/main.tsx` — imports the four stylesheets at app entry.

### Phase 6.2 — `theme.ts`

- `src/styles/theme.ts` — `Theme = 'system' | 'light' | 'dark'` plus
  `getTheme`/`setTheme`/`toggleTheme`/`restoreThemeFromStorage`.
  - `setTheme('system')` removes the `data-theme` attribute and the
    `knot.theme` localStorage key. `setTheme('dark')` / `'light'` writes
    both. This keeps the "system means absent" invariant the dark CSS
    media-query depends on.
  - `toggleTheme` cycles `system -> dark -> light -> system` via a
    `Record<Theme, Theme>` lookup table.
  - `restoreThemeFromStorage` reads `knot.theme` from localStorage and
    re-applies it to `<html>` before React mounts. Only the explicit
    `'dark'`/`'light'` values are restored — the `'system'` case is the
    absence of any attribute, so there's nothing to restore.
- `src/styles/__tests__/theme.test.ts` — 3 specs (default = system,
  setTheme persists to attribute + localStorage, full toggle cycle).
- `src/main.tsx` — calls `restoreThemeFromStorage()` before the React
  root renders, so the saved theme is in place before any pixel paints.

### Phase 5.1 — Native menu

- `src-tauri/src/menu.rs` — `build_menu(app: &AppHandle) -> Result<Menu<Wry>>`.
  - App ("KNOT") submenu: about / services / hide / hide_others /
    show_all / quit (all `PredefinedMenuItem`).
  - File submenu: New (`menu.file.new`, CmdOrCtrl+N), Open
    (`menu.file.open`, CmdOrCtrl+O), Save (`menu.file.save`,
    CmdOrCtrl+S), Save As (`menu.file.save_as`,
    CmdOrCtrl+Shift+S), close_window (predefined). The unicode "\u{2026}"
    horizontal-ellipsis is used for the dialog-bearing items per HIG.
  - Edit submenu: undo / redo / cut / copy / paste / select_all.
  - View submenu: Toggle Light/Dark (`menu.view.toggle_theme`,
    CmdOrCtrl+Shift+L), fullscreen.
  - `handle_menu_event(app, id)` looks up the "main" window and emits
    `("menu", id)` to it. The webview listens with `listen('menu', ...)`.
- `src-tauri/src/lib.rs` — `.setup(|app| { app.set_menu(...) })` installs
  the menu before any window opens; `.on_menu_event(...)` forwards into
  `handle_menu_event`. Existing fs commands + plugins untouched.

### Phase 5.2 — Frontend dispatcher

- `src/menu/menuEvents.ts` — `registerMenuEvents(handlers)` awaits
  `listen<string>('menu', ...)`, dispatches by id, returns the unlisten
  function. Handler signature is `() => void | Promise<void>` so async
  handlers plug in without ceremony.
- `src/menu/__tests__/menuEvents.test.ts` — 2 specs. The
  `@tauri-apps/api/event` module is `vi.mock`'d with an in-memory
  listener map plus an `__fire(eventName, payload)` test hook. Routes a
  known id to the right handler; unknown ids don't throw.

### Phase 5.3 — `App.tsx` wiring + error surfacing

- `src/App.tsx` — rewritten. Registers handlers for every native menu
  id from `menu.rs`. File handlers are wrapped in `safeAction(name, fn)`
  which catches rejections and surfaces them via
  `@tauri-apps/plugin-dialog`'s `message()` (`kind: 'error'`,
  `title: 'KNOT'`). This is the Phase 4 follow-up: actions reject on
  file I/O failures and without this the rejection would be a silent
  uncaught promise.
- New / Open use `remountAndRun` to bump `editorKey` after content
  changes, honouring the mount-once Editor contract from Phase 1. Save
  / Save As don't remount (they only persist current content).
- Save As implementation: clear `path` in the store before
  `saveDoc()`, so the existing `pickFileToSave()` branch fires. Simpler
  than introducing a new action and keeps the action layer pure.
- `src/App.module.css` — `.app` background/color now read
  `var(--knot-bg)` / `var(--knot-fg)` (fallbacks kept). Adds a 28px
  drag-region `.titlebar` showing the open file's basename, or
  "Untitled" when `path` is `null`.

## Verification

Final gate run after the last commit:

- `pnpm test -- --run` -> 6 files / 22 tests pass.
  - 5 io + 6 actions + 4 document + 2 editor + 2 menuEvents + 3 theme.
- `pnpm typecheck` -> clean.
- `pnpm lint --max-warnings 0` -> clean.
- `pnpm exec vite build` -> built (Crepe-chunk size warning is the
  same one from Phase 1; unchanged).
- `cd src-tauri && cargo fmt --check` -> clean.
- `cargo clippy --all-targets -- -D warnings` -> clean.
- `cargo test --all` -> 7/7 tests pass.
- `pnpm tauri build --no-bundle` -> succeeded end-to-end (Release
  binary at `src-tauri/target/release/knot`). This is the integration
  check that verifies the menu compiles against the real Tauri context
  + the capability JSON.

## Key decisions

- **Order: Phase 6 before Phase 5.** Task 5.3 imports `toggleTheme` from
  `src/styles/theme.ts`, so theme.ts had to exist first. Within Phase 6
  the CSS commit (6.1) is independent of the JS commit (6.2), so I
  delayed adding the `restoreThemeFromStorage()` call in `main.tsx`
  until commit 6.2 — that way each commit builds cleanly on its own
  (no broken intermediate where `main.tsx` imports a missing module).
- **"system" theme = no `data-theme` attribute.** Keeping the absent-
  attribute as the system signal means `prefers-color-scheme: dark`
  in `theme-dark.css` can fire via `:root:not([data-theme])`. If we
  represented system as `data-theme="system"` we'd need either a JS
  branch to listen on `matchMedia` and rewrite the attribute, or a
  separate token block. The absent-attribute convention is the smallest
  thing that works.
- **`restoreThemeFromStorage` only re-applies `'dark'`/`'light'`.**
  Anything else (null, "system", an unexpected string) leaves the
  attribute absent — that *is* the system state, so writing
  `data-theme="system"` would be wrong. Defensive on bad input.
- **Tauri 2 menu API — `MenuBuilder::items(&[&dyn IsMenuItem<R>])`.**
  Submenus implement `IsMenuItem`, so the top-level menu is built by
  passing references to the four submenus. The `Emitter` trait must be
  in scope on `AppHandle`/`Window` for `.emit(...)` to compile — hence
  the `use tauri::Emitter` import at the top of `menu.rs`. `Manager` is
  similarly needed for `app.get_webview_window("main")`.
- **`Save As` clears path before `saveDoc()`.** No new action needed.
  `saveDoc` already does the right thing when `path` is null
  (calls `pickFileToSave`, then `writeFile`). The store re-records the
  picked path inside `saveDoc`'s setState call, so the post-Save-As
  state reflects the new file. The cleanest reuse possible.
- **Wrapper `safeAction(name, fn)` defined inline in `App.tsx`.**
  Could live in `src/menu/` or `src/state/`, but it's only used by the
  menu wiring and depends on the dialog plugin, so keeping it next to
  the registration call keeps the dependency footprint local. If a
  second caller appears, lift it.
- **`useEffect` returns a cleanup that awaits the registration
  promise.** Because `registerMenuEvents` is async, the unlisten
  function lives behind a `Promise<() => void>`. The cleanup wraps
  `promise.then((unlisten) => unlisten())` in `void` so the cleanup
  function itself remains synchronous (React doesn't await effect
  cleanups). Safe across hot reloads / strict-mode double mounts.
- **`react-hooks/set-state-in-effect` disable.** Same pattern as Phase
  2 — bumping `editorKey` once after seeding welcome content is the
  whole point (mount-once contract).

## Notes / gotchas

- `cargo fmt` reformatted my initial `menu.rs` from a one-liner
  `MenuItem::with_id(app, "menu.file.open", ...)` to the multi-line
  form for the longer ids. The plan had the inline form for Open; the
  formatted output matches the surrounding style (`save_as` was already
  multi-line). `--check` now passes.
- The Crepe-chunk size warning from `vite build` is a pre-existing
  issue tracked in Phase 1's dev log, not new here.
- Did not delete `src/index.css` — it doesn't exist (and never did in
  this project). The plan asked me to `ls` first; that returned a
  missing-file error, so no delete.
- `restoreThemeFromStorage` runs synchronously *before* `createRoot`.
  This is intentional: it sets `data-theme` on `<html>` before React
  inserts anything, so the first paint has the right colour. No
  flash-of-wrong-theme.
- The capability JSON didn't need any changes for menus — Tauri's menu
  API doesn't go through the IPC permission layer. `pnpm tauri build`
  succeeded without touching `src-tauri/capabilities/default.json`.

## What's next

- M1 milestone is now feature-complete on the planned scope: editor +
  store + Rust fs + JS io + actions + native menu + theme. The
  M1 success criterion list from the project plan should now be
  ticked through end-to-end.
- Likely follow-ups for M2: dirty-aware close prompt (the store
  already tracks `dirty`, the menu now exists, so the prompt goes in
  `safeAction` or as a higher-order wrapper around New/Open/Quit),
  recent files, file watching for external changes.
