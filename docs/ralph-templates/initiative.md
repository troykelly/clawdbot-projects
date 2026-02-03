# Ralph Template: Initiative (Strategic Multi-Phase Work)

Use this template for autonomous work on an initiative - a strategic goal spanning multiple iterations or phases, typically representing a significant product capability.

## Command

```bash
/ralph-loop:ralph-loop "
## Initiative: <INITIATIVE NAME>

### Strategic Goal
<Business objective this initiative achieves, success metrics>

### Phases

#### Phase 1: <Phase Name> (Foundation)
**Iteration 1.1: <Name>**
- Epic: <Epic Name>
  - #<ISSUE1> - <Title>
  - #<ISSUE2> - <Title>
- Standalone: #<ISSUE3> - <Title>

**Iteration 1.2: <Name>**
- Epic: <Epic Name>
  - #<ISSUE4> - <Title>
  - #<ISSUE5> - <Title>

#### Phase 2: <Phase Name> (Enhancement)
**Iteration 2.1: <Name>**
- Epic: <Epic Name>
  - #<ISSUE6> - <Title>
  - #<ISSUE7> - <Title>

### Process

Follow CODING.md without exception.

#### For Each Issue:
1. Read issue for acceptance criteria
2. Branch: \`feature/<number>-<slug>\`
3. TDD: failing tests first, then implement
4. Real services: PostgreSQL/Redis in devcontainer
5. Commits: \`[#<number>] description\`
6. Issue updates: progress at milestones
7. Local validation: typecheck, lint, test, build
8. PR with description
9. Self-review: security + blind spots
10. CI green, then merge

#### Between Issues:
- git fetch origin main && git rebase origin/main
- Verify main is stable before next issue (check CI status)

#### Phase Transitions:
After completing each phase:
1. Verify all phase objectives met
2. Document any technical debt incurred
3. Confirm readiness for next phase
4. Update initiative tracking issue with phase summary

#### Progress Tracking:
After each iteration, report:
- Phase: X of Y
- Iteration: X.Y
- Issues completed: N/M in current iteration
- Overall progress: total issues completed / total issues
- Blockers or risks identified

### Constraints
- One issue = one branch = one PR
- Complete phases in order (phases have dependencies)
- Iterations within a phase may parallelize if independent
- Never skip issue updates or phase summaries
- Escalate blockers that affect strategic timeline

### Completion

Output <promise>INITIATIVE COMPLETE</promise> when:
- ALL phases completed
- ALL iterations within phases completed
- ALL issues merged to main
- ALL acceptance criteria verified
- ALL issues updated with final status
- Main branch stable and CI green
- Initiative tracking issue updated with final summary
- No critical technical debt deferred
" --completion-promise "INITIATIVE COMPLETE" --max-iterations 500
```

## Customization

Replace:

- `<INITIATIVE NAME>` - Strategic capability being delivered
- Phase structure - Organize by delivery milestones
- Iterations - Group related work within phases
- Issue list - All issues in scope

## Notes

- Very high `--max-iterations` (500+) for initiatives
- May run for extended periods (many hours to days)
- Monitor periodically: `grep '^iteration:' .claude/ralph-loop.local.md`
- Can `/ralph-loop:cancel-ralph` and resume with remaining work
- Consider creating a GitHub tracking issue for the initiative itself
- Phase boundaries are natural checkpoints for `/ralph-loop:cancel-ralph`

## When to Use Initiative vs Iteration

| Scope                               | Template      | Typical Duration |
| ----------------------------------- | ------------- | ---------------- |
| 1 issue                             | issue.md      | Hours            |
| 3-5 related issues                  | epic.md       | Half day         |
| Multiple epics (sprint-sized)       | iteration.md  | Day              |
| Strategic capability (multi-sprint) | initiative.md | Multiple days    |

## Example

```bash
/ralph-loop:ralph-loop "
## Initiative: Multi-Currency Support

### Strategic Goal
Enable users to manage budgets in multiple currencies with real-time exchange rates.
Success: Users can create budgets in 10+ currencies with daily rate updates.

### Phases

#### Phase 1: Foundation
**Iteration 1.1: Currency Infrastructure**
- Epic: Exchange Rate System
  - #201 - Add currency table and seed data
  - #202 - Integrate exchange rate API
  - #203 - Create rate caching layer

**Iteration 1.2: Data Model Updates**
- Epic: Multi-Currency Schema
  - #204 - Add currency field to budgets
  - #205 - Add currency field to transactions
  - #206 - Migration for existing data

#### Phase 2: User Experience
**Iteration 2.1: Currency Selection**
- Epic: Currency UI
  - #207 - Currency picker component
  - #208 - Budget creation with currency
  - #209 - Transaction entry with currency

**Iteration 2.2: Conversion Display**
- Epic: Rate Display
  - #210 - Show converted totals
  - #211 - Historical rate viewing
  - #212 - Rate alerts

### Process
...
" --completion-promise "INITIATIVE COMPLETE" --max-iterations 500
```
