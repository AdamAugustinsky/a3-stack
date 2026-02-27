import { defineCommand } from 'citty';
import consola from 'consola';
import prompts from 'prompts';
import pc from 'picocolors';
import { downloadTemplate, getTemplateInfo, listTemplates, processTemplate } from '../lib/template';
import { initGit, isGitInstalled } from '../lib/git';
import { installDependencies, runPostInstall } from '../lib/setup';
import { resolve } from 'path';
import { existsSync, mkdirSync, statSync } from 'fs';

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
      description: 'Template to use (e.g., convex)',
    },
    path: {
      type: 'string',
      alias: 'p',
      description: 'Directory where the project folder should be created',
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
    const invocationCwd = process.env.INIT_CWD ? resolve(process.env.INIT_CWD) : process.cwd();
    const resolveFromInvocation = (inputPath: string) => resolve(invocationCwd, inputPath);

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
            return true;
          },
        },
        {
          type: args.path ? null : 'text',
          name: 'path',
          message: 'Project location:',
          initial: invocationCwd,
          validate: (value: string) => {
            if (!value) return 'Project location is required';
            const baseDir = resolveFromInvocation(value);
            if (existsSync(baseDir) && !statSync(baseDir).isDirectory()) {
              return `${baseDir} exists and is not a directory`;
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
    const projectPathInput = args.path || response.path || '.';
    const shouldInitGit = args.git !== false && response.git !== false;
    const shouldInstall = args.install !== false && response.install !== false;
    const templateInfo = await getTemplateInfo(template || '');

    if (!projectName || !template || !projectPathInput) {
      consola.error('Missing required options');
      return;
    }

    const baseDir = resolveFromInvocation(projectPathInput);
    if (existsSync(baseDir) && !statSync(baseDir).isDirectory()) {
      consola.error(`${pc.cyan(baseDir)} exists and is not a directory`);
      return;
    }

    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }

    const targetDir = resolve(baseDir, projectName);
    if (existsSync(targetDir)) {
      consola.error(`Directory ${pc.cyan(targetDir)} already exists`);
      return;
    }

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

    const packageJsonPath = resolve(targetDir, 'package.json');
    if (!existsSync(packageJsonPath)) {
      consola.error(
        `Downloaded template is invalid (missing package.json at ${pc.cyan(packageJsonPath)}).`
      );
      consola.info(
        'This usually means the selected template path is empty or not available in the remote repository.'
      );
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
        await runPostInstall(targetDir, templateInfo?.postInstall);
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
    console.log(`  ${pc.cyan('cd')} ${targetDir}`);

    if (!shouldInstall) {
      console.log(`  ${pc.cyan('bun install')}`);
      if (templateInfo?.postInstall) {
        console.log(`  ${pc.cyan(templateInfo.postInstall)}  ${pc.dim('# Configure environment')}`);
      }
    } else if (template === 'convex') {
      console.log(
        `  ${pc.dim('# Setup script ran. Next, initialize Convex in another terminal:')}`
      );
    }

    if (template === 'convex') {
      console.log(`  ${pc.cyan('bun run convex:dev')}`);
    }
    console.log(`  ${pc.cyan('bun run dev')}`);
    console.log('');
    consola.info(`Visit ${pc.cyan('http://localhost:5173')} to see your app`);
    console.log('');
  },
});
