# KNOT M1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship KNOT v0.0.1 — a working Tauri 2 + React + Milkdown app on macOS that opens, edits, and saves Markdown files, with a native menu bar and light/dark themes following system appearance.

**Architecture:** Tauri 2.x (Rust backend in `src-tauri/`, React + TS frontend in `src/`). Milkdown's Crepe preset is the editor surface — it ships with sensible plugin defaults (formatting, lists, headings) and lets us defer math/diagrams/Shiki to M2. File I/O is exposed as Tauri commands (`fs_read`, `fs_write`, `fs_open_dialog`, `fs_save_dialog`) and consumed from the frontend through a thin `io.ts` wrapper. State lives in a Zustand store. Native macOS menu bar is built with Tauri's `menu` API and routes through events to the frontend.

**Tech Stack:** Tauri 2.x · Rust (edition 2021) · React 18 · TypeScript 5 · Vite 5 · pnpm · Milkdown (`@milkdown/crepe`) · Zustand · Vitest + React Testing Library · `cargo test` · GitHub Actions

**Working dir:** `/Users/kttrcdl/project/knot/` (the `docs/` subtree already exists; the Tauri scaffold creates everything else)

---

## Pre-flight: Environment check

Before any task, the engineer must verify the local toolchain. Each tool has a minimum version.

| Tool | Min version | Check command |
|---|---|---|
| Node.js | 20 LTS | `node -v` |
| pnpm | 9.15.x | `pnpm -v` |
| Rust | 1.77 | `rustc --version` |
| Xcode Command Line Tools | latest | `xcode-select -p` (must return a path) |
| GitHub CLI | 2.x | `gh --version` and `gh auth status` |

If any of these are missing, install via:
- Node: `brew install node`
- pnpm: `corepack enable && corepack prepare pnpm@9.15.0 --activate` (pin to 9.15 — `pnpm@latest` needs Node ≥22.13)
- Rust: `curl https://sh.rustup.rs -sSf | sh`
- Xcode CLT: `xcode-select --install`
- gh: `brew install gh && gh auth login`

---

## File structure (what M1 creates)

```
knot/
├── docs/                      # already exists
│   └── superpowers/
│       ├── specs/2026-05-19-knot-design.md
│       └── plans/2026-05-19-knot-m1-foundation.md   # this file
├── src/                       # Tauri scaffold creates this
│   ├── main.tsx               # React entry
│   ├── App.tsx                # top-level shell
│   ├── App.module.css         # shell styles
│   ├── styles/
│   │   ├── tokens.css         # CSS custom-property design tokens
│   │   ├── theme-light.css    # light-theme variable values
│   │   ├── theme-dark.css     # dark-theme variable values
│   │   └── typography.css     # type scale, headings, body
│   ├── editor/
│   │   ├── Editor.tsx         # Milkdown Crepe wrapper
│   │   └── Editor.module.css  # editor-pane styles
│   ├── state/
│   │   └── document.ts        # Zustand store for current document
│   ├── io/
│   │   └── io.ts              # wraps Tauri invokes for fs commands
│   ├── menu/
│   │   └── menuEvents.ts      # listens to menu events from Rust
│   └── __tests__/             # Vitest tests
│       ├── state-document.test.ts
│       └── io.test.ts
├── src-tauri/                 # Tauri scaffold creates this
│   ├── src/
│   │   ├── main.rs            # bootstrap
│   │   ├── lib.rs             # registers commands & plugins
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   └── fs.rs          # read_file, write_file, open_dialog, save_dialog
│   │   └── menu.rs            # native menu definition + click routing
│   ├── tauri.conf.json
│   └── Cargo.toml
├── .github/
│   └── workflows/
│       └── ci.yml             # build + lint + test on every PR/push
├── .gitignore
├── LICENSE                    # MIT
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

Each module has one responsibility:
- `editor/Editor.tsx` — Milkdown integration only; no I/O.
- `state/document.ts` — single source of truth for the open document.
- `io/io.ts` — only knows how to call Tauri commands; doesn't touch state.
- `menu/menuEvents.ts` — only listens to menu events and dispatches to the right handler.
- `commands/fs.rs` (Rust) — only file I/O; no menu, no state.
- `menu.rs` (Rust) — only menu structure and emit events.

---

## Phase 0: Scaffold and Git

### Task 0.1: Verify pre-flight environment

**Files:** none (verification only)

- [ ] **Step 1:** Run pre-flight checks

```bash
cd /Users/kttrcdl/project/knot
node -v
pnpm -v
rustc --version
xcode-select -p
gh --version
gh auth status
```

Expected: each command prints a version / path with no error. If any fails, install per the pre-flight table above and rerun.

- [ ] **Step 2:** Verify the directory layout

```bash
ls /Users/kttrcdl/project/knot
```

Expected output: `docs` (and nothing else). If other files exist, stop and ask the manager — we need an empty-ish dir for `create-tauri-app`.

---

### Task 0.2: Scaffold the Tauri project

**Files:**
- Modify everything in `/Users/kttrcdl/project/knot/` (Tauri scaffolds into the current directory)

- [ ] **Step 1:** Scaffold

Because the `docs/` directory already exists, scaffold into a temporary directory then merge. This avoids `create-tauri-app` complaining about a non-empty target.

```bash
cd /tmp
pnpm create tauri-app@latest knot-scaffold --template react-ts --manager pnpm --identifier app.knot.editor
```

Expected: an interactive (or non-interactive with the args above) scaffold completes. You'll see a directory `/tmp/knot-scaffold/` with `package.json`, `src/`, `src-tauri/`, etc.

- [ ] **Step 2:** Merge the scaffold into the project

```bash
rsync -av --exclude='docs' /tmp/knot-scaffold/ /Users/kttrcdl/project/knot/
rm -rf /tmp/knot-scaffold
ls /Users/kttrcdl/project/knot/
```

Expected: the knot directory now contains `package.json`, `src/`, `src-tauri/`, `docs/`, `index.html`, `vite.config.ts`, etc.

- [ ] **Step 3:** Install dependencies

```bash
cd /Users/kttrcdl/project/knot
pnpm install
```

Expected: dependencies install with no errors. May take a minute.

- [ ] **Step 4:** Run the dev server (smoke test)

```bash
pnpm tauri dev
```

Expected: a Tauri window opens showing the default "Welcome to Tauri + React" screen. Cargo will compile the Rust backend on first run (takes 1-3 minutes). Once the window opens, **press Cmd+Q to close**.

- [ ] **Step 5:** Commit nothing yet (we're not in git)

---

### Task 0.3: Initialize git and write top-level docs

**Files:**
- Create: `LICENSE`
- Create: `README.md`
- Create: `.gitignore` (already exists from scaffold — append if needed)

- [ ] **Step 1:** Initialize git

```bash
cd /Users/kttrcdl/project/knot
git init -b main
```

- [ ] **Step 2:** Write `LICENSE` (MIT)

Create `/Users/kttrcdl/project/knot/LICENSE`:

```
MIT License

