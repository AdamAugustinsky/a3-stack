---
name: CLI Development
description: Build and extend the a3-cli scaffolding tool. Use when adding commands, modifying prompts, or changing template download/processing logic.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# CLI Development

## Scope
- Commands in `packages/a3-cli/src/commands/*`
- Core library in `packages/a3-cli/src/lib/*`
- CLI entry point `packages/a3-cli/src/index.ts`

## Tech Stack
- **citty** - Command definition and argument parsing
- **giget** - GitHub template downloading
- **consola** - Structured terminal logging with boxes and icons
- **prompts** - Interactive user prompts (text, select, confirm)
- **picocolors** - Terminal color formatting

## Adding a New Command

1. Create `packages/a3-cli/src/commands/{name}.ts`:

```ts
import { defineCommand } from 'citty';
import consola from 'consola';
import pc from 'picocolors';

export const myCommand = defineCommand({
  meta: {
    name: 'my-command',
    description: 'What it does',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Argument description',
      required: false,
    },
    flag: {
      type: 'boolean',
      alias: 'f',
      description: 'A flag',
      default: false,
    },
  },
  async run({ args }) {
    consola.start(`Doing something with ${pc.cyan(args.name)}...`);
    // logic here
    consola.success('Done');
  },
});
```

2. Register in `packages/a3-cli/src/index.ts`:

```ts
import { myCommand } from './commands/my-command';

const main = defineCommand({
  // ...
  subCommands: {
    create: createCommand,
    templates: templatesCommand,
    'my-command': myCommand,
  },
});
```

## Template Download Flow

```ts
import { downloadTemplate as gigetDownload } from 'giget';

// Downloads from github:AdamAugustinsky/a3-stack/templates/{name}
await gigetDownload(`github:${GITHUB_REPO}/templates/${templateName}`, {
  dir: targetDir,
  force: false,
});
```

## Interactive Prompts Pattern

```ts
import prompts from 'prompts';

const response = await prompts(
  [
    {
      type: 'text',
      name: 'name',
      message: 'Project name:',
      validate: (value: string) => {
        if (!value) return 'Required';
        return true;
      },
    },
    {
      type: 'select',
      name: 'template',
      message: 'Select a template:',
      choices: templates.map((t) => ({
        title: t.displayName,
        description: t.description,
        value: t.name,
      })),
    },
  ],
  {
    onCancel: () => {
      consola.info('Cancelled');
      process.exit(0);
    },
  }
);
```

## Console Output Conventions

- `consola.start()` for starting operations
- `consola.success()` for completed operations
- `consola.error()` for failures (then return early)
- `consola.warn()` for non-fatal issues
- `consola.info()` for informational messages
- `consola.box()` for branded sections (title cards, success banners)
- Use `pc.cyan()` for user values, `pc.green()` for success items, `pc.dim()` for hints

## Testing

Test CLI changes by running locally:
```bash
cd packages/a3-cli
bun run src/index.ts create test-project
```

## Anti-Patterns

- Raw `console.log` for user-facing output (use `consola`)
- Hardcoding template names instead of using `listTemplates()`
- Not handling `onCancel` in prompts
- Missing error handling around file system operations
