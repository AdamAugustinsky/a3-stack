# A3 Stack Monorepo

## Purpose

This is the A3 Stack monorepo — a project scaffolding toolkit that creates production-ready full-stack apps. It contains the CLI tool (`packages/a3-cli`), the studio desktop app (`packages/a3-studio`), and the project templates (`templates/`) that get scaffolded into new projects.

## Non-Negotiables

- Use Bun only. No Node.js, npm, yarn, or pnpm.
- Templates are the product. Changes to `templates/` directly affect what users scaffold.
- The CLI must work when installed globally via `bunx a3-stack-cli create`.
- Template files like `CLAUDE.md`, `AGENTS.md`, and `.claude/` are stripped during scaffolding — they are development-time aids for the template, not end-user artifacts.
- No `any` or `ts-expect-error`.

## Workflow

### Pre-flight (first message)

- Confirm scope: CLI, studio, templates, or monorepo infra.
- Identify target package/area.
- Identify tests/checks to run (or why skipped).

### Session flow

1. Explore: locate files and existing patterns.
2. Plan: choose approach, risks, and checks.
3. Implement: keep diffs focused.
4. Review/Test: self-review and run relevant tests/checks.
5. Check: run type/lint/build gates when appropriate.

## Architecture

```
a3-stack/
├── packages/
│   ├── a3-cli/          # CLI tool (citty + giget + consola + prompts)
│   │   └── src/
│   │       ├── index.ts         # Entry point, defines CLI commands
│   │       ├── commands/        # CLI command definitions (create, templates)
│   │       └── lib/             # Core logic (template download, git, setup)
│   └── a3-studio/       # Desktop app (SvelteKit + Tauri)
│       └── src/
├── templates/
│   └── kysely/          # SvelteKit + Kysely + Better Auth template
└── package.json         # Workspace root
```

### Key Packages

- **a3-cli**: CLI scaffolder using `citty` for command parsing, `giget` for GitHub template downloads, `consola` for logging, `prompts` for interactive prompts, `picocolors` for terminal colors.
- **a3-studio**: Desktop companion app built with SvelteKit 5 + Tauri 2 + TailwindCSS v4.

### Template Lifecycle

1. User runs `bunx a3-stack-cli create`
2. CLI prompts for project name and template
3. `giget` downloads template from `github:AdamAugustinsky/a3-stack/templates/{name}`
4. `processTemplate()` replaces `{{projectName}}` placeholders in `package.json`
5. Dev-only files are removed: `CLAUDE.md`, `AGENTS.md`, `.claude/`, `template.json`
6. Git is initialized, dependencies are installed
7. User runs `bun run scripts/setup-project.ts` to configure environment

## Commands

```bash
bun run cli create           # Run CLI create command locally
bun run dev:cli              # Dev mode for CLI
bun run dev:studio           # Dev mode for studio
bun run build                # Build all packages
```

## Code Quality

- Prefer direct, obvious code over abstractions.
- No `any` or `ts-expect-error`.
- Wrap errors with `cause`. No empty catch blocks.
- CLI output should be clear and helpful — use `consola` for structured logging.
- Template changes should be tested by scaffolding a fresh project.

## Skills

- `CLI Development` - citty commands, prompts, template downloading, and CLI patterns.
- `Template Management` - Template structure, variables, lifecycle, and testing.
- `A3 Studio` - Tauri + SvelteKit desktop app patterns.
- `frontend-design` - Use for new screen/page/component UI design work.
