#!/usr/bin/env bun
import { $ } from 'bun';
import { writeFileSync, existsSync } from 'fs';

// Colors for terminal output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	green: '\x1b[32m',
	blue: '\x1b[34m',
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
	// Check if stdin is interactive (TTY)
	const isInteractive = process.stdin.isTTY;

	if (!isInteractive) {
		// Non-interactive mode: just show instructions
		log('\n' + '='.repeat(60), colors.bright);
		log('🚀 A3 Stack Template', colors.bright + colors.green);
		log('='.repeat(60) + '\n', colors.bright);

		log('📝 Setup Required\n', colors.yellow);
		log('Before you can run the app, you need to configure your environment:\n');
		log(`  ${colors.cyan}bun run scripts/setup-project.ts${colors.reset}\n`);
		log('This will guide you through:');
		log('  • Authentication setup');
		log('  • Environment file creation\n');
		log('Or manually copy .env.example to .env and configure it.\n');
		return;
	}

	log('\n' + '='.repeat(60), colors.bright);
	log('🚀 Welcome to A3 Stack Setup', colors.bright + colors.green);
	log('='.repeat(60) + '\n', colors.bright);

	// Get project name from current directory
	const projectName = process.cwd().split('/').pop() || 'my-app';
	log(`Setting up project: ${colors.cyan}${projectName}${colors.reset}\n`);

	// Check if .env already exists
	if (existsSync('.env')) {
		log('⚠️  .env file already exists!', colors.yellow);
		const overwrite = confirm('Do you want to overwrite it?', false);
		if (!overwrite) {
			log('\n✅ Keeping existing .env file', colors.green);
			log('Setup cancelled. Run this script again if you need to reconfigure.\n');
			return;
		}
	}

	// Use default database configuration
	const databaseUrl = 'postgres://root:mysecretpassword@localhost:5432/local';

	log('🔐 Authentication Configuration\n', colors.bright);

	// Generate BETTER_AUTH_SECRET
	const secret = await generateSecret();
	log(`Generated BETTER_AUTH_SECRET: ${colors.cyan}${secret.substring(0, 20)}...${colors.reset}`);

	// Create .env file
	const envContent = `DATABASE_URL="${databaseUrl}"
# Generated secret key for Better Auth
BETTER_AUTH_SECRET="${secret}"
`;

	writeFileSync('.env', envContent);
	log('\n✅ Created .env file', colors.green);

	// Ask if they want to start PostgreSQL via Docker
	log('\n🐳 Database Setup\n', colors.bright);
	const startDocker = confirm('Do you want to start PostgreSQL with Docker Compose?', true);

	if (startDocker) {
		try {
			log('\nStarting PostgreSQL container...', colors.cyan);
			await $`docker compose up -d`.quiet();
			log('✅ PostgreSQL container started', colors.green);

			// Wait a bit for PostgreSQL to be ready
			log('⏳ Waiting for PostgreSQL to be ready...', colors.cyan);
			await new Promise((resolve) => setTimeout(resolve, 3000));
		} catch (error) {
			log('\n⚠️  Failed to start Docker container', colors.yellow);
			log('You can start it manually later with: bun run db:start', colors.yellow);
		}
	}

	// Ask if they want to run migrations
	const runMigrations = confirm('Do you want to run database migrations?', true);

	if (runMigrations) {
		try {
			log('\n📦 Running database migrations...', colors.cyan);
			await $`bun run db:migrate`.quiet();
			log('✅ Database migrations completed', colors.green);

			log('\n🔧 Generating database types...', colors.cyan);
			await $`bun run gentypes`.quiet();
			log('✅ Database types generated', colors.green);
		} catch (error) {
			log('\n⚠️  Failed to run migrations', colors.yellow);
			log('You can run them manually later with: bun run db:setup', colors.yellow);
		}
	}

	// Print next steps
	log('\n' + '='.repeat(60), colors.bright);
	log('🎉 Setup Complete!', colors.bright + colors.green);
	log('='.repeat(60) + '\n', colors.bright);

	log('Next steps:', colors.bright);

	log(`  1. Navigate to your project: ${colors.cyan}cd ${projectName}${colors.reset}`);
	log(`  2. Start the development server: ${colors.cyan}bun run dev${colors.reset}`);

	if (!startDocker) {
		log(`  3. Start PostgreSQL: ${colors.cyan}bun run db:start${colors.reset}`);
	}

	if (!runMigrations) {
		log(
			`  ${!startDocker ? '4' : '3'}. Run migrations: ${colors.cyan}bun run db:setup${colors.reset}`
		);
	}

	log(`\n📚 Additional commands:`, colors.bright);
	log(`  - ${colors.cyan}bun run db:migrate${colors.reset} - Run database migrations`);
	log(`  - ${colors.cyan}bun run gentypes${colors.reset} - Regenerate database types`);
	log(`  - ${colors.cyan}bun run db:seed${colors.reset} - Seed the database with sample data`);
	log(`  - ${colors.cyan}bun run format${colors.reset} - Format code with Prettier`);
	log(`  - ${colors.cyan}bun run lint${colors.reset} - Run ESLint\n`);

	log('Happy coding! 🚀\n', colors.green);
}

main().catch((error) => {
	log(`\n❌ Error: ${error.message}`, colors.red);
	process.exit(1);
});

