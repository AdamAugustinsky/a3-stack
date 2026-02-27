#!/usr/bin/env bun
import { writeFileSync, existsSync } from 'fs';

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function confirm(question: string, defaultValue = true): boolean {
	const defaultText = defaultValue ? 'Y/n' : 'y/N';
	const input = prompt(`${question} (${defaultText}):`) || '';
	if (input.trim() === '') return defaultValue;
	return input.trim().toLowerCase() === 'y' || input.trim().toLowerCase() === 'yes';
}

async function generateSecret(): Promise<string> {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Buffer.from(array).toString('base64');
}

async function main() {
	const isInteractive = process.stdin.isTTY;

	if (!isInteractive) {
		log('\n' + '='.repeat(60), colors.bright);
		log('🚀 A3 Stack Convex Template', colors.bright + colors.green);
		log('='.repeat(60) + '\n', colors.bright);
		log('Run setup:');
		log(`  ${colors.cyan}bun run scripts/setup-project.ts${colors.reset}\n`);
		return;
	}

	log('\n' + '='.repeat(60), colors.bright);
	log('🚀 Welcome to A3 Stack Convex Setup', colors.bright + colors.green);
	log('='.repeat(60) + '\n', colors.bright);

	if (existsSync('.env')) {
		log('⚠️  .env file already exists!', colors.yellow);
		const overwrite = confirm('Do you want to overwrite it?', false);
		if (!overwrite) {
			log('\n✅ Keeping existing .env file', colors.green);
			return;
		}
	}

	const secret = await generateSecret();
	const envContent = `CONVEX_URL="http://127.0.0.1:3210"
PUBLIC_CONVEX_URL="http://127.0.0.1:3210"
PUBLIC_CONVEX_SITE_URL="http://127.0.0.1:3210"
SITE_URL="http://localhost:5173"
PUBLIC_SITE_URL="http://localhost:5173"
BETTER_AUTH_SECRET="${secret}"
`;

	writeFileSync('.env', envContent);
	log('✅ Created .env file', colors.green);

	log('\nNext steps:', colors.bright);
	log(`  1. ${colors.cyan}bun install${colors.reset}`);
	log(`  2. ${colors.cyan}bun run convex:dev${colors.reset} ${colors.yellow}# login + initialize Convex project${colors.reset}`);
	log(`  3. ${colors.cyan}bun run dev${colors.reset}`);
	log('\nUseful commands:', colors.bright);
	log(`  - ${colors.cyan}bun run convex:dev${colors.reset} - Start Convex dev backend`);
	log(`  - ${colors.cyan}bun run convex:deploy${colors.reset} - Deploy Convex functions`);
	log(`  - ${colors.cyan}bun run check${colors.reset} - Typecheck and Svelte checks\n`);
}

main().catch((error) => {
	log(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`, colors.red);
	process.exit(1);
});