Copyright (c) 2026 kttrcdl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3:** Write `README.md`

Create `/Users/kttrcdl/project/knot/README.md`:

````markdown
# KNOT

> **KNOT** is **N**ot **O**nly **T**ypora — an open-source, vibe-coded Markdown editor for macOS.

KNOT is a native-feeling Markdown editor for macOS, inspired by Typora's single-pane live WYSIWYG experience. Built on Tauri 2 + Milkdown.

## Status

Pre-alpha. M1 (Foundation) is the first milestone — it ships a working editor with file open/save and light/dark themes.

## Develop

Prerequisites: Node 20+, pnpm 9+, Rust 1.77+, Xcode Command Line Tools.

```bash
pnpm install
pnpm tauri dev
```

## Build

```bash
pnpm tauri build
```

The signed `.dmg` lands in `src-tauri/target/release/bundle/dmg/`.

## License

[MIT](./LICENSE)
````

- [ ] **Step 4:** Verify `.gitignore` covers Rust + Node + macOS junk

Check `/Users/kttrcdl/project/knot/.gitignore` already contains `node_modules`, `dist`, `target`, `*.app`. Add the following lines if missing:

```
.DS_Store
.idea/
.vscode/
*.log
.env.local
```

- [ ] **Step 5:** Initial commit

```bash
git add -A
git commit -m "chore: initial tauri scaffold + license + readme"
```

Expected: a commit on `main` with all scaffold files + LICENSE + README.

---

### Task 0.4: Create GitHub repo and push

**Files:** none (remote operations)

- [ ] **Step 1:** Create public repo

```bash
cd /Users/kttrcdl/project/knot
gh repo create knot --public --source=. --remote=origin --description "KNOT is Not Only Typora — open-source vibe-coded Markdown editor for macOS." --push
```

Expected: GitHub repo `KTTRCDL/knot` is created, `origin` is added, and `main` is pushed. URL printed to stdout.

- [ ] **Step 2:** Verify

```bash
git remote -v
gh repo view KTTRCDL/knot --json url,visibility,defaultBranchRef
```

Expected: `origin` shows the GitHub URL; the repo is `public` with default branch `main`.

- [ ] **Step 3:** Enable branch protection on `main` (require PR + CI passing)

```bash
gh api repos/KTTRCDL/knot/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

We'll attach required CI checks in Task 0.5 once the workflow exists. For now, just block force-pushes and deletes.

Expected: 200 OK from the API.

---

### Task 0.5: CI workflow (build + lint + test)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1:** Write the CI workflow

Create `/Users/kttrcdl/project/knot/.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test -- --run

  backend:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri
      - run: cd src-tauri && cargo fmt --check
      - run: cd src-tauri && cargo clippy --all-targets -- -D warnings
      - run: cd src-tauri && cargo test --all

  build:
    runs-on: macos-14
    needs: [frontend, backend]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri
      - run: pnpm install --frozen-lockfile
      - run: pnpm tauri build --no-bundle
```

- [ ] **Step 2:** Add npm scripts that CI calls

Edit `/Users/kttrcdl/project/knot/package.json` — add these scripts to the `scripts` block:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest"
  }
}
```

- [ ] **Step 3:** Install ESLint + Vitest

```bash
cd /Users/kttrcdl/project/knot
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/jsdom
```

- [ ] **Step 4:** Create `eslint.config.js`

Create `/Users/kttrcdl/project/knot/eslint.config.js`:

```js
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist', 'src-tauri/target', 'node_modules'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
```

- [ ] **Step 5:** Create `vitest.config.ts`

Create `/Users/kttrcdl/project/knot/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
```

Create `/Users/kttrcdl/project/knot/src/__tests__/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6:** Run all CI checks locally

```bash
cd /Users/kttrcdl/project/knot
pnpm typecheck
pnpm lint
pnpm test -- --run
cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test --all && cd ..
```

Expected: all pass. Test run will say "No test files found" — that is acceptable for now; we will add tests in later tasks.

- [ ] **Step 7:** Commit and push

```bash
git add -A
git commit -m "ci: add github actions workflow + lint + vitest"
git push
```

Expected: CI runs and passes on GitHub. Check with `gh run watch`.

- [ ] **Step 8:** Update branch protection to require CI

```bash
gh api repos/KTTRCDL/knot/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": { "strict": true, "contexts": ["frontend", "backend", "build"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

---

## Phase 1: Milkdown editor integration

### Task 1.1: Install Milkdown Crepe

**Files:**
- Modify: `package.json`

- [ ] **Step 1:** Install Crepe and its peer deps

```bash
cd /Users/kttrcdl/project/knot
pnpm add @milkdown/crepe @milkdown/core @milkdown/ctx @milkdown/utils @milkdown/transformer @milkdown/preset-commonmark @milkdown/preset-gfm @milkdown/theme-nord
```

Expected: install succeeds; `package.json` shows new dependencies.

- [ ] **Step 2:** Verify no peer-dep warnings

```bash
pnpm install
```

Expected: clean install.

---

### Task 1.2: Write a smoke test for the Editor component

**Files:**
- Create: `src/editor/__tests__/Editor.test.tsx`

- [ ] **Step 1:** Write the failing test

Create `/Users/kttrcdl/project/knot/src/editor/__tests__/Editor.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Editor } from '../Editor';

describe('Editor', () => {
  it('renders an editable surface', () => {
    render(<Editor initialContent="# Hello" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2:** Run the test (should fail — Editor doesn't exist)

```bash
cd /Users/kttrcdl/project/knot
pnpm test -- --run Editor
```

Expected: FAIL — `Cannot find module '../Editor'`.

---

### Task 1.3: Implement the Editor component

**Files:**
- Create: `src/editor/Editor.tsx`
- Create: `src/editor/Editor.module.css`

- [ ] **Step 1:** Implement minimal Editor with Crepe

Create `/Users/kttrcdl/project/knot/src/editor/Editor.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import styles from './Editor.module.css';

