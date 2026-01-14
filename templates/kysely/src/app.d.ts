// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User, Session } from 'better-auth';

// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			errors?: {
				nested: Record<string, string[]>;
			};
		}
		interface Locals {
			user: User;
			session: Session;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
