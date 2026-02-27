# Skill Index

Use this index to choose the correct skill for a task. Load the listed skill before implementing changes.

1. `cli-development` - CLI commands, prompts, template scaffolding, and distribution.
2. `template-management` - Template structure, variables, lifecycle, and authoring.
3. `a3-studio` - Tauri + SvelteKit desktop app patterns.

## Deterministic Routing Rules

When multiple routes match, load all matched skills.

1. CLI command or scaffolding logic changes
- Use `cli-development`.

2. Template content, structure, or variable changes
- Use `template-management`.

3. Studio desktop app work
- Use `a3-studio`.

4. New UI screens or components in studio
- Use both `a3-studio` and `frontend-design`.
