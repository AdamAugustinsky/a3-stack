import { browser } from '$app/environment';
import type { authClient as defaultAuthClient } from '$lib/auth-client';
import type { ConvexClient } from 'convex/browser';

type AuthClient = typeof defaultAuthClient;

type SetupConvexAuthBridgeOptions = {
	client: ConvexClient;
	authClient: AuthClient;
	getInitialToken?: () => string | null;
};

export function setupConvexAuthBridge({
	client,
	authClient,
	getInitialToken
}: SetupConvexAuthBridgeOptions): () => void {
	if (!browser) {
		return () => {};
	}

	const initialToken = getInitialToken?.() ?? null;
	let token: string | null = initialToken;
	let activeSessionId: string | null = null;
	let pendingInitialSessionSync = token !== null;

	const fetchAccessToken = async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
		if (!forceRefreshToken && token) {
			return token;
		}

		try {
			const response = await authClient.convex.token();
			token = response.data?.token ?? null;
			return token;
		} catch {
			token = null;
			return null;
		}
	};

	const reauthenticate = () => {
		client.setAuth(fetchAccessToken);
	};

	if (token) {
		reauthenticate();
	}

	const unsubscribe = authClient.useSession().subscribe((session) => {
		const sessionId = session.data?.session?.id ?? null;

		if (sessionId) {
			if (pendingInitialSessionSync) {
				pendingInitialSessionSync = false;
				activeSessionId = sessionId;
				return;
			}

			if (activeSessionId !== sessionId) {
				activeSessionId = sessionId;
				token = null;
				reauthenticate();
			}
			return;
		}

		if (!session.isPending) {
			pendingInitialSessionSync = false;
			activeSessionId = null;
			token = null;
			client.client.clearAuth();
		}
	});

	return unsubscribe;
}
