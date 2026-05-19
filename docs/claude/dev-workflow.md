# Claude Code Dev Workflow on `dev_kttrcdl_Claude_Code`

Step-by-step for a Claude Code session opening this branch.

## Onboarding (first 5 minutes of a new session)

```text
1. Read CLAUDE.md at repo root.
2. Read docs/dev-logs/HANDOFF.md to find current state.
3. Read the latest spec in docs/superpowers/specs/.
4. Read the latest plan in docs/superpowers/plans/.
5. Read docs/claude/manager-pattern.md.
6. Confirm tools enabled match docs/claude/safe-tools.md.
7. Set up tmux session if not already running:
     tmux new-session -d -s knot -n manager
8. Report to the user: "Loaded project context. Latest milestone is <M?>, last commit <sha>. Ready to continue or start something new — what's the priority?"
```

## Starting a new milestone (e.g., M2)

```text
1. User says: "Let's start M2 — renderers."
2. Invoke superpowers:writing-plans to produce docs/superpowers/plans/<date>-knot-m2-renderers.md.
3. Self-review the plan (placeholder scan, internal consistency, type consistency).
4. Show the user the plan path, wait for approval.
5. Create TaskCreate per phase.
6. Invoke superpowers:subagent-driven-development.
7. Dispatch first implementer (Phase 1 of M2) with full task text.
```

## Per-phase execution

```text
1. Dispatch implementer subagent. Wait for DONE.
2. Dispatch /simplify subagent on the implementer's diff. Wait for DONE.
3. Dispatch spec compliance reviewer subagent. If ❌, dispatch fix implementer; re-review.
4. Once spec ✅, dispatch code quality reviewer subagent. If Critical/Important issues, dispatch fix implementer; re-review.
5. Once both ✅, manager:
   a. Commits any pending doc updates (HANDOFF.md, dev-logs/M<n>/).
   b. Pushes origin dev_kttrcdl_Claude_Code.
   c. Marks the phase task complete.
6. Move to next phase.
```

## End of milestone (e.g., end of M2)

```text
1. Update docs/dev-logs/HANDOFF.md with milestone summary.
2. Update docs/superpowers/specs/ if the spec evolved during the milestone.
3. Update CHANGELOG.md (Unreleased section).
4. Open the "merge to dev" PR:
     ./scripts/prepare-pr.sh dev
     gh pr create --base dev --head dev_kttrcdl_Claude_Code--for-dev \
       --title "release: v0.0.X — <milestone summary>" \
       --body "$(cat <<'EOF'
       Milestone X summary.

       - Added: ...
       - Fixed: ...
       - Tests: X passing.
       EOF
       )"
5. Wait for CI (scaffold-check + ci).
6. Once green, you (manager) request human (kttrcdl) to review and squash-merge.
7. Once on dev, user opens dev → main PR for the release.
8. After v0.0.X tag pushed, the Release workflow uploads the new .dmg.
```

## Recovering from a stuck subagent

If a subagent reports BLOCKED:

1. Read the report carefully — what specifically is stuck?
2. Determine root cause:
   - Missing context (provide it, re-dispatch same model).
   - Task too big (split it).
   - Plan flaw (escalate to the user; revise plan).
   - Model not capable enough (re-dispatch with `model: "opus"` parameter).
3. Never blindly retry without addressing the underlying issue.

## Recovering from a context overflow (manager-side)

If your own context starts hitting limits:

1. Save current state to `docs/dev-logs/HANDOFF.md` (this is the persistence layer).
2. Commit + push the HANDOFF update.
3. Inform user: "Approaching context limit. Will save state and continue in a fresh session — that session reads HANDOFF.md to resume."
4. End the session.
5. New session: reads CLAUDE.md → HANDOFF.md → resumes from where you left off.
