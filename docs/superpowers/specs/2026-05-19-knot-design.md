# KNOT — Design Spec

> **KNOT** is **N**ot **O**nly **T**ypora — an open-source, vibe-coded Markdown editor for macOS.

| Field | Value |
|---|---|
| Date | 2026-05-19 |
| Status | Draft v1 (pre-implementation) |
| Owner | @kttrcdl |
| License | MIT |
| Primary platform | macOS (Apple Silicon first; Intel best-effort) |
| Repository | `github.com/kttrcdl/knot` (public, to be created) |

---

## 1. Vision

KNOT is an open-source, native-feeling Markdown editor for macOS that captures the **single-pane live WYSIWYG experience** of Typora, ships with **drop-in CSS themes** and the **full GFM feature set** (math, diagrams, tables, code, task lists, footnotes), and is delivered as a **small, fast, modern app** (Tauri 2 + Milkdown). The "Not Only Typora" framing means: parity with Typora's beloved features, plus the open-source extensibility users have asked for (themes as code, plugin-friendly architecture, modern stack).

This document is the design baseline. The implementation plan (milestones, tickets, code structure) is generated from this spec by the writing-plans skill.

---

## 2. Goals and Non-Goals

### Goals (v0.x — what we WILL ship)

- **Typora-feel editing**: single-pane live WYSIWYG. Inline markers (`**bold**`, `_italic_`, ``` `code` ```) fade out when the cursor leaves the run. Block markers (`###`, `- [ ]`, `>`) fade out when the line is committed and the cursor moves off.
- **One-keystroke source-mode toggle** (Cmd+/). Preserves scroll and caret position.
- **Direct file-system editing**: open a `.md` file, edit, Cmd+S writes back. No vault, no database, no proprietary container.
- **Full GFM rendering**: tables (with mouse-resize), fenced code blocks (Shiki syntax highlighting), task lists, footnotes, strikethrough, autolinks, YAML front matter.
- **Math**: KaTeX. Inline `$...$` and block `$$...$$`.
- **Diagrams**: Mermaid embedded in code fences.
- **File tree sidebar** + **outline panel** (auto-generated from headings).
- **Focus mode** (blur non-current paragraphs) and **typewriter mode** (caret pinned to viewport center).
- **CSS themes**: drop a `.css` file into `~/Library/Application Support/knot/themes/`; it appears in the theme menu. Hot reload on save. Ships with a polished dark + light pair.
- **Export**: PDF (via Chromium print) and HTML.
- **Auto-save**, **find/replace**, **word count**, **recent files**, **external-edit reload** (file watcher).
- **Image paste/drag** with configurable "copy to folder" behavior.
- **Native macOS feel**: real menu bar (File/Edit/View/Format/Paragraph/Themes/Help), keyboard shortcuts that feel macOS-ish, drag-and-drop, traffic-light window controls, Apple Silicon native binary.

### Non-Goals (NOT in v0.x)

- **Typst support.** Dropped from scope for v0.x. If reintroduced, it becomes a separate project or a v1+ extension.
- **Cloud sync, vault databases, graph view.** KNOT edits plain files on disk.
- **Real-time collaboration.**
- **Mobile (iOS/iPadOS/Android).** Tauri supports it eventually; not in scope.
- **Windows/Linux.** Tauri makes future ports cheap, but v0.x is macOS-only. We will not regress macOS UX to chase cross-platform parity.
- **Plugin SDK.** Themes are the only extension surface for v0.x. A formal plugin API may come post-1.0.
- **Pandoc-driven exports (DOCX/EPUB/LaTeX).** Deferred to post-v0.x.
- **Vim/Emacs keybindings.** Deferred — would need a source-mode editor (CodeMirror 6) layered in.
- **Spell-check.** Deferred to post-v0.x.

---

## 3. Target Users

1. **Writers and researchers** who want a Typora-like experience but on open-source software, with the ability to inspect and modify the code.
2. **Developers and technical writers** producing docs with math, code, and diagrams.
3. **Mac-first users** who care about native feel, small bundle size, and battery life — i.e., people who already prefer apps like Bear, Things, or Linear's macOS app over Electron-heavy alternatives.

---

## 4. Feature Inventory (v0.1 Target — Full Parity MVP)

The user has chosen a full-feature-parity MVP. v0.1 is therefore broken into five sequential milestones, **each shipping a working, releasable app**. After M5, KNOT covers the Typora "must-have" feature set.