export interface EditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
}

export function Editor({ initialContent, onChange }: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const crepe = new Crepe({
      root: ref.current,
      defaultValue: initialContent,
    });
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        onChange(markdown);
      });
    });
    crepe.create();
    crepeRef.current = crepe;
    return () => {
      crepe.destroy();
      crepeRef.current = null;
    };
  }, []);

  return <div ref={ref} role="textbox" className={styles.editor} />;
}
```

Create `/Users/kttrcdl/project/knot/src/editor/Editor.module.css`:

```css
.editor {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 2rem 4rem;
  box-sizing: border-box;
}
```

- [ ] **Step 2:** Run test

```bash
pnpm test -- --run Editor
```

Expected: PASS. The element with `role="textbox"` is the div we render.

- [ ] **Step 3:** Commit

```bash
git add src/editor/ package.json pnpm-lock.yaml
git commit -m "feat(editor): add milkdown crepe editor component"
```

---

### Task 1.4: Wire Editor into App shell

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.module.css` (or `App.css` from scaffold — rename to `.module.css` if needed)

- [ ] **Step 1:** Rewrite `App.tsx`

Replace `/Users/kttrcdl/project/knot/src/App.tsx` with:

```tsx
import { useState } from 'react';
import { Editor } from './editor/Editor';
import styles from './App.module.css';

const DEFAULT_DOC = `# Welcome to KNOT

Start typing.`;

export default function App() {
  const [, setContent] = useState(DEFAULT_DOC);
  return (
    <div className={styles.app}>
      <Editor initialContent={DEFAULT_DOC} onChange={setContent} />
    </div>
  );
}
```

- [ ] **Step 2:** Replace `App.css` with `App.module.css`

Delete `/Users/kttrcdl/project/knot/src/App.css`. Create `/Users/kttrcdl/project/knot/src/App.module.css`:

```css
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--knot-bg, #ffffff);
  color: var(--knot-fg, #1a1a1a);
}
```

Remove the `import "./App.css"` line if it remains anywhere.

- [ ] **Step 3:** Run dev server (smoke test)

```bash
pnpm tauri dev
```

Expected: a Tauri window opens with a Milkdown editor showing "Welcome to KNOT" as a rendered heading. You can type. Press Cmd+Q to close.

- [ ] **Step 4:** Commit

```bash
git add -A
git commit -m "feat(app): mount editor in app shell"
```

---

## Phase 2: Document state (Zustand)

### Task 2.1: Install Zustand

- [ ] **Step 1:** Install

```bash
cd /Users/kttrcdl/project/knot
pnpm add zustand
```

---

### Task 2.2: Write document store tests

**Files:**
- Create: `src/state/__tests__/document.test.ts`

- [ ] **Step 1:** Write failing tests

Create `/Users/kttrcdl/project/knot/src/state/__tests__/document.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../document';

describe('document store', () => {
  beforeEach(() => {
    useDocumentStore.getState().reset();
  });

  it('starts with an empty untitled document', () => {
    const s = useDocumentStore.getState();
    expect(s.content).toBe('');
    expect(s.path).toBeNull();
    expect(s.dirty).toBe(false);
  });

  it('marks dirty when content changes', () => {
    useDocumentStore.getState().setContent('hello');
    const s = useDocumentStore.getState();
    expect(s.content).toBe('hello');
    expect(s.dirty).toBe(true);
  });

  it('does not mark dirty when setting same content', () => {
    useDocumentStore.getState().setContent('hello');
    useDocumentStore.getState().markClean();
    useDocumentStore.getState().setContent('hello');
    expect(useDocumentStore.getState().dirty).toBe(false);
  });

  it('open() replaces content + path and clears dirty', () => {
    useDocumentStore.getState().setContent('dirty');
    useDocumentStore.getState().open({ path: '/tmp/a.md', content: 'fresh' });
    const s = useDocumentStore.getState();
    expect(s.path).toBe('/tmp/a.md');
    expect(s.content).toBe('fresh');
    expect(s.dirty).toBe(false);
  });
});
```

- [ ] **Step 2:** Run (should fail — store doesn't exist)

```bash
pnpm test -- --run document
```

Expected: FAIL — cannot import `../document`.

---

### Task 2.3: Implement document store

**Files:**
- Create: `src/state/document.ts`

- [ ] **Step 1:** Write the store

Create `/Users/kttrcdl/project/knot/src/state/document.ts`:

```ts
import { create } from 'zustand';

export interface DocumentState {
  path: string | null;
  content: string;
  dirty: boolean;
  setContent: (content: string) => void;
  open: (doc: { path: string; content: string }) => void;
  markClean: () => void;
  reset: () => void;
}

const INITIAL: Pick<DocumentState, 'path' | 'content' | 'dirty'> = {
  path: null,
  content: '',
  dirty: false,
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...INITIAL,
  setContent: (content) => {
    if (content === get().content) return;
    set({ content, dirty: true });
  },
  open: ({ path, content }) => set({ path, content, dirty: false }),
  markClean: () => set({ dirty: false }),
  reset: () => set({ ...INITIAL }),
}));
```

- [ ] **Step 2:** Run tests

```bash
pnpm test -- --run document
```

Expected: PASS (all 4 tests).

- [ ] **Step 3:** Commit

```bash
git add src/state/ package.json pnpm-lock.yaml
git commit -m "feat(state): zustand document store with dirty tracking"
```

---

### Task 2.4: Wire store into App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1:** Use the store

Replace `/Users/kttrcdl/project/knot/src/App.tsx`:

```tsx
import { useEffect } from 'react';
import { Editor } from './editor/Editor';
import { useDocumentStore } from './state/document';
import styles from './App.module.css';

const WELCOME = `# Welcome to KNOT

KNOT is Not Only Typora. Start typing.`;

export default function App() {
  const { content, setContent, open } = useDocumentStore();

  useEffect(() => {
    open({ path: '', content: WELCOME });
  }, [open]);

  return (
    <div className={styles.app}>
      <Editor key={content === WELCOME ? 'welcome' : 'doc'} initialContent={content} onChange={setContent} />
    </div>
  );
}
```

Note: the `key` prop forces remount when we switch documents (so Milkdown re-initializes with new content). We'll formalize this pattern in Task 4.5.

- [ ] **Step 2:** Run

```bash
pnpm tauri dev
```

Expected: editor still loads with the welcome message. Edits update the store (we can't see this yet; we'll verify in Task 4.x).

- [ ] **Step 3:** Commit

```bash
git add src/App.tsx
git commit -m "feat(app): wire document store into shell"
```

---

## Phase 3: File I/O backend (Rust)

### Task 3.1: Add Tauri plugins

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1:** Add `tauri-plugin-dialog` and `tauri-plugin-fs`

```bash
cd /Users/kttrcdl/project/knot/src-tauri
cargo add tauri-plugin-dialog tauri-plugin-fs
```

- [ ] **Step 2:** Register plugins in `lib.rs`

Edit `/Users/kttrcdl/project/knot/src-tauri/src/lib.rs`. Find the `tauri::Builder::default()` chain and add the plugins:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![/* will add commands here in 3.3 */])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3:** Build to verify

