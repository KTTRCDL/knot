# M1 Phase 4 — Frontend io + document actions

**Status:** DONE (3 commits on `main`, not pushed)

## What landed

| SHA       | Subject                                                            |
|-----------|--------------------------------------------------------------------|
| `fad1f0a` | chore(deps): add @tauri-apps/plugin-dialog and plugin-fs clients   |
| `af6d2aa` | feat(io): tauri command wrappers with tests                        |
| `2cc95f2` | feat(state): newDoc/openDoc/saveDoc actions with tests             |

## Surface area

- `package.json` / `pnpm-lock.yaml` — `@tauri-apps/plugin-dialog@2.7.1`
  and `@tauri-apps/plugin-fs@2.5.1` added under `dependencies`. plugin-fs
  is unused on the JS side today (we own `read_file`/`write_file` via
  `invoke`); kept per the plan so the JS package set stays aligned with
  the Rust-side `tauri-plugin-fs` permission grant.
- `src/io/io.ts` — four thin async wrappers:
  - `readFile(path)` -> `invoke<string>('read_file', { path })`.
  - `writeFile(path, content)` -> `invoke<void>('write_file', { path, content })`.
  - `pickFileToOpen()` -> `openDialog({ multiple: false, directory: false,
    filters: MD_FILTERS })`, normalized to `string | null`.
  - `pickFileToSave(defaultName = 'Untitled.md')` -> `saveDialog({
    defaultPath, filters })`, returns `string | null`.
- `src/io/__tests__/io.test.ts` — 5 specs mocking `@tauri-apps/api/core`
  and `@tauri-apps/plugin-dialog`. Asserts invoke args, dialog filter
  shape, and null/cancel paths.
- `src/state/actions.ts` — `newDoc` / `openDoc` / `saveDoc` composing
  store + io.
- `src/state/__tests__/actions.test.ts` — 6 specs mocking `../../io/io`.
  Covers new-doc reset, open happy + cancel paths, save with existing
  path, save-as fallback, save-as cancel.

## Key decisions

- **`pickFileToOpen` narrows `string | string[] | null`.** The
  `plugin-dialog` `open()` typings widen the return when `multiple`
  flips. We pass `multiple: false`, but TypeScript still infers the
  union; explicit `Array.isArray(result)` guard collapses it to the
  single-file shape so callers only see `string | null`.
- **`saveDoc` records `path` + clears `dirty` in one `setState`.**
  Using the store's existing `open()` would also overwrite `content`
  with whatever is in scope, which is fine here but couples the action
  to the store contract; a plain `setState({ path, dirty: false })` is
  the minimal precise change.
- **`vi.mock('../../io/io', ...)` in actions tests, not module-level
  factory in io itself.** Keeps the io tests honest (they hit the real
  io module against mocked Tauri SDKs), and the actions tests honest
  (they hit the real action code against a mocked io). No transitive
  mock leakage between suites.
- **TDD red/green fused per task.** Tests written first, observed
  failing for the right reason (`Failed to resolve import "../io"`,
  `"../actions"`), then implementation made them green inside the same
  commit. Two of the three commits follow that pattern; the third is
  the deps bump and stands alone.

## Verification

- `pnpm test -- --run` -> 4 files / 17 tests pass (5 io + 6 actions +
  4 document + 2 editor).
- `pnpm typecheck` -> clean.
- `pnpm lint --max-warnings 0` -> clean.
- `pnpm exec vite build` -> succeeded (pre-existing Crepe-chunk size
  warning unchanged — same one tracked in Phase 1's dev log).

## Notes / gotchas

- `vi.mock(...)` hoisting works as expected: the factory references
  the imported `vi` because Vitest rewrites the order. No surprises
  there.
- `plugin-fs` ships TypeScript types and a runtime, but we don't import
  any of its symbols. Lint stays clean because nothing references the
  module. If a future phase wants to drop it (the dialog plugin grant
  already covers our needs), it's a one-line `package.json` change —
  no source code touches it.

## What's next

- Phase 5: wire `newDoc` / `openDoc` / `saveDoc` to native menu events
  in `App.tsx`. The actions are deliberately argument-free so the menu
  handlers can call them directly.
- Eventually: dirty-aware close prompts before `newDoc` / `openDoc` /
  app quit. The store already tracks `dirty`; the action layer is the
  right place to interpose a confirm dialog when that lands.
