import { downloadTemplate as gigetDownload } from 'giget';
import { join } from 'path';
import { readFile, writeFile, readdir } from 'fs/promises';

export interface Template {
  name: string;
  displayName: string;
  description: string;
  features: string[];
  icon: string;
  version: string;
  postInstall?: string;
}

export interface TemplateVariables {
  projectName: string;
  [key: string]: string;
}

const GITHUB_REPO = 'AdamAugustinsky/a3-stack';

/**
 * List available templates
 * TODO: In the future, fetch this from the GitHub API
 */
export async function listTemplates(): Promise<Template[]> {
  return [
    {
      name: 'kysely',
      displayName: 'A3 Stack + Kysely',
      description: 'SvelteKit 5 + Better Auth + Kysely with PostgreSQL',
      features: [
        'Type-safe SQL with Kysely',
        'PostgreSQL with Docker',
        'Better Auth authentication',
        'Organization/multi-tenant support',
        'shadcn-svelte components',
        'TailwindCSS v4',
        'Remote functions (experimental)',
        'Atlas database migrations',
      ],
      icon: 'database',
      version: '1.0.0',
      postInstall: 'bun run scripts/setup-project.ts',
    },
  ];
}

/**
 * Download a template from GitHub
 */
export async function downloadTemplate(
  templateName: string,
  targetDir: string
): Promise<void> {
  await gigetDownload(`github:${GITHUB_REPO}/templates/${templateName}`, {
    dir: targetDir,
    force: false,
  });
}

/**
 * Process template by replacing placeholders
 */
export async function processTemplate(
  dir: string,
  variables: TemplateVariables
): Promise<void> {
  // Update package.json name
  const pkgPath = join(dir, 'package.json');
  let pkgContent = await readFile(pkgPath, 'utf-8');

  // Replace all template variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    pkgContent = pkgContent.replace(new RegExp(placeholder, 'g'), value);
  }

  await writeFile(pkgPath, pkgContent);

  // Remove template.json if it exists
  try {
    const { unlink } = await import('fs/promises');
    await unlink(join(dir, 'template.json'));
  } catch {
    // template.json might not exist, that's fine
  }

  // Remove .claude directory if it exists (AI assistant specific configs)
  try {
    const { rm } = await import('fs/promises');
    await rm(join(dir, '.claude'), { recursive: true, force: true });
  } catch {
    // .claude might not exist, that's fine
  }

  // Remove CLAUDE.md, AGENTS.md if they exist
  const filesToRemove = ['CLAUDE.md', 'AGENTS.md', 'SVELTE5-BOUNDARY-REFACTOR-GUIDE.md'];
  for (const file of filesToRemove) {
    try {
      const { unlink } = await import('fs/promises');
      await unlink(join(dir, file));
    } catch {
      // File might not exist, that's fine
    }
  }
}

/**
 * Get template metadata
 */
export async function getTemplateInfo(templateName: string): Promise<Template | null> {
  const templates = await listTemplates();
  return templates.find((t) => t.name === templateName) || null;
}