```bash
cd /Users/kttrcdl/project/knot/src-tauri
cargo build
```

Expected: builds. May take a minute.

- [ ] **Step 4:** Commit

```bash
cd /Users/kttrcdl/project/knot
git add src-tauri/
git commit -m "feat(tauri): add dialog + fs plugins"
```

---

### Task 3.2: Write tests for `read_file` and `write_file`

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/fs.rs` (with failing tests)

- [ ] **Step 1:** Create the module skeleton

Create `/Users/kttrcdl/project/knot/src-tauri/src/commands/mod.rs`:

```rust
pub mod fs;
```

- [ ] **Step 2:** Write failing tests in `fs.rs`

Create `/Users/kttrcdl/project/knot/src-tauri/src/commands/fs.rs`:

```rust
use std::path::{Path, PathBuf};
use std::io;
use tokio::fs;

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    read_file_impl(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    write_file_impl(Path::new(&path), &content).await.map_err(|e| e.to_string())
}

async fn read_file_impl(path: &Path) -> io::Result<String> {
    fs::read_to_string(path).await
}

async fn write_file_impl(path: &Path, content: &str) -> io::Result<()> {
    let tmp = tmp_path_for(path);
    fs::write(&tmp, content).await?;
    fs::rename(&tmp, path).await
}

fn tmp_path_for(path: &Path) -> PathBuf {
    let mut s = path.as_os_str().to_owned();
    s.push(".knot-tmp");
    PathBuf::from(s)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn read_returns_file_contents() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("a.md");
        std::fs::write(&p, "# hi").unwrap();
        let got = read_file_impl(&p).await.unwrap();
        assert_eq!(got, "# hi");
    }

    #[tokio::test]
    async fn read_missing_file_errors() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("missing.md");
        assert!(read_file_impl(&p).await.is_err());
    }

    #[tokio::test]
    async fn write_creates_file_with_content() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("b.md");
        write_file_impl(&p, "hello").await.unwrap();
        let got = std::fs::read_to_string(&p).unwrap();
        assert_eq!(got, "hello");
    }

    #[tokio::test]
    async fn write_is_atomic_via_temp_rename() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("c.md");
        std::fs::write(&p, "original").unwrap();
        write_file_impl(&p, "new").await.unwrap();
        let got = std::fs::read_to_string(&p).unwrap();
        assert_eq!(got, "new");
        // Temp file should not linger
        assert!(!tmp_path_for(&p).exists());
    }
}
```

- [ ] **Step 3:** Add `tokio` and `tempfile` to Cargo.toml

Edit `/Users/kttrcdl/project/knot/src-tauri/Cargo.toml`:

In `[dependencies]`, add (or confirm present):

```toml
tokio = { version = "1", features = ["fs", "rt-multi-thread", "macros"] }
```

In `[dev-dependencies]` (create the section if it doesn't exist), add:

```toml
tempfile = "3"
tokio = { version = "1", features = ["fs", "rt-multi-thread", "macros", "test-util"] }
```

- [ ] **Step 4:** Reference the module from `lib.rs`

Add to the top of `/Users/kttrcdl/project/knot/src-tauri/src/lib.rs`:

```rust
mod commands;
```

- [ ] **Step 5:** Run tests

```bash
cd /Users/kttrcdl/project/knot/src-tauri
cargo test
```

Expected: PASS — all 4 fs tests.

- [ ] **Step 6:** Commit

```bash
cd /Users/kttrcdl/project/knot
git add src-tauri/
git commit -m "feat(tauri/fs): atomic read_file + write_file commands with tests"
```

---

### Task 3.3: Register fs commands and verify dialog plugin

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json` (or whatever the default capability file is)

- [ ] **Step 1:** Register commands in the `invoke_handler!`

Edit `/Users/kttrcdl/project/knot/src-tauri/src/lib.rs`:

```rust
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::fs::read_file,
            commands::fs::write_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 2:** Grant capability permissions

Edit `/Users/kttrcdl/project/knot/src-tauri/capabilities/default.json`. Find the `permissions` array and add:

```json
"core:default",
"dialog:default",
"fs:default"
```

The full file should look approximately like:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "fs:default"
  ]
}
```

- [ ] **Step 3:** Verify build

```bash
cd /Users/kttrcdl/project/knot
pnpm tauri build --no-bundle
```

Expected: builds without permission errors. (We use `--no-bundle` to skip code signing locally.)

- [ ] **Step 4:** Commit

```bash
git add src-tauri/
git commit -m "feat(tauri): register fs commands + grant dialog/fs capabilities"
```

---

## Phase 4: File I/O frontend

### Task 4.1: Write tests for the io wrapper

**Files:**
- Create: `src/io/__tests__/io.test.ts`

- [ ] **Step 1:** Write failing tests

