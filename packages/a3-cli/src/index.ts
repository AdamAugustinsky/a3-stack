#!/usr/bin/env bun
import { defineCommand, runMain } from 'citty';
import { createCommand } from './commands/create';
import { templatesCommand } from './commands/templates';

const main = defineCommand({
  meta: {
    name: 'a3',
    version: '0.1.0',
    description: 'A3 Stack CLI - Create modern full-stack apps with SvelteKit, Better Auth, and Kysely',
  },
  subCommands: {
    create: createCommand,
    templates: templatesCommand,
  },
});

runMain(main);
