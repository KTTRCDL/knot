# M1 Phase 2 — Document state

## What landed

- Installed `zustand` 5.0.13. Clean lockfile add, no peer-dep warnings.
- Added `src/state/document.ts` — `useDocumentStore` hook exposing
  `path`, `content`, `dirty`, plus actions `setContent`, `open`,
  `markClean`, `reset`. Initial state is `{ path: null, content: '',
  dirty: false }`.
- Added `src/state/__tests__/document.test.ts` (4 specs, all green)
  driving the store's behavior: initial state, dirty tracking, idempotent
  `setContent`, and atomic `open()`.
- Rewired `src/App.tsx` to source `content` from the store and forward
  edits via the `setContent` selector. A mount-time effect seeds the
  welcome doc via `open()` and bumps `editorKey` once to remount the
  Editor so it picks up the seeded content.

## Key decisions

- **Idempotent `setContent`.** Short-circuits when the new value equals
  the current `content` so future flushes of the editor's `onChange`
  after a Save (which will call `markClean`) cannot immediately re-mark
  the doc dirty. Keeps the dirty bit reflective of the user's intent.
- **Stable callback via Zustand selector.** `useDocumentStore((s) =>
  s.setContent)` returns the same function reference across renders,
  which is exactly what the Editor's mount-once `onChange` contract
  requires (see `EditorProps` JSDoc).
- **One-shot `editorKey` bump.** Editor reads `initialContent` only on
  mount. The first render passes the store's initial empty string;
  bumping the key after `open()` forces a remount that re-reads the
  seeded welcome content. Same hook will swap documents on file open in
  the next phase.
- **Targeted lint suppression.** `react-hooks/set-state-in-effect` is
  disabled on the single `setEditorKey` line, with a comment pointing at
  the mount-once contract. Mirrors the `exhaustive-deps` suppression
  already present in `Editor.tsx`.

## Verification

- `pnpm test -- --run` → 6/6 pass (4 document, 2 editor).
- `pnpm typecheck` → clean.
- `pnpm lint` (`--max-warnings 0`) → clean.
- `pnpm exec vite build` → succeeded (existing chunk-size warning
  unchanged).
