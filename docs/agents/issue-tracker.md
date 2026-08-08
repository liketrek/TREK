# Issue tracker: GitHub

Issues and specs for this repository live in GitHub Issues at `mnlauaa/TREK`. Use the `gh` CLI for all operations. Run commands inside this clone or pass `--repo mnlauaa/TREK` explicitly.

## Conventions

- **Create:** `gh issue create --title "..." --body "..."`
- **Read:** `gh issue view <number> --comments`
- **List:** `gh issue list --state open --json number,title,body,labels,comments`
- **Comment:** `gh issue comment <number> --body "..."`
- **Label:** `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- **Close:** `gh issue close <number> --comment "..."`

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares one number space across issues and pull requests. Resolve an ambiguous `#42` with `gh pr view 42`, then fall back to `gh issue view 42`.

## Skill operations

When a skill says to publish to the issue tracker, create a GitHub issue. When it says to fetch the relevant ticket, run `gh issue view <number> --comments`.

## Wayfinding operations

A wayfinding map is an issue labelled `wayfinder:map`; its child issues are the tickets.

- Label children by type: `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`.
- Link children using GitHub sub-issues. If unavailable, add them to a task list in the map and begin each child with `Part of #<map>`.
- Represent blockers with GitHub issue dependencies. If unavailable, begin the child with `Blocked by: #<number>`.
- The next frontier ticket is the first open, unassigned child without open blockers.
- Claim a ticket with `gh issue edit <number> --add-assignee @me`.
- Resolve it by posting the answer, closing the child, and adding its decision pointer to the map.