| ID | Milestone | Ships |
|---|---|---|
| M1 | Foundation | Tauri 2 scaffold, Milkdown integrated, open/save/new, native menu bar, dark+light theme, basic typography |
| M2 | Renderers | KaTeX math, Mermaid diagrams, Shiki code blocks, GFM tables (with mouse-resize), task lists, footnotes, YAML front matter |
| M3 | Editor UX | Source-mode toggle (Cmd+/), find/replace, word count, focus mode, typewriter mode, image paste/drag |
| M4 | App-feel | File tree sidebar, outline panel, recent files, auto-save, external-edit file watcher, drop-in CSS theme system with hot-reload |
| M5 | Export | PDF export (Chromium print), HTML export, polished release `.dmg` with notarization |

Each milestone ends with a tagged release on GitHub. M5 = `v0.1.0`.

---

## 5. Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                Tauri Frontend (WKWebView, React + TS)                 │
│  ┌────────────┐ ┌──────────────────────────┐ ┌──────────────────┐   │
│  │ Sidebar    │ │   Editor Surface          │ │ Right Panel      │   │
│  │ (file tree)│ │   ┌─ Milkdown WYSIWYG ─┐ │ │ (outline +       │   │
│  │ + search   │ │   │   ProseMirror      │ │ │  word count)     │   │
│  │            │ │   │   + remark/unified │ │ │                  │   │
│  │            │ │   │   + KaTeX          │ │ │                  │   │
│  │            │ │   │   + Mermaid        │ │ │                  │   │
│  │            │ │   │   + Shiki          │ │ │                  │   │
│  │            │ │   └────────────────────┘ │ │                  │   │
│  │            │ │   (Cmd+/ swaps to        │ │                  │   │
│  │            │ │    source-text textarea) │ │                  │   │
│  └────────────┘ └──────────────────────────┘ └──────────────────┘   │
│         ▲                  ▲                                          │
│         │ tauri::invoke    │ tauri::invoke                            │
│         ▼                  ▼                                          │
├──────────────────────────────────────────────────────────────────────┤
│                  Tauri Rust Backend                                   │
│  fs_read   fs_write   fs_watch (notify crate)   recent_files          │
│  theme_load   theme_watch    export_pdf (webview print)               │
│  export_html (comrak->HTML)  file_dialog        window/menu mgmt      │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.1 Frontend modules (TypeScript, React)

| Module | Responsibility |
|---|---|
| `app/` | Top-level shell: layout, panes, command palette, keyboard routing |
| `editor/` | Milkdown integration, plugin wiring, schema customization |
| `editor/plugins/` | Math (KaTeX), diagrams (Mermaid), code (Shiki), tables, task lists, footnotes, image paste |
| `source-mode/` | Plain `<textarea>` (or CodeMirror 6 later) with two-way bridge to Milkdown's Markdown serialization |
| `sidebar/` | File tree, file search, recent files |
| `outline/` | Heading-derived outline, word count, scroll-spy |
| `themes/` | Theme loader, hot-reload, theme menu |
| `commands/` | Command palette + keyboard shortcuts table |
| `io/` | Wraps `invoke()` calls to the Rust backend (open, save, watch, etc.) |
| `state/` | Zustand store: open file, dirty flag, recent files, settings, theme, view mode |

### 5.2 Backend modules (Rust)

| Module | Responsibility |
|---|---|
| `commands::fs` | `read_file`, `write_file`, `list_dir`, `move_to_trash` |
| `commands::watch` | File-watcher subscription using the `notify` crate, emits events via Tauri events channel |
| `commands::theme` | Read theme CSS files from app-support dir, watch for changes |
| `commands::export` | PDF (via webview `printToPDF`), HTML (via `comrak`) |
| `commands::dialog` | File-open / save / folder-pick dialogs |
| `menu` | Native menu bar definition and click routing |
| `lib.rs` | Tauri app bootstrap, plugin setup |

### 5.3 Data flow — opening a file

```
[User: File → Open]
    → frontend dispatches `open_file_dialog` command
    → Rust backend opens native dialog, returns selected path
    → frontend dispatches `fs_read(path)` command
    → Rust returns file contents + metadata (mtime)
    → frontend sets editor content via Milkdown's `set` API
    → frontend dispatches `watch_path(path)` command
    → Rust subscribes via `notify`, emits `file_changed` events
    → frontend listens and prompts user to reload if external change detected
```

### 5.4 Data flow — saving a file

```
[User edits → debounced 500ms autosave OR Cmd+S]
    → frontend reads Markdown via Milkdown's `getMarkdown()` (remark serializer)
    → frontend dispatches `fs_write(path, content)` command
    → Rust writes atomically (temp file + rename)
    → frontend clears dirty flag, updates mtime
```

### 5.5 Theme system

Themes are plain CSS files. KNOT exposes a documented set of CSS custom properties and selector hooks (`--knot-bg`, `--knot-fg`, `--knot-accent`, `--knot-mono-font`, `.knot-h1`, `.knot-blockquote`, etc.).