Create `/Users/kttrcdl/project/knot/src/io/__tests__/io.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, pickFileToOpen, pickFileToSave } from '../io';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('io', () => {
  it('readFile invokes read_file command', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue('# content');
    const r = await readFile('/tmp/a.md');
    expect(invoke).toHaveBeenCalledWith('read_file', { path: '/tmp/a.md' });
    expect(r).toBe('# content');
  });

  it('writeFile invokes write_file command', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await writeFile('/tmp/a.md', 'hi');
    expect(invoke).toHaveBeenCalledWith('write_file', { path: '/tmp/a.md', content: 'hi' });
  });

  it('pickFileToOpen returns selected path or null', async () => {
    (openDialog as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/x.md');
    const r = await pickFileToOpen();
    expect(r).toBe('/tmp/x.md');
  });

  it('pickFileToOpen returns null when dialog cancelled', async () => {
    (openDialog as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const r = await pickFileToOpen();
    expect(r).toBeNull();
  });

  it('pickFileToSave defaults to .md extension', async () => {
    (saveDialog as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/new.md');
    const r = await pickFileToSave();
    expect(saveDialog).toHaveBeenCalledWith(expect.objectContaining({
      defaultPath: expect.any(String),
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    }));
    expect(r).toBe('/tmp/new.md');
  });
});
```

- [ ] **Step 2:** Run (should fail)

```bash
pnpm test -- --run io
```

Expected: FAIL — `Cannot find module '../io'`.

---

### Task 4.2: Implement the io wrapper

**Files:**
- Create: `src/io/io.ts`

- [ ] **Step 1:** Install plugin dialog client

```bash
cd /Users/kttrcdl/project/knot
pnpm add @tauri-apps/plugin-dialog @tauri-apps/plugin-fs
```

- [ ] **Step 2:** Write `io.ts`

Create `/Users/kttrcdl/project/knot/src/io/io.ts`:

```ts
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';

const MD_FILTERS = [{ name: 'Markdown', extensions: ['md', 'markdown'] }];

export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  await invoke<void>('write_file', { path, content });
}

export async function pickFileToOpen(): Promise<string | null> {
  const result = await openDialog({
    multiple: false,
    directory: false,
    filters: MD_FILTERS,
  });
  if (Array.isArray(result)) return result[0] ?? null;
  return (result as string | null) ?? null;
}

export async function pickFileToSave(defaultName = 'Untitled.md'): Promise<string | null> {
  const result = await saveDialog({
    defaultPath: defaultName,
    filters: MD_FILTERS,
  });
  return (result as string | null) ?? null;
}
```

- [ ] **Step 3:** Run tests

```bash
pnpm test -- --run io
```

Expected: PASS (all 5 io tests).

- [ ] **Step 4:** Commit

```bash
git add src/io/ package.json pnpm-lock.yaml
git commit -m "feat(io): tauri command wrappers with tests"
```

---

### Task 4.3: Document actions (newDoc, openDoc, saveDoc)

**Files:**
- Create: `src/state/actions.ts`
- Create: `src/state/__tests__/actions.test.ts`

- [ ] **Step 1:** Write failing tests

Create `/Users/kttrcdl/project/knot/src/state/__tests__/actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocumentStore } from '../document';

vi.mock('../../io/io', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  pickFileToOpen: vi.fn(),
  pickFileToSave: vi.fn(),
}));

import * as io from '../../io/io';
import { newDoc, openDoc, saveDoc } from '../actions';

beforeEach(() => {
  vi.clearAllMocks();
  useDocumentStore.getState().reset();
});

describe('document actions', () => {
  it('newDoc clears the store to an untitled empty doc', () => {
    useDocumentStore.getState().open({ path: '/x.md', content: 'old' });
    newDoc();
    const s = useDocumentStore.getState();
    expect(s.path).toBeNull();
    expect(s.content).toBe('');
    expect(s.dirty).toBe(false);
  });

  it('openDoc shows dialog, reads file, populates store', async () => {
    (io.pickFileToOpen as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/a.md');
    (io.readFile as ReturnType<typeof vi.fn>).mockResolvedValue('# hi');
    await openDoc();
    const s = useDocumentStore.getState();
    expect(s.path).toBe('/tmp/a.md');
    expect(s.content).toBe('# hi');
    expect(s.dirty).toBe(false);
  });

  it('openDoc does nothing when dialog is cancelled', async () => {
    (io.pickFileToOpen as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await openDoc();
    expect(io.readFile).not.toHaveBeenCalled();
  });

  it('saveDoc writes to existing path when set', async () => {
    useDocumentStore.getState().open({ path: '/tmp/a.md', content: 'x' });
    useDocumentStore.getState().setContent('y');
    await saveDoc();
    expect(io.writeFile).toHaveBeenCalledWith('/tmp/a.md', 'y');
    expect(useDocumentStore.getState().dirty).toBe(false);
  });

  it('saveDoc shows save dialog when path is null, then writes', async () => {
    useDocumentStore.getState().setContent('hello');
    (io.pickFileToSave as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/new.md');
    await saveDoc();
    expect(io.writeFile).toHaveBeenCalledWith('/tmp/new.md', 'hello');
    expect(useDocumentStore.getState().path).toBe('/tmp/new.md');
    expect(useDocumentStore.getState().dirty).toBe(false);
  });

  it('saveDoc aborts when save dialog cancelled', async () => {
    useDocumentStore.getState().setContent('hello');
    (io.pickFileToSave as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await saveDoc();
    expect(io.writeFile).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2:** Run (should fail)

```bash
pnpm test -- --run actions
```

Expected: FAIL — module not found.

- [ ] **Step 3:** Implement actions

Create `/Users/kttrcdl/project/knot/src/state/actions.ts`:

```ts
import { useDocumentStore } from './document';
import { readFile, writeFile, pickFileToOpen, pickFileToSave } from '../io/io';

export function newDoc(): void {
  useDocumentStore.getState().reset();
}

export async function openDoc(): Promise<void> {
  const path = await pickFileToOpen();
  if (!path) return;
  const content = await readFile(path);
  useDocumentStore.getState().open({ path, content });
}

