import { defineCommand } from 'citty';
import consola from 'consola';
import pc from 'picocolors';
import { listTemplates } from '../lib/template';

export const templatesCommand = defineCommand({
  meta: {
    name: 'templates',
    description: 'List available templates',
  },
  async run() {
    console.log('');
    consola.info(`${pc.bold('Available templates:')}`);
    console.log('');

    const templates = await listTemplates();

    for (const template of templates) {
      console.log(`  ${pc.cyan(pc.bold(template.name))} - ${template.displayName}`);
      console.log(`    ${pc.dim(template.description)}`);
      console.log('');
      console.log(`    ${pc.dim('Features:')}`);
      for (const feature of template.features) {
        console.log(`      ${pc.dim('•')} ${feature}`);
      }
      console.log('');
    }

    consola.info(`Create a project with: ${pc.cyan('a3 create my-app --template kysely')}`);
    console.log('');
  },
});
