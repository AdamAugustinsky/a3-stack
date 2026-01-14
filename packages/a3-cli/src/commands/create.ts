import { defineCommand } from 'citty';
import consola from 'consola';
import prompts from 'prompts';
import pc from 'picocolors';
import { downloadTemplate, listTemplates, processTemplate } from '../lib/template';
import { initGit, isGitInstalled } from '../lib/git';
import { installDependencies, runPostInstall } from '../lib/setup';
import { resolve } from 'path';
import { existsSync } from 'fs';

export const createCommand = defineCommand({
  meta: {
    name: 'create',
    description: 'Create a new A3 Stack project',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Project name',
      required: false,
    },
    template: {
      type: 'string',
      alias: 't',
      description: 'Template to use (e.g., kysely)',
    },
    git: {
      type: 'boolean',
      description: 'Initialize git repository',
      default: true,
    },
    install: {
      type: 'boolean',
      alias: 'i',
      description: 'Install dependencies',
      default: true,
    },
  },
  async run({ args }) {
    console.log('');
    consola.box({
      title: 'A3 Stack CLI',
      message: 'Create modern full-stack apps',
      style: {
        borderColor: 'cyan',
      },
    });
    console.log('');

    // Get available templates
    const templates = await listTemplates();

    // Check if target directory already exists (if name provided)
    if (args.name) {
      const targetDir = resolve(process.cwd(), args.name);
      if (existsSync(targetDir)) {
        consola.error(`Directory ${pc.cyan(args.name)} already exists`);
        return;
      }
    }

    // Interactive prompts
    const response = await prompts(
      [
        {
          type: args.name ? null : 'text',
          name: 'name',
          message: 'Project name:',
          initial: 'my-a3-app',
          validate: (value: string) => {
            if (!value) return 'Project name is required';
            if (!/^[a-z0-9-_]+$/i.test(value)) {
              return 'Project name can only contain letters, numbers, dashes, and underscores';
            }
            const targetDir = resolve(process.cwd(), value);
            if (existsSync(targetDir)) {
              return `Directory ${value} already exists`;
            }
            return true;
          },
        },
        {
          type: args.template ? null : 'select',
          name: 'template',
          message: 'Select a template:',
          choices: templates.map((t) => ({
            title: `${t.displayName}`,
            description: t.description,
            value: t.name,
          })),
        },
        {
          type: 'confirm',
          name: 'git',
          message: 'Initialize git repository?',
          initial: true,
        },
        {
          type: 'confirm',
          name: 'install',
          message: 'Install dependencies?',
          initial: true,
        },
      ],
      {
        onCancel: () => {
          consola.info('Cancelled');
          process.exit(0);
        },
      }
    );

    const projectName = args.name || response.name;
    const template = args.template || response.template;
    const shouldInitGit = args.git !== false && response.git !== false;
    const shouldInstall = args.install !== false && response.install !== false;

    if (!projectName || !template) {
      consola.error('Missing required options');
      return;
    }

    const targetDir = resolve(process.cwd(), projectName);

    console.log('');
    consola.start(`Creating ${pc.cyan(projectName)} with ${pc.green(template)} template...`);

    // Download template
    try {
      await downloadTemplate(template, targetDir);
      consola.success('Downloaded template');
    } catch (error) {
      consola.error(`Failed to download template: ${error}`);
      return;
    }

    // Process template (replace placeholders)
    try {
      await processTemplate(targetDir, { projectName });
      consola.success('Processed template');
    } catch (error) {
      consola.error(`Failed to process template: ${error}`);
      return;
    }

    // Initialize git
    if (shouldInitGit) {
      const gitInstalled = await isGitInstalled();
      if (gitInstalled) {
        try {
          await initGit(targetDir);
          consola.success('Initialized git repository');
        } catch (error) {
          consola.warn(`Failed to initialize git: ${error}`);
        }
      } else {
        consola.warn('Git is not installed, skipping git initialization');
      }
    }

    // Install dependencies
    if (shouldInstall) {
      try {
        await installDependencies(targetDir);
        consola.success('Installed dependencies');
      } catch (error) {
        consola.warn(`Failed to install dependencies: ${error}`);
        consola.info('You can install them manually with: bun install');
      }
    }

    // Print success message
    console.log('');
    consola.box({
      title: pc.green('Success!'),
      message: `Project ${pc.cyan(projectName)} created successfully`,
      style: {
        borderColor: 'green',
      },
    });

    console.log('');
    consola.info(`${pc.bold('Next steps:')}`);
    console.log('');
    console.log(`  ${pc.cyan('cd')} ${projectName}`);

    if (!shouldInstall) {
      console.log(`  ${pc.cyan('bun install')}`);
    }

    console.log(`  ${pc.cyan('bun run scripts/setup-project.ts')}  ${pc.dim('# Configure environment')}`);
    console.log(`  ${pc.cyan('bun run dev')}`);
    console.log('');
    consola.info(`Visit ${pc.cyan('http://localhost:5173')} to see your app`);
    console.log('');
  },
});