export async function saveDoc(): Promise<void> {
  const state = useDocumentStore.getState();
  let path = state.path;
  if (!path) {
    path = await pickFileToSave();
    if (!path) return;
  }
  await writeFile(path, state.content);
  useDocumentStore.setState({ path, dirty: false });
}
```

- [ ] **Step 4:** Run tests

```bash
pnpm test -- --run actions
```

Expected: PASS (all 6).

- [ ] **Step 5:** Commit

```bash
git add src/state/
git commit -m "feat(state): newDoc/openDoc/saveDoc actions with tests"
```

---

## Phase 5: Native menu bar

### Task 5.1: Define the native menu structure

**Files:**
- Create: `src-tauri/src/menu.rs`

- [ ] **Step 1:** Create menu module

Create `/Users/kttrcdl/project/knot/src-tauri/src/menu.rs`:

```rust
use tauri::menu::{Menu, MenuBuilder, MenuItem, SubmenuBuilder, PredefinedMenuItem};
use tauri::{AppHandle, Manager, Wry};

pub fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let new_file = MenuItem::with_id(app, "menu.file.new", "New", true, Some("CmdOrCtrl+N"))?;
    let open_file = MenuItem::with_id(app, "menu.file.open", "Open\u{2026}", true, Some("CmdOrCtrl+O"))?;
    let save_file = MenuItem::with_id(app, "menu.file.save", "Save", true, Some("CmdOrCtrl+S"))?;
    let save_as = MenuItem::with_id(app, "menu.file.save_as", "Save As\u{2026}", true, Some("CmdOrCtrl+Shift+S"))?;
    let close_window = PredefinedMenuItem::close_window(app, None)?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_file)
        .item(&open_file)
        .separator()
        .item(&save_file)
        .item(&save_as)
        .separator()
        .item(&close_window)
        .build()?;

    let app_menu = SubmenuBuilder::new(app, "KNOT")
        .about(None)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&MenuItem::with_id(app, "menu.view.toggle_theme", "Toggle Light/Dark", true, Some("CmdOrCtrl+Shift+L"))?)
        .separator()
        .fullscreen()
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu, &edit_menu, &view_menu])
        .build()?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle, id: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("menu", id);
    }
}
```

- [ ] **Step 2:** Wire menu in `lib.rs`

Edit `/Users/kttrcdl/project/knot/src-tauri/src/lib.rs`:

```rust
mod commands;
mod menu;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let menu = menu::build_menu(app.handle())?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            commands::fs::read_file,
            commands::fs::write_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3:** Build to verify

```bash
cd /Users/kttrcdl/project/knot
pnpm tauri build --no-bundle
```

Expected: builds. If you see "unused import" warnings, those are fine; clippy in CI will catch real issues.

- [ ] **Step 4:** Commit

```bash
git add src-tauri/
git commit -m "feat(tauri/menu): native macos menu bar with file + view menus"
```

---

### Task 5.2: Frontend menu event listener

**Files:**
- Create: `src/menu/menuEvents.ts`
- Create: `src/menu/__tests__/menuEvents.test.ts`

- [ ] **Step 1:** Write failing test

Create `/Users/kttrcdl/project/knot/src/menu/__tests__/menuEvents.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/event', () => {
  const listeners = new Map<string, (event: { payload: unknown }) => void>();
  return {
    listen: vi.fn((eventName: string, cb: (event: { payload: unknown }) => void) => {
      listeners.set(eventName, cb);
      return Promise.resolve(() => listeners.delete(eventName));
    }),
    __fire: (eventName: string, payload: unknown) => listeners.get(eventName)?.({ payload }),
  };
});

import * as event from '@tauri-apps/api/event';
import { registerMenuEvents, type MenuHandlers } from '../menuEvents';

describe('menu event dispatcher', () => {
  it('routes each menu id to its handler', async () => {
    const handlers: MenuHandlers = {
      'menu.file.new': vi.fn(),
      'menu.file.open': vi.fn(),
      'menu.file.save': vi.fn(),
      'menu.file.save_as': vi.fn(),
      'menu.view.toggle_theme': vi.fn(),
    };
    await registerMenuEvents(handlers);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event as any).__fire('menu', 'menu.file.open');
    expect(handlers['menu.file.open']).toHaveBeenCalledOnce();
  });

  it('ignores unknown menu ids', async () => {
    const handlers: MenuHandlers = { 'menu.file.new': vi.fn() };
    await registerMenuEvents(handlers);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => (event as any).__fire('menu', 'menu.unknown')).not.toThrow();
  });
});
```

- [ ] **Step 2:** Run (should fail)

```bash
pnpm test -- --run menuEvents
```

Expected: FAIL.

- [ ] **Step 3:** Implement

Create `/Users/kttrcdl/project/knot/src/menu/menuEvents.ts`:

```ts
import { listen } from '@tauri-apps/api/event';

export type MenuHandlers = Record<string, () => void | Promise<void>>;

export async function registerMenuEvents(handlers: MenuHandlers): Promise<() => void> {
  const unlisten = await listen<string>('menu', (event) => {
    const handler = handlers[event.payload];
    if (handler) void handler();
  });
  return unlisten;
}
```

- [ ] **Step 4:** Run tests

```bash
pnpm test -- --run menuEvents
```

Expected: PASS.

- [ ] **Step 5:** Commit

```bash
git add src/menu/
git commit -m "feat(menu): frontend menu event dispatcher with tests"
```

---

### Task 5.3: Wire menu events into App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1:** Update App.tsx

Replace `/Users/kttrcdl/project/knot/src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Editor } from './editor/Editor';
import { useDocumentStore } from './state/document';
import { newDoc, openDoc, saveDoc } from './state/actions';
import { registerMenuEvents } from './menu/menuEvents';
import { toggleTheme } from './styles/theme';
import styles from './App.module.css';

const WELCOME = `# Welcome to KNOT

KNOT is Not Only Typora. Start typing.`;

export default function App() {
  const { path, content, setContent, open } = useDocumentStore();
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    open({ path: '', content: WELCOME });
  }, [open]);

  useEffect(() => {
    const remountAndRun = async (fn: () => Promise<void> | void) => {
      await fn();
      setEditorKey((k) => k + 1);
    };
    const promise = registerMenuEvents({
      'menu.file.new': () => remountAndRun(newDoc),
      'menu.file.open': () => remountAndRun(openDoc),
      'menu.file.save': () => saveDoc(),
      'menu.file.save_as': async () => {
        useDocumentStore.setState({ path: null });
        await saveDoc();
      },
      'menu.view.toggle_theme': () => toggleTheme(),
    });
    return () => {
      void promise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.titlebar}>
        <span className={styles.title}>{path ? path.split('/').pop() : 'Untitled'}</span>
      </header>
      <Editor key={editorKey} initialContent={content} onChange={setContent} />
    </div>
  );
}
```