- Built-in themes live in `src/themes/` and are bundled.
- User themes live in `~/Library/Application Support/knot/themes/*.css`.
- The backend `notify`-watches that folder; new/modified files appear in the Themes menu and can hot-reload.

---

## 6. Tech Stack (Locked Choices)

| Layer | Choice | Why |
|---|---|---|
| App framework | **Tauri 2.x** | Small bundle (~5–10 MB vs Electron's 100+ MB), Rust backend, momentum (every new Typora-clone in 2025–2026 uses Tauri), good macOS UX via WKWebView. |
| Frontend lang | **TypeScript** | Industry standard; Milkdown has first-class TS types. |
| Frontend framework | **React 18 + Vite** | Best ecosystem fit for Milkdown's `@milkdown/react` package; Vite is the de-facto fast dev server. |
| UI styling | **CSS modules** + a small design-token layer | Themes need plain CSS to be drop-in modifiable. No CSS-in-JS that would obfuscate the theme contract. |
| Editor engine | **Milkdown** (ProseMirror + remark) | Built explicitly for Typora-style WYSIWYG. Markdown is the canonical state, so round-trip is by design, not bolted on. |
| Markdown parser | **remark/unified** (inside Milkdown frontend); **comrak** in Rust for export | remark for live edit, comrak for fast Rust-side conversions. |
| Math | **KaTeX** | Smaller, faster, Typora-equivalent. |
| Diagrams | **Mermaid** | De-facto standard, GitHub renders it. |
| Syntax highlight | **Shiki** | VS Code–grade TextMate grammars; quality differentiator. |
| State management | **Zustand** | Tiny, simple, works well with React + Tauri events. |
| File watching | **`notify` crate** (Rust) | Standard, cross-platform, integrates cleanly with Tauri events. |
| Tests (frontend) | **Vitest** + **React Testing Library** | Fast, Vite-native. |
| Tests (Rust) | **cargo test** + **insta** for snapshot | Standard Rust tooling. |
| E2E tests | **WebDriverIO + tauri-driver** | Tauri's recommended E2E pipeline. |
| CI | **GitHub Actions** | Free for public repos; macOS runners. |
| Linting | **ESLint + Prettier** (TS), **rustfmt + clippy** (Rust) | Standard. |
| Distribution | `.dmg` via `tauri-action`, **Apple Developer notarization** | Required for friction-free macOS install. |

### Why not these alternatives?

- **Electron.** 10–20× larger bundle, much higher RAM. No advantage for us — we don't need Chromium-specific features.
- **Native SwiftUI / AppKit.** Best macOS UX, but: (a) we'd reimplement what Milkdown gives us free; (b) closes off any future cross-platform path; (c) requires Swift skills.
- **CodeMirror 6 with decorations.** Cleaner round-trip semantics, but doesn't give the "cursor inside rendered DOM" feel that defines Typora. We may add CodeMirror 6 *for the source-mode pane* later — it's a complementary tool, not a replacement for Milkdown.
- **Lexical, Tiptap, raw ProseMirror.** Milkdown is purpose-built for this. Tiptap treats Markdown as a feature, not the core model. Raw ProseMirror is reinventing Milkdown.

---

## 7. UX Principles

1. **Single-pane illusion always.** No side-by-side preview is ever shown by default. Source mode is a *replacement* of the WYSIWYG pane, not a sibling.
2. **Zero default chrome.** No toolbars unless the user opts in. Menu bar carries all functionality. Status bar at bottom shows word count and current mode.
3. **Keyboard-first.** Every command has a shortcut; every shortcut shows in the menu.
4. **Native macOS behavior.** Cmd+W closes a window, Cmd+Q quits, full-screen via traffic light, dark mode follows system, sandbox-friendly file pickers.
5. **Themes are first-class.** Theme switching takes one click; user themes appear immediately on file drop.
6. **No surprises with files.** What's on disk equals what's in the editor. External-edit detection prompts; never silently overwrites.

---

## 8. Risks and Open Questions

| Risk | Mitigation |
|---|---|
| Milkdown plugin API churn | Pin a known-good version; vendor critical plugins if needed; track upstream releases. |
| WKWebView macOS rendering quirks (selection lag with very large documents) | Load-test with 100+ KB Markdown files in M1 before locking the architecture. Document max-supported doc size. |
| Mermaid rendering performance with many diagrams in one doc | Render lazily on scroll; debounce edits. |
| Native menu bar tedium | Use Tauri's `menu` builder pattern; build once in `menu.rs`. |
| Theme CSS contract instability (themes break across versions) | Document the CSS variable/selector contract in `THEMES.md` from M4 onwards; treat it as a public API. |
| Apple Developer ID setup friction | Document the notarization steps; provide an unsigned-build path for contributors. |
| Bundle Shiki language WASM size | Lazy-load grammars on first use rather than bundling all 100+ upfront. |
| PDF export fidelity vs editor view | Use the same CSS at print-time; provide a "print preview" option in v0.2. |

### Open questions (decide during M1)

- **Source-mode editor**: plain `<textarea>` for v0.1, or CodeMirror 6 with markdown mode? Recommendation: start with textarea, swap to CM6 in M3 if textarea feels too primitive.
- **Where the state lives**: editor content is canonical only in Milkdown's ProseMirror state, with debounced serialization to Markdown for save. Decide if we keep a parallel Markdown string in Zustand for source-mode round-trips.
- **Image paste destination**: per-file folder (e.g., `notename.assets/`) vs global media folder vs ask-each-time. Default: per-file folder, configurable.

---

## 9. Repository and Development Practices

### Repo layout (proposed)

```
knot/
├── src/                       # Frontend (React + TS)
│   ├── app/
│   ├── editor/
│   ├── sidebar/
│   ├── outline/
│   ├── themes/
│   ├── commands/
│   ├── io/
│   ├── state/
│   └── main.tsx
├── src-tauri/                 # Rust backend (Tauri convention)
│   ├── src/
│   │   ├── commands/
│   │   ├── menu.rs
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── themes/                    # bundled CSS themes (copied to app resources at build)
│   ├── knot-light.css
│   └── knot-dark.css
├── docs/
│   ├── superpowers/specs/     # design specs (this file)
│   ├── ARCHITECTURE.md
│   ├── THEMES.md              # theme author guide
│   └── CONTRIBUTING.md
├── .github/
│   └── workflows/
│       ├── ci.yml             # build + lint + test
│       └── release.yml        # tag → notarized .dmg
├── LICENSE                    # MIT
├── README.md
├── package.json
├── pnpm-lock.yaml
└── vite.config.ts
```

### Dev practices

- **Branching**: trunk-based on `main`. Feature work in short-lived branches; PRs to `main`. No long-lived `develop`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- **PRs**: each PR ships a vertical slice. Linked to a milestone (M1–M5).
- **Releases**: each milestone tagged `v0.0.M`; v0.1.0 lands at M5.
- **CI on every PR**: typecheck, lint, unit tests, Rust check, Rust tests, Tauri build for macOS (Apple Silicon).
- **Release CI on tag push**: build, notarize, publish `.dmg` to GitHub Releases.
- **Code review**: solo developer, but PRs still go through self-review with a checklist (typecheck pass, tests added, screenshots if UI).

### Init checklist (to run after this spec is approved)

1. `pnpm create tauri-app knot` → React + TS + Vite template
2. `cd knot && git init && git add . && git commit -m "chore: initial tauri scaffold"`
3. `gh repo create knot --public --source=. --push --description "KNOT is Not Only Typora — open-source Markdown editor for macOS"`
4. Add `LICENSE` (MIT), `README.md`, `.github/workflows/ci.yml`
5. Configure branch protection on `main` (require CI to pass)
6. Open GitHub Project board with the M1–M5 milestones

---

## 10. Beyond v0.1

These are explicitly NOT in v0.1 but on the table for later:

- **v0.2**: Pandoc-driven export (DOCX, EPUB, LaTeX). Vim mode in source pane (CodeMirror 6 + `@codemirror/vim`). Spell-check via macOS native spell-check API. Tabs and multi-window.
- **v0.3**: Plugin SDK (themes already exist; plugins extend the editor). Global folder search. Wiki-style `[[links]]` (opt-in).
- **v0.4**: Cross-platform (Windows + Linux) once macOS UX is polished.
- **v1.0**: Stable theme/plugin API; first major release.
- **Far future**: Typst mode reintroduction as a separate companion app `knot-typst` or as a plugin. Tinymist LSP integration. Real-time collab via CRDTs (would change the data model — careful consideration needed).

---

## 11. Success Criteria for v0.1

- A user can open KNOT, type Markdown, and see it render live in a single pane — without ever seeing raw `**` or `##` characters when the cursor is elsewhere.
- The app feels native on macOS: real menu bar, dark mode follows system, traffic lights work, app size on disk is under 30 MB, cold start is under 1 second on Apple Silicon.
- A user can drop a CSS file into the themes folder and see it in the Themes menu within 2 seconds.
- A user can export a document of 5,000 words with math, code, and a Mermaid diagram to PDF in under 5 seconds, and the PDF looks polished.
- The repo has > 5 unrelated contributors making PRs within 3 months of v0.1 release (ambition target).
