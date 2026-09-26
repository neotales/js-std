# CI and cross-runtime testing strategy

How the repository proves that its modules work outside Deno, Node.js, and Bun, without
making every commit wait on a JerryScript build.

## The problem

Fourteen modules have to be credible on nine environments. Three of those environments are
ordinary runtimes; six are not, and the difference in cost is about two orders of magnitude.

Measured on this repository:

| Work                                         | Cost         | Repeats?     |
| -------------------------------------------- | ------------ | ------------ |
| One module suite on Deno                     | ~2 s         | every commit |
| All fourteen modules, Deno                   | ~30 s        | every commit |
| Three core runtimes, three operating systems | ~2 min       | every commit |
| Chromium download                            | ~1 min, once | cached       |
| workerd via the pinned Wrangler              | ~5 s         | every commit |
| QuickJS-ng release download                  | ~1 s         | cached       |
| txiki.js build from a pinned tag             | ~3 min       | cached       |
| JerryScript build from a pinned tag          | ~2 min       | cached       |
| ClearScript build                            | ~20 s        | every commit |

The expensive items are dominated by _engine builds_, not by testing. That is what makes a
tiered ladder worthwhile.

## The ladder

| Tier | Scope                                          | Trigger                              | Budget                   |
| ---- | ---------------------------------------------- | ------------------------------------ | ------------------------ |
| 0    | Format, lint, runtime tables                   | every push                           | ~40 s                    |
| 1    | Deno, Node, Bun across three operating systems | every push                           | ~2 min                   |
| 2    | Chromium and Cloudflare Workers                | pull request, push to `dev`, nightly | ~3 min                   |
| 3    | QuickJS-ng, txiki.js, JerryScript, ClearScript | pull request, push to `dev`, nightly | ~8 min cold, ~2 min warm |
| 4    | js-os modules on the .NET host                 | pull request, push to `dev`          | ~1 min                   |
| 5    | Dependency audit and a full core sweep         | weekly, against `dev`                | ~5 min                   |

Workflows: `core.yml` for tiers 0 and 1, `conformance.yml` for tiers 2 to 4, and
`weekly-validation.yml` for tier 5.

A branch push waits on tiers 0 and 1 only. A reviewer, and the merge into `dev`, both wait
on everything. The embedded engines are cached on a key that hashes `runtime-tests/setup.ts`
and deliberately **not** the commit, so an ordinary commit reuses the existing build and only
a version change pays for it.

## Declaring support

`runtimes.json` is the single source of truth. Each module records a level per environment:

```json
"fs": {
  "deno": "full", "node": "full", "bun": "full",
  "browser": "none", "workerd": "partial",
  "quickjs": "partial", "txiki": "partial",
  "jerry": "none", "clearscript": "full"
}
```

Three levels, and only three, because a finer scale would not change a decision:

- **full** — the module's documented surface works. The suite runs.
- **partial** — a usable subset works, and the limitation is written down. The suite runs.
- **none** — the module cannot work. The suite is skipped.

`eng/runtimes.ts` validates the table on load, so a missing module, an unknown environment,
or a level that is not one of the three is a hard error rather than a silent default.

The table is the input to three things, which is why it cannot drift:

1. `deno task test` skips a module on a runtime marked `none`.
2. `runtime-tests/main.ts` skips a scenario whose module is unsupported on that engine.
3. `deno task readme` regenerates the support table in all fourteen module READMEs, and
   `deno task readme:check` fails the build when one is stale. That check runs in tier 0.

## Skipping, at two levels

**Module level** is declared in `runtimes.json` and needs no test changes.

**Capability level** is for the case where a module works on a runtime but one operation does
not, such as `fs.chown` on a host with no ownership model. `deno task test --skip` drops
matching test files:

```sh
deno task test --deno --skip chown.test.ts,umask.test.ts fs
```

File lists are expanded and the survivors are passed explicitly, rather than using
`--filter`. That flag matches test _names_ on Deno and behaves differently again on Node and
Bun, so it is the wrong tool for excluding a file.

The embedded and browser runners skip whole modules rather than individual files. Those
suites are scenario-shaped: one scenario proves one capability, so an unsupported module has
nothing to run.

## Developer tooling

`deno task doctor` reports what is ready and, for anything missing, the exact command that
fixes it. It installs nothing, so it is safe to run first and cheap enough to run often.

`deno task setup` does the installing. It is opt-out per tool:

```sh
deno task setup                          # everything
deno task setup --only=quickjs,jerry     # just those engines
deno task setup --skip=browser           # everything except Chromium
```

### What mise supplies, and what it cannot

`mise.toml` pins every tool. mise covers the toolchain for six environments directly, and
QuickJS-ng through its `ubi` backend. The two embedded engines that need compiling are
deliberately absent, and `mise.toml` says why:

| Tool                  | mise                            | Notes                                          |
| --------------------- | ------------------------------- | ---------------------------------------------- |
| deno, node, bun, pnpm | yes                             | the versions that publish the packages         |
| dotnet                | yes                             | the ClearScript host and the js-os bridge      |
| workerd               | yes                             | the Cloudflare Workers tier                    |
| quickjs               | `ubi:quickjs-ng/quickjs@0.17.0` | a Linux release binary exists                  |
| txiki                 | **no**                          | 26.6.0 publishes macOS and Windows assets only |
| jerry                 | **no**                          | 3.0.0 publishes no release assets at all       |

Those two are built from a pinned tag by `runtime-tests/setup.ts`, which is also what CI
does. They need `cmake` and a C toolchain, which `deno task doctor` checks for, because a
developer without them gets a build failure rather than a useful message.

Recording the two gaps in `mise.toml` matters: without the comment they read as an oversight,
and someone will spend an afternoon trying `mise use ubi:saghul/txiki.js` and concluding
mise is broken.

## Running one environment

```sh
deno task runtimes                 # the whole matrix
deno task doctor                   # what is ready here
deno task test --deno fs          # one module, one runtime
deno task test --deno --skip x.test.ts fs
deno task test:runtime-lab         # every embedded engine
deno task test:runtime-lab quickjs
deno task test:e2e                 # Chromium and Workers
```

`deno task test:runtime-lab` accepts engine names, so a developer who only has QuickJS-ng
built does not pay for the others.

## Adding an environment

1. Add the environment to `runtimes.json` with its tier and runner. Every module needs a level
   for it, or validation fails.
2. Implement a host probe and record what it proves. A host probe is not module support: the
   matrix keeps the two separate so a passing probe never promotes a cell on its own.
3. Wire the runner into `runtime-tests/main.ts` or `e2e/`, and map each scenario to its module
   so `runtimes.json` drives the skip.
4. Give it a tier and a trigger. If it needs a compile, it belongs in tier 3 and needs a
   cache key.

## What this does not do

- It does not prove Windows or macOS for the embedded engines. Those builds are not wired up,
  and the source builds for QuickJS-ng and txiki.js differ per platform. `runtimes.json`
  does not distinguish operating systems for the embedded tier, which is a real gap.
- It does not test publishable artifacts on the embedded engines. The suites bundle the JSR
  sources, so a dnt output defect would only surface on the core tier.
- It does not gate a release on tiers 2 to 4. A release today runs the core suites and the
  JSR dry run. Promoting a matrix cell should require the full ladder, and that gate is
  still a backlog item.
