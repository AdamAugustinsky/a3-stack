import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	server: {
		fs: {
			allow: [path.resolve(rootDir, 'convex')]
		}
	},
	plugins: [tailwindcss(), sveltekit()]
});
