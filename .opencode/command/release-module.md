---
description: Release one roadmap module to JSR and npm with a dated revision tag.
agent: build
---

Release exactly one pending module from `docs/ROADMAP.md`; use `$1` when a module name is supplied.

1. Inspect the module's JSR manifest, generated npm manifest, dependency graph, repository status, release workflow, and existing tags. Release only a module whose registry version is not already `0.0.0`.
2. Set the module version to `0.0.0` in `jsr/<module>/deno.json`, rebuild it with `deno task build <module>`, and inspect generated npm changes. Do not release more than one module per tag.
3. Before committing, run `pnpm install --frozen-lockfile`, lint, formatting checks, the module tests, and `deno task test:e2e`. Resolve every warning and failure.
4. Select the next valid revision tag for the current date: `vYYYY.MM.DD-rN`. Use `r1` when no release tag exists for that date; otherwise increment the highest revision. Run `deno task release:prepare <tag>` and confirm it selects exactly the intended module.
5. Commit the release preparation, push `dev`, then create and push the tag with `SSH_AUTH_SOCK=/home/dev/.ssh/agent/s.9ShwXHKxSA.agent.6LUqU6s9wr`. Use `mise exec -- gh` to monitor the branch CI and tag-triggered release workflow until completed successfully.
6. After the release succeeds, confirm the exact version is available on npm and JSR. Run `deno task test:publish-validation` to smoke-test direct JSR imports, npm installs, and JSR packages installed into Node through pnpm.
7. Mark the completed module in `docs/ROADMAP.md`, commit that documentation update, and push it. Do not proceed to the next module until the current module is published and all validation passes.
