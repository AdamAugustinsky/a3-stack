import { $ } from 'bun';

/**
 * Check if git is installed
 */
export async function isGitInstalled(): Promise<boolean> {
  try {
    await $`git --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize a git repository
 */
export async function initGit(dir: string): Promise<void> {
  await $`git init`.cwd(dir).quiet();
  await $`git add -A`.cwd(dir).quiet();
  await $`git commit -m "Initial commit from a3-cli"`.cwd(dir).quiet();
}

/**
 * Check if a directory is a git repository
 */
export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await $`git rev-parse --is-inside-work-tree`.cwd(dir).quiet();
    return true;
  } catch {
    return false;
  }
}