- [ ] **Step 2:** Update App.module.css

Replace `/Users/kttrcdl/project/knot/src/App.module.css`:

```css
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--knot-bg);
  color: var(--knot-fg);
}

.titlebar {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--knot-fg-muted);
  border-bottom: 1px solid var(--knot-border);
  -webkit-app-region: drag;
}

.title {
  font-family: var(--knot-font-ui);
}
```

(`toggleTheme` and the CSS variables are created in Phase 6 — Step 4 in this task will fail until Task 6.x lands. Run the next task immediately.)

- [ ] **Step 3:** Don't commit yet — wait for Phase 6 to finish so the build is clean.

---

## Phase 6: Theme + typography

### Task 6.1: Define design tokens

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/theme-light.css`
- Create: `src/styles/theme-dark.css`
- Create: `src/styles/typography.css`

- [ ] **Step 1:** Tokens (shared variables)

Create `/Users/kttrcdl/project/knot/src/styles/tokens.css`:

```css
:root {
  --knot-font-body: -apple-system, BlinkMacSystemFont, "SF Pro Text", Helvetica, Arial, sans-serif;
  --knot-font-mono: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  --knot-font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", Helvetica, Arial, sans-serif;
  --knot-radius: 6px;
  --knot-pad-h: 4rem;
  --knot-pad-v: 2rem;
  --knot-line-height: 1.7;
  --knot-font-size: 16px;
}
```

- [ ] **Step 2:** Light theme

Create `/Users/kttrcdl/project/knot/src/styles/theme-light.css`:

```css
:root,
:root[data-theme="light"] {
  color-scheme: light;
  --knot-bg: #ffffff;
  --knot-bg-elevated: #f7f7f7;
  --knot-fg: #1d1d1f;
  --knot-fg-muted: #6e6e73;
  --knot-border: #e5e5ea;
  --knot-accent: #0a84ff;
  --knot-selection: #b3d4fc;
  --knot-code-bg: #f5f5f7;
}
```

- [ ] **Step 3:** Dark theme

Create `/Users/kttrcdl/project/knot/src/styles/theme-dark.css`:

```css
:root[data-theme="dark"] {
  color-scheme: dark;
  --knot-bg: #1d1d1f;
  --knot-bg-elevated: #2c2c2e;
  --knot-fg: #f5f5f7;
  --knot-fg-muted: #98989d;
  --knot-border: #3a3a3c;
  --knot-accent: #0a84ff;
  --knot-selection: #2d4f7c;
  --knot-code-bg: #2c2c2e;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
    --knot-bg: #1d1d1f;
    --knot-bg-elevated: #2c2c2e;
    --knot-fg: #f5f5f7;
    --knot-fg-muted: #98989d;
    --knot-border: #3a3a3c;
    --knot-accent: #0a84ff;
    --knot-selection: #2d4f7c;
    --knot-code-bg: #2c2c2e;
  }
}
```

- [ ] **Step 4:** Typography

Create `/Users/kttrcdl/project/knot/src/styles/typography.css`:

```css
body {
  font-family: var(--knot-font-body);
  font-size: var(--knot-font-size);
  line-height: var(--knot-line-height);
  color: var(--knot-fg);
  background: var(--knot-bg);
  margin: 0;
}

.milkdown {
  font-family: var(--knot-font-body);
  font-size: var(--knot-font-size);
  line-height: var(--knot-line-height);
}

.milkdown h1 { font-size: 2.2em; font-weight: 700; margin: 1.2em 0 0.6em; }
.milkdown h2 { font-size: 1.6em; font-weight: 700; margin: 1.1em 0 0.5em; }
.milkdown h3 { font-size: 1.3em; font-weight: 600; margin: 1em 0 0.4em; }
.milkdown h4 { font-size: 1.1em; font-weight: 600; margin: 1em 0 0.3em; }
.milkdown p { margin: 0.6em 0; }
.milkdown code { font-family: var(--knot-font-mono); background: var(--knot-code-bg); padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.92em; }
.milkdown pre { background: var(--knot-code-bg); padding: 1em; border-radius: var(--knot-radius); overflow-x: auto; }
.milkdown blockquote { border-left: 3px solid var(--knot-border); padding-left: 1em; color: var(--knot-fg-muted); margin: 1em 0; }
.milkdown a { color: var(--knot-accent); text-decoration: none; }
.milkdown a:hover { text-decoration: underline; }
.milkdown ::selection { background: var(--knot-selection); }
```

- [ ] **Step 5:** Wire styles in `main.tsx`

Edit `/Users/kttrcdl/project/knot/src/main.tsx`. Replace any existing CSS imports with:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/theme-light.css';
import './styles/theme-dark.css';
import './styles/typography.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

(Delete `src/index.css` if it exists.)

---

### Task 6.2: Theme toggle logic + tests

**Files:**
- Create: `src/styles/theme.ts`
- Create: `src/styles/__tests__/theme.test.ts`

- [ ] **Step 1:** Failing test

Create `/Users/kttrcdl/project/knot/src/styles/__tests__/theme.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { toggleTheme, setTheme, getTheme } from '../theme';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
});

describe('theme', () => {
  it('defaults to system (no attribute)', () => {
    expect(getTheme()).toBe('system');
  });

  it('setTheme writes attribute and localStorage', () => {
    setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('knot.theme')).toBe('dark');
    expect(getTheme()).toBe('dark');
  });

  it('toggleTheme cycles system -> dark -> light -> system', () => {
    expect(getTheme()).toBe('system');
    toggleTheme();
    expect(getTheme()).toBe('dark');
    toggleTheme();
    expect(getTheme()).toBe('light');
    toggleTheme();
    expect(getTheme()).toBe('system');
  });
});
```

- [ ] **Step 2:** Run (should fail)

```bash
pnpm test -- --run theme
```

Expected: FAIL.

- [ ] **Step 3:** Implement

Create `/Users/kttrcdl/project/knot/src/styles/theme.ts`:

```ts
export type Theme = 'system' | 'light' | 'dark';

const KEY = 'knot.theme';
const CYCLE: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' };

export function getTheme(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme | null) ?? 'system';
}

export function setTheme(theme: Theme): void {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem(KEY);
  } else {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }
}

