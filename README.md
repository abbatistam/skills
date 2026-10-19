# Vue Skills

Bryan's personal fork of [`vuejs-ai/skills`](https://github.com/vuejs-ai/skills), maintained for personal use. This repository is not an official Vue project. Upstream license and attribution are retained.

## Installation

Install from the personal fork with the Skills CLI:

```bash
npx skills add abbatistam/skills
```

Claude Code users can install the marketplace bundle or individual skills:

```text
/plugin marketplace add abbatistam/skills
/plugin install vue-skills-bundle@vue-skills
/plugin install vue-best-practices@vue-skills
```

## Using the skills

The collection contains eight skills covering Vue 3 best practices, debugging, Options API, JSX, Vue Router, Pinia, testing, and reusable composables. Asking an agent to use the relevant skill can help route a task; activation still depends on the agent host and its skill-loading behavior.

For detailed coverage, open the relevant `SKILL.md`; each skill links to focused references for specific APIs and symptoms.

## Examples

The demonstrations below belong to the upstream repository and are linked as examples of the original skills; they are not included in this fork.

- [Todo application example](https://github.com/vuejs-ai/skills/tree/dev/demo/todo-app)
- [Reusable composable example](https://github.com/vuejs-ai/skills/tree/dev/demo/hidden-composable)

## Evidence and validation

The ongoing audit uses primary documentation from Vue, its official ecosystem projects, and relevant platform or tool maintainers. Focused corrections label version-specific behavior where the source establishes it; the audit report describes the coverage and limits of the current review.

Run the dependency-free structural validator with:

```bash
node scripts/validate-skills.mjs --write-report
```

It checks skill frontmatter, code fences, local Markdown links and anchors, and primary-source link coverage. It does not establish that every example compiles or that a model performs better with a skill. See [`docs/quality-audit.md`](docs/quality-audit.md) for the current audit scope and evaluation status.

An opt-in A/B harness compares a model's answers with and without the relevant skill context. Validate the cases without making API calls:

```bash
node scripts/run-skill-evals.mjs --dry-run --model MODEL --judge-model JUDGE_MODEL
```

A real run requires `OPENAI_API_KEY`, makes three Responses API calls per case per replicate, and writes raw answers and blind judge scores under `evals/results/`. Model IDs are explicit because access and availability depend on the account. No comparative run is recorded yet; the harness measures injected skill context, not host-native skill discovery. See the [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create) and its [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

## License

MIT. See [LICENSE](LICENSE).
