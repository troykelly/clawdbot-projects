# Ralph Template: Single Issue

Use this template for autonomous work on a single GitHub issue.

## Command

```bash
/ralph-loop:ralph-loop "
## Issue: #<NUMBER> - <TITLE>

### Context
<Brief background, why this issue exists, any constraints>

### Acceptance Criteria
<Copy directly from the GitHub issue>
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Process

Follow CODING.md without exception.

1. **Branch**: Create \`issue/<NUMBER>-<slug>\` from main
2. **TDD**: Write failing tests first, then implement
3. **Real services**: Test against PostgreSQL/Redis in devcontainer
4. **Commits**: Atomic, tested, format: \`[#<NUMBER>] description\`
5. **Issue updates**: Post progress after each milestone (not at end)

Local validation before PR:
- \`pnpm typecheck\`
- \`pnpm lint\`
- \`pnpm test\`
- \`pnpm build\`

6. **PR**: Create with clear description
7. **Self-review**: Security + blind spot review
8. **CI**: Monitor until green, fix any failures
9. **Merge**: After CI green and review complete

### Completion

Output <promise>ISSUE <NUMBER> COMPLETE</promise> when:
- All acceptance criteria verified and checked off
- All tests passing locally
- CI green
- Issue updated with completion status
- PR merged to main
" --completion-promise "ISSUE <NUMBER> COMPLETE" --max-iterations 50
```

## Customization

Replace:

- `<NUMBER>` - GitHub issue number
- `<TITLE>` - Issue title
- `<slug>` - Short branch name descriptor
- Acceptance criteria - Copy from issue

## Notes

- Adjust `--max-iterations` based on complexity (30-100 typical)
- For database changes, add `pnpm db:reset && pnpm db:migrate && pnpm db:seed` to validation
- For API changes, add runtime testing step
