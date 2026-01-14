import { $ } from 'bun';
import consola from 'consola';

/**
 * Install dependencies using bun
 */
export async function installDependencies(dir: string): Promise<void> {
  consola.start('Installing dependencies...');
  await $`bun install`.cwd(dir);
}

/**
 * Run post-install script if it exists
 */
export async function runPostInstall(dir: string, script?: string): Promise<void> {
  if (!script) {
    // Default to running setup-project.ts
    script = 'bun run scripts/setup-project.ts';
  }

  try {
    consola.start('Running post-install setup...');
    const [cmd, ...args] = script.split(' ');
    await $`${cmd} ${args}`.cwd(dir);
    consola.success('Post-install setup complete');
  } catch (error) {
    // Post-install is optional
    consola.warn('Post-install script failed or not found');
  }
}

/**
 * Detect the preferred package manager
 */
export function detectPackageManager(): 'bun' | 'npm' | 'pnpm' | 'yarn' {
  // Check for bun.lockb
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.includes('bun')) return 'bun';
  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('yarn')) return 'yarn';

  // Default to bun for this CLI
  return 'bun';
}
