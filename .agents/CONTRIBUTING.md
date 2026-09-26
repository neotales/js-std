# How this repo writes issues, labels, commits, and pull requests

Several people and several coding agents work in this repo. These conventions exist so
the backlog stays readable and a commit message says the same thing as its label.

## Issues

An issue has two audiences. Someone deciding what to work on should get the plain version
first. Whoever ends up doing the work should find the detail further down, under its own
heading. Deep technical content in the opening paragraph is how an issue gets closed
without being read.

**The opening section is not technical.** Lead with what we want and why, in the words a
newcomer would use. "We are merging several repositories into this one, and the top level
has to hold more than one set of packages" is an opening. "Refactor the monorepo layout to
introduce group-scoped workspaces" is not.

**The detail goes below.** Once the what and the why are clear, add a section with the
things the implementer needs: the exact shape being asked for, the things that must keep
working, the traps. Use a heading so a reader can stop before it.

**Every issue has an acceptance criteria checklist.** Use `- [ ]` so it is clickable. An
issue without one cannot be closed honestly, because "is it done" turns into an argument
about what was meant. Write each item so someone else could check it without asking you.
"Tests pass" is not checkable. "`deno task test std` exits zero on Deno, Node, and Bun" is.

**Say when something is deliberately out of scope.** If a ticket must not publish, must
not bump a version, or must not touch another group, write that in the acceptance criteria
rather than leaving it implied.

## Labels

Every issue gets one type label and one group label. Both are needed: the type says what
kind of work it is, the group says which part of the repo it applies to.

| Label                | Use it for                                                  |
| -------------------- | ----------------------------------------------------------- |
| `type:chore`         | Structure, tooling, config, dependency bumps                 |
| `type:feature`       | New module, new capability, new public API                   |
| `type:bug`           | Something behaves incorrectly at runtime or in a build       |
| `type:docs`          | README, roadmap, or API documentation only                   |
| `type:ci`            | Workflow, release pipeline, CI configuration                 |
| `group:repo`         | Applies to every group rather than one set of packages       |
| `group:std`          | The `std` group                                              |
| `group:crypto`       | The `crypto` group                                           |
| `group:os`           | The `os` group                                               |

Two more exist for the cases that come up on every repo:

- `status:blocked` — work cannot start. Waiting on a decision, a credential, or an
  upstream change. Say which one in the issue.
- `status:needs-decision` — a human has to choose between real options. Not "add a
  comment", not "think about it". Two or three named options and a recommendation.

The default GitHub labels (`bug`, `enhancement`, `documentation`, and the rest) stay in
place for reporters who do not know about these. Do not relabel someone's issue just to
move it onto the new set.

## Commits

Conventional Commit prefixes, chosen to match the labels:

| Prefix      | Label            | Notes                                       |
| ----------- | ---------------- | ------------------------------------------- |
| `feat`      | `type:feature`   | New capability                             |
| `fix`       | `type:bug`       | Something was wrong                         |
| `chore`     | `type:chore`     | Structure, tooling, config                  |
| `docs`      | `type:docs`      | Documentation only                          |
| `ci`        | `type:ci`        | Workflows                                   |
| `refactor`  | `type:chore`     | No behaviour change                         |
| `test`      | `type:chore`     | Tests only                                  |
| `build`     | `type:chore`     | Build system, dependencies                  |
| `perf`      | `type:feature`   | Measurably faster                           |

A scope in parentheses names the group or the area: `chore(std):`, `fix(eng):`,
`feat(os):`. Use it when there is an obvious one, and leave it off when there is not.

Write the subject as what the change does, in the imperative, under about 70 characters.
Explain the why in the body, not the subject. The body is what a reviewer reads to work
out whether the change is correct.

```text
fix(eng): build a module after the modules it depends on

dnt resolves an @neotales dependency through the pnpm workspace link, so
building a module before its dependency produced an empty npm directory
and a confusing mapping error on the next build. buildOrder now reads the
declared dependencies and visits them first.
```

A `feat` commit should correspond to a `type:feature` issue and a `fix` commit to a
`type:bug` issue. When they disagree, one of the two is wrong.

## Pull requests

Keep them small enough to read in one sitting. If a change is hard to review, it is too
big, and the answer is to split it rather than to ask reviewers to work harder.

A pull request that moves files is one change, even with many files, because a reviewer
reads it as one rename. A pull request that also changes behaviour is two changes.

Put the issue number in the title so the link is obvious:

```text
chore(std): move existing packages under the std group (#2)
```

## Worked example

Issue #1, "Scaffold the new group folders and repo hygiene files", is the reference for
this document. Its opening section explains the shape in plain words and shows the
folder layout before any file names appear. The deep detail, the notes about which config
globs need updating, and the things that must keep working all sit under their own
headings below. It ends with an acceptance criteria checklist where every item is
something a second person could verify on their own.
