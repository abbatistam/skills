# Vue Skills Maintenance

This repository is Bryan's personal fork of [`vuejs-ai/skills`](https://github.com/vuejs-ai/skills). Keep the collection useful for personal use and do not present it as an official Vue project.

## Repository boundaries

- `main` is the personal published branch. Follow the user's instruction to work directly on `main` in this checkout.
- Push only to the user's fork, `abbatistam/skills`. Treat `vuejs-ai/skills` as read-only; do not open a pull request against it.
- Do not create another branch or a pull request unless the user asks.
- Preserve the upstream license and attribution where applicable.

## Evidence and technical accuracy

- Support Vue behavior claims with the official Vue documentation, Vue core source or release notes. For Vue Router, Pinia, test tools, TypeScript, and browser APIs, use the respective project's official documentation or source.
- Use an issue or a minimal reproduction only when official documentation does not specify the behavior. Do not use forums, social posts, or unsourced blogs as the sole evidence for technical claims.
- State the affected version when behavior depends on a Vue or ecosystem version. Distinguish documented behavior from a recommendation or heuristic.
- Avoid absolute rules such as “always” and “never” unless the framework enforces them or a cited source establishes the constraint.
- Keep edits limited to findings supported by evidence. Remove claims that cannot be supported rather than decorating them with a weak citation.

## Skill design

- Keep each `SKILL.md` focused on its purpose and activation scope. Put material that is needed only for a particular problem in a linked reference.
- Keep skill descriptions distinct enough to route related Vue tasks to the right skill without making every Vue skill a mandatory catch-all.
- Write reference guides around a specific task or symptom. Include the necessary conditions, version caveats, a minimal correct example, and primary sources when they support technical claims.
- Treat conventions and architecture choices as recommendations with decision criteria, not framework requirements.
- Keep code examples consistent with the stated Vue version and the relevant official APIs.

## Validation

The repository has no root `package.json` or TypeScript project. It has a structural validator and an opt-in baseline-versus-skill runner at `scripts/run-skill-evals.mjs`; its `--dry-run` validates cases but is not a model evaluation. Do not report `pnpm typecheck` or comparative model evaluations as passing unless those checks have actually run.

For documentation changes, run `node scripts/validate-skills.mjs --write-report` and `git diff --check`, then review changed technical claims against their cited sources. The validator checks skill frontmatter, fenced code blocks, local Markdown links and anchors, the Claude marketplace manifest, and the presence of at least one allowlisted primary-source URL per skill Markdown file; it does not verify remote URL status or prove that a source supports every nearby claim. Do not report comparative model evaluations as passing unless they have actually run.

When editing evaluation cases, run the A/B harness in `--dry-run` mode to validate their skill and reference paths. A real run requires an explicitly selected model and judge model plus `OPENAI_API_KEY`; report its results only after inspecting the saved raw answers and rubric grades.