export function toggleTheme(): void {
  setTheme(CYCLE[getTheme()]);
}

export function restoreThemeFromStorage(): void {
  const stored = localStorage.getItem(KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') {
    document.documentElement.setAttribute('data-theme', stored);
  }
}
```

- [ ] **Step 4:** Restore on startup

Edit `/Users/kttrcdl/project/knot/src/main.tsx`. Add right before the `ReactDOM.createRoot(...)` call:

```tsx
import { restoreThemeFromStorage } from './styles/theme';
restoreThemeFromStorage();
```

- [ ] **Step 5:** Run tests

```bash
pnpm test -- --run theme
```

Expected: PASS (3 tests).

- [ ] **Step 6:** Smoke test the app

```bash
pnpm tauri dev
```

Manual check:
- App opens with system appearance.
- View → Toggle Light/Dark cycles correctly. Press Cmd+Q to close.

- [ ] **Step 7:** Commit

```bash
git add src/styles/ src/menu/ src/main.tsx src/App.tsx src/App.module.css
git commit -m "feat(theme): css-variable themes + toggle + cycle persistence"
```

---

## Phase 7: Release v0.0.1

### Task 7.1: Polish tauri.conf.json

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1:** Update the conf

Edit `/Users/kttrcdl/project/knot/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "KNOT",
  "version": "0.0.1",
  "identifier": "app.knot.editor",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "KNOT",
        "width": 1024,
        "height": 768,
        "minWidth": 600,
        "minHeight": 400,
        "decorations": true,
        "titleBarStyle": "Overlay"
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["dmg"],
    "category": "Productivity",
    "shortDescription": "KNOT is Not Only Typora — open-source Markdown editor for macOS.",
    "longDescription": "KNOT is an open-source, vibe-coded Markdown editor for macOS, inspired by Typora's single-pane live WYSIWYG experience.",
    "icon": [
      "icons/icon.icns",
      "icons/icon.png"
    ]
  }
}
```

- [ ] **Step 2:** Verify the icons exist (Tauri scaffold ships placeholders)

```bash
ls /Users/kttrcdl/project/knot/src-tauri/icons/
```

Expected: see `icon.icns`, `icon.png`, plus various size PNGs. If `icon.icns` is missing, leave as-is and use just `icon.png` in the bundle config.

---

### Task 7.2: Release workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1:** Write the release workflow

Create `/Users/kttrcdl/project/knot/.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: macos-14
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri
      - run: pnpm install --frozen-lockfile
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'KNOT ${{ github.ref_name }}'
          releaseBody: 'See CHANGELOG.md.'
          releaseDraft: true
          prerelease: true
```

Note: this builds **unsigned** binaries. Code signing + notarization is deferred to M5. For v0.0.1 we ship an unsigned `.dmg` and document the right-click → Open workaround in the release notes.

---

### Task 7.3: Smoke build the final release artifact locally

- [ ] **Step 1:** Full build

```bash
cd /Users/kttrcdl/project/knot
pnpm tauri build
```

Expected: a `.dmg` lands in `src-tauri/target/release/bundle/dmg/KNOT_0.0.1_aarch64.dmg` (or `_x64` on Intel Macs). Takes 2-5 minutes.

- [ ] **Step 2:** Open the dmg and run the app

```bash
open src-tauri/target/release/bundle/dmg/KNOT_0.0.1_aarch64.dmg
```

Manual verification checklist:
- [ ] App launches
- [ ] Welcome doc is rendered as a heading + paragraph
- [ ] File → New clears the document
- [ ] File → Open opens a file picker; selecting a `.md` file loads it
- [ ] File → Save writes to disk (verify by `cat`ing the file)
- [ ] View → Toggle Light/Dark cycles theme
- [ ] Cmd+Q quits

---

### Task 7.4: Tag and push v0.0.1

- [ ] **Step 1:** Commit release config

```bash
cd /Users/kttrcdl/project/knot
git add -A
git commit -m "release: v0.0.1 — m1 foundation"
```

- [ ] **Step 2:** Tag

```bash
git tag -a v0.0.1 -m "v0.0.1: foundation milestone — editor, file io, menu, theme"
```

- [ ] **Step 3:** Push

```bash
git push origin main
git push origin v0.0.1
```

Expected: Release workflow runs on GitHub Actions; a draft release with a `.dmg` attached appears at `https://github.com/KTTRCDL/knot/releases`.

- [ ] **Step 4:** Promote draft to public release

```bash
gh release edit v0.0.1 --draft=false --prerelease=true
```

---

## Acceptance criteria for M1

Before declaring M1 complete and moving to M2:

1. `pnpm test -- --run` passes 18+ unit tests across editor, state, io, menu, theme modules.
2. `cd src-tauri && cargo test` passes 4 fs unit tests.
3. `pnpm typecheck && pnpm lint` exit 0.
4. `cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings` exit 0.
5. CI on `main` is green.
6. A user can install the `.dmg` from the v0.0.1 GitHub release, open the app, edit a Markdown file, save it, and reopen it.
7. The release page on GitHub is published.

---

## Self-review notes (for the plan author)

- **Spec coverage check:** M1 in the spec lists "Tauri scaffold, Milkdown integrated, open/save/new, native menu bar, dark+light theme, basic typography." Every item is covered by a task.
- **No placeholders:** all code blocks contain runnable code. All commands have expected outputs.
- **Type consistency:** `DocumentState` interface matches usage in `actions.ts` and `App.tsx`. `MenuHandlers` map matches the IDs registered in `menu.rs` and consumed in `App.tsx`.
- **Dependency order:** Phase 1 needs scaffold (Phase 0). Phase 2 doesn't touch backend. Phase 3-4 add I/O. Phase 5 uses Phase 2 state. Phase 6 styles are loaded but the toggle action used in Phase 5's App.tsx requires Phase 6 to land before the App.tsx in 5.3 will compile — the plan flags this and expects the engineer to do 5.3 + 6 together before committing. A subagent executor should treat Phase 5 + Phase 6 as one bundle for the final commit.
- **Out of scope for M1 (deferred):** outline panel, file tree sidebar, find/replace, focus/typewriter modes, image paste, file watcher, drop-in CSS theme system, PDF/HTML export, Shiki, KaTeX, Mermaid. These belong to M2-M5.
