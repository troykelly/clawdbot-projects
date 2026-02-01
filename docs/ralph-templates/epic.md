# Ralph Template: Epic (Multiple Related Issues)

Use this template for autonomous work on an epic - a group of related issues that form a cohesive feature.

## Command

```bash
/ralph-loop "
## Epic: <EPIC TITLE>

### Overview
<What this epic delivers, why it matters>

### Issues in Scope
1. #<ISSUE1> - <Title> (do first)
2. #<ISSUE2> - <Title> (depends on #<ISSUE1>)
3. #<ISSUE3> - <Title> (can parallel with #<ISSUE2>)

### Process

Follow CODING.md without exception.

For EACH issue in order:

#### Phase: Issue Work
1. Read issue for full acceptance criteria
2. Create branch \`issue/<number>-<slug>\`
3. Implement with TDD (tests first, real services)
4. Update issue with progress as you work
5. Commit atomically: \`[#<number>] description\`
6. Local validation: typecheck, lint, test, build
7. Create PR with clear description
8. Self-review (security + blind spots)
9. Monitor CI until green
10. Merge and update issue

#### Between Issues
- Fetch latest main
- Create new branch for next issue
- Reference previous work in issue comments

### Constraints
- Complete issues in dependency order
- Each issue gets its own branch and PR
- Never batch multiple issues into one PR
- Update each issue independently

### Completion

Output <promise>EPIC COMPLETE</promise> when:
- ALL listed issues are merged to main
- ALL acceptance criteria verified
- ALL issues updated with completion status
- Main branch is stable (CI green)
" --completion-promise "EPIC COMPLETE" --max-iterations 100
```

## Customization

Replace:

- `<EPIC TITLE>` - Descriptive epic name
- `<ISSUE1>`, `<ISSUE2>`, etc. - Issue numbers in dependency order
- Add/remove issues as needed

## Notes

- Higher `--max-iterations` needed (100+ for 3-5 issues)
- Order issues by dependencies
- Each issue = separate branch + PR (never combine)
- Epic may span multiple hours of autonomous work
