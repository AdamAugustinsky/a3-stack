---
name: Template Management
description: Manage A3 Stack project templates. Use when creating, modifying, or testing templates in the templates/ directory.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Template Management

## Scope
- Template directories in `templates/*`
- Template processing in `packages/a3-cli/src/lib/template.ts`
- Template metadata in `packages/a3-cli/src/lib/template.ts:listTemplates()`

## Template Structure

Each template lives in `templates/{name}/` and is a complete, runnable project:

```
templates/kysely/
├── package.json          # Must contain {{projectName}} placeholder
├── template.json         # Template metadata (removed during scaffolding)
├── schema.sql            # Database schema source of truth
├── docker-compose.yml    # Local development services
├── src/                  # Application source code
├── migrations/           # Database migrations
├── scripts/              # Setup and utility scripts
├── CLAUDE.md             # AI assistant instructions (removed during scaffolding)
├── AGENTS.md             # Agent workflow guide (removed during scaffolding)
└── .agents/              # Agent skills (removed during scaffolding)
```

## Template Variables

Variables use `{{variableName}}` syntax and are replaced in `package.json` during processing:

```json
{
  "name": "{{projectName}}"
}
```

Currently supported variables:
- `{{projectName}}` - The user's chosen project name

## Adding a New Template

1. Create the template directory: `templates/{name}/`
2. Build the complete project inside it — it should run standalone
3. Add `{{projectName}}` to `package.json` name field
4. Register in `packages/a3-cli/src/lib/template.ts`:

```ts
export async function listTemplates(): Promise<Template[]> {
  return [
    // existing templates...
    {
      name: 'my-template',
      displayName: 'A3 Stack + MyTech',
      description: 'SvelteKit 5 + Better Auth + MyTech',
      features: [
        'Feature 1',
        'Feature 2',
      ],
      icon: 'icon-name',
      version: '1.0.0',
      postInstall: 'bun run scripts/setup-project.ts',
    },
  ];
}
```

## Files Removed During Scaffolding

These files exist for development but are stripped when users scaffold a new project (in `processTemplate()`):

- `CLAUDE.md` - AI assistant instructions
- `AGENTS.md` - Agent workflow guide
- `SVELTE5-BOUNDARY-REFACTOR-GUIDE.md` - Migration guide
- `.claude/` - Claude configuration directory
- `template.json` - Template metadata

If you add new dev-only files to templates, add their removal to `processTemplate()`.

## Template Testing

Test template changes by scaffolding a fresh project:

```bash
# From the repo root
cd packages/a3-cli
bun run src/index.ts create test-output -t kysely

# Verify the scaffolded project
cd ../../test-output
bun install
bun run check
bun run lint
```

Then clean up: `rm -rf test-output`

## Template-Specific AI Skills

Templates can include their own `.agents/skills/` for AI-assisted development within scaffolded projects. These are stripped during scaffolding (since they reference template-internal patterns), but they serve as valuable development aids when working on the templates themselves.

## Anti-Patterns

- Forgetting to add `{{projectName}}` in template `package.json`
- Not registering new templates in `listTemplates()`
- Adding dev-only files without updating `processTemplate()` removal list
- Making template changes without testing a full scaffold cycle
- Putting absolute paths or repo-specific config in templates
