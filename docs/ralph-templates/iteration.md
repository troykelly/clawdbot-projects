# Ralph Template: Iteration (Large Initiative)

Use this template for autonomous work on an iteration - a large initiative spanning multiple epics or a significant body of work.

## Command

```bash
/ralph-loop "
## Iteration: <ITERATION NAME>

### Goal
<High-level objective for this iteration>

### Scope

#### Epic 1: <Epic Name>
- #<ISSUE1> - <Title>
- #<ISSUE2> - <Title>

#### Epic 2: <Epic Name>
- #<ISSUE3> - <Title>
- #<ISSUE4> - <Title>

#### Standalone Issues
- #<ISSUE5> - <Title>

### Process

Follow CODING.md without exception.

#### For Each Issue:
1. Read issue for acceptance criteria
2. Branch: \`issue/<number>-<slug>\`
3. TDD: failing tests first, then implement
4. Real services: PostgreSQL/Redis in devcontainer
5. Commits: \`[#<number>] description\`
6. Issue updates: progress at milestones
7. Local validation: typecheck, lint, test, build
8. PR with description
9. Self-review: security + blind spots
10. CI green, then merge

#### Between Issues:
- git fetch && git checkout main && git pull
- Verify main is stable before next issue

#### Progress Tracking:
After completing each issue, summarize:
- Issues completed: X/Y
- Current epic progress
- Any blockers encountered

### Constraints
- One issue = one branch = one PR
- Complete epics in order when dependencies exist
- Parallelize only when explicitly safe
- Never skip issue updates

### Completion

Output <promise>ITERATION COMPLETE</promise> when:
- ALL issues in scope are merged
- ALL acceptance criteria verified
- ALL issues updated with final status
- Main branch stable and CI green
- No open blockers or deferred work
" --completion-promise "ITERATION COMPLETE" --max-iterations 200
```

## Customization

Replace:

- `<ITERATION NAME>` - Sprint/iteration identifier
- Epic groupings - Organize by feature area
- Issue list - All issues in scope

## Notes

- Very high `--max-iterations` (200+) for large iterations
- May run for extended periods (hours)
- Monitor periodically: `grep '^iteration:' .claude/ralph-loop.local.md`
- Can `/cancel-ralph` and resume later with remaining issues
- Consider breaking into smaller epics if iteration is too large
