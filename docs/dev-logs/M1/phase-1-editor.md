# M1 Phase 1 — Editor module

## What landed

- Installed Milkdown 7.21.1 (`crepe`, `core`, `ctx`, `utils`, `transformer`,
  `preset-commonmark`, `preset-gfm`, `theme-nord`). Clean lockfile resolution
  with no peer-dep warnings.
- Added `src/editor/Editor.tsx` — a self-contained component that wraps a
  Crepe instance bound to a single `<div role="textbox">`. Mount-once
  `useEffect` constructs Crepe with `defaultValue`, subscribes to the
  `markdownUpdated` listener, and tears the instance down on unmount.
- Added `src/editor/Editor.module.css` — full-bleed scrollable surface with
  generous horizontal padding (matches the spec's editor layout).
- Added `src/editor/__tests__/Editor.test.tsx` — RTL test asserting the
  textbox renders. Written first (red), then made green by the
  implementation (TDD).
- Rewired `src/App.tsx` to render the Editor with a placeholder
  `DEFAULT_DOC`. Dropped the scaffold demo + `App.css` in favor of a scoped
  `App.module.css` shell that fills the viewport.

## Key decisions

- **Empty `useEffect` dep array on purpose.** Crepe owns its own state once
  mounted; recreating it on every prop change would discard the user's
  cursor and undo history. Suppressed `react-hooks/exhaustive-deps` for
  that single hook with a comment explaining intent — the warning was the
  only blocker between us and `--max-warnings 0`. Phase 2 will replace
  `setContent` with a store action; the editor is still mount-once.
- **`role="textbox"` on the wrapper div, not on Crepe internals.** Lets
  RTL find the surface deterministically without coupling tests to
  ProseMirror's internal markup, and keeps the test fast (no Crepe init
  needed beyond what jsdom can stand up).
- **Conventional Commits, one commit per task** (1.1 deps; 1.2+1.3 fused
  per TDD red/green pair; 1.4 wiring). Three commits on top of the
  scaffold.

## Surprises

- The Crepe CSS imports (`@milkdown/crepe/theme/common/style.css` and
  `theme/frame.css`) resolve cleanly in Vite without extra config, but
  they pull a large code-highlighting bundle (one chunk ~1.6 MB gzipped
  to ~530 kB). Vite warns about chunk size. Functional but worth
  revisiting — see follow-up below.

## Suggested follow-ups

- **Bundle size.** The 1.6 MB chunk is dominated by refractor language
  defs. Consider lazy-loading the editor (`React.lazy`) or trimming the
  highlight grammars Crepe registers. Not urgent for Phase 1 but should
  land before any production builds.
- **Controlled-vs-uncontrolled boundary.** Right now `initialContent` is
  read once at mount and changes are pushed up. When Phase 2 lands the
  Zustand store, decide whether reopening a file should mount a fresh
  Editor (key-on-path) or imperatively call `crepe.editor` to swap docs.
  Document the choice so Phase 4's open/save flow knows what to do.
- **Tauri smoke test.** I only verified `vite build`. The first time
  someone runs `pnpm tauri dev`, watch for missing Crepe CSS in the
  Tauri webview or any clipboard/keymap quirks.

## Review fixes (round 1)

Code review surfaced four Important issues. All fixed, one commit each, on
top of the original three:

- **`78fdb21` test(editor)** — `Editor.test.tsx` was passing on the wrapper
  div alone. Added a StrictMode test that waits for the real `.ProseMirror`
  DOM and the seed text to appear. jsdom hosts Crepe fine; no `waitFor`
  fallback was needed and the `findByText` path works.
- **`51bc8bf` fix(editor)** — added a `cancelled` flag in the effect
  cleanup so `markdownUpdated` cannot fire `onChange` after unmount.
  Closes the StrictMode double-mount race.
- **`b4916d6` style(app)** — restored the plan's `background:
  var(--knot-bg, #fff)` and `color: var(--knot-fg, #1a1a1a)` on `.app`.
  Variables land in Phase 6; fallbacks paint the shell today.
- **`734a758` docs(editor)** — JSDoc on `EditorProps` documenting the
  mount-once contract: both props are captured on mount; remount via `key`
  to reset.

Sanity: `pnpm test --run` (2 pass), `pnpm typecheck`, `pnpm lint
--max-warnings 0`, and `pnpm exec vite build` all clean.
