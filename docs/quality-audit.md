# Vue Skills quality audit

Audit snapshot: 2026-10-19. The maintained collection contains 8 skills and 197 focused reference files: 205 tracked Markdown files in total. The earlier count of 251 included locally installed, untracked `node_modules` content, which is not part of this repository's skill corpus.

## Recorded checks

- `node scripts/validate-skills.mjs --write-report` passes for all 205 files. It checks skill frontmatter delimiters and required `name`/`description` fields, fenced code blocks, local links and heading anchors, Claude marketplace/plugin skill paths, and the presence of at least one URL on an allowlisted primary-source domain. It does not parse arbitrary YAML frontmatter or replace Claude Code's `claude plugin validate`; the Claude Code CLI is unavailable in this environment.
- [`source-coverage.csv`](source-coverage.csv) maps each Markdown file to its primary-source URLs so coverage can be reviewed and regenerated.
- Focused claim checks against current primary documentation corrected the navigation-guard `next` guidance, the Vue 3 `TransitionGroup` wrapper behavior, the distinction between Vue Test Utils promise flushing and timer advancement, when list keys are needed, the claim that Vue wraps DOM events in a synthetic event system, and the scope of `this`-binding advice for hand-rolled reactive stores versus Pinia and Options API methods. The MSW example now identifies its 3.x API and Node.js 22 requirement. Tailwind guidance distinguishes v3 `safelist` from v4 `@source inline()`.
- After publishing commit `0a03543`, `npx --yes skills@latest add abbatistam/skills --skill '*' --agent codex --yes --copy --json` installed all eight skills into an isolated temporary Codex project. Its 205 files match the repository's 205 skill/reference files after normalizing line endings. The flags made the smoke test deterministic and kept installation inside the temporary project; this confirms the published source and Codex install path through the Skills CLI.
- Twelve baseline-versus-skill cases cover all eight skills, with an opt-in Responses API runner. A one-replicate run requires 36 requests; `node scripts/run-skill-evals.mjs --dry-run --model example-model --judge-model example-judge` resolves the cases and reports that count without contacting the API. The runner uses Structured Outputs for blind rubric grading and records raw answers for manual review. No comparative run is recorded because `OPENAI_API_KEY` is not configured in this environment.

## What these checks establish

The generated inventory and validator establish source-link coverage and basic Markdown integrity. The Skills CLI smoke test established that the published fork exposes and installs all eight skills with matching file contents. The smoke test does not exercise the CLI's interactive flow for every supported host. These checks do not prove that every sentence is supported by the adjacent link, check remote link availability, compile every code sample, or measure whether an agent's output improves with a skill. Those require separate review or runtime evaluation.

## Remaining gates

- Complete a claim-to-source review of the full corpus, including unchanged references; the current pass has made focused corrections but does not claim semantic revalidation of all 205 files.
- Run the comparative cases with an authorized API key and record the model, host, prompts, rubric, and results. No model comparison has passed yet: the prior local Codex CLI attempt failed authentication/model-catalog setup, and this environment has no `OPENAI_API_KEY`.
- The current A/B harness measures adding the selected skill and references to a model's instructions through the Responses API. It does not test the target agent host's native skill discovery or prove causal benefit on other models.
- Run Claude Code's official `claude plugin validate` against the marketplace and test installation in Claude Code. The static validator checks the manifest and skill paths, but the Claude Code CLI is not installed here.

Until these gates pass, the collection should be described as actively audited, not as having demonstrated world-class quality or proven model gains.
