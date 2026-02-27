import { createCookieGetter } from 'better-auth/cookies';
import { JWT_COOKIE_NAME } from '@convex-dev/better-auth/plugins';
import { PUBLIC_CONVEX_SITE_URL, PUBLIC_CONVEX_URL } from '$env/static/public';
import { ConvexHttpClient, type ConvexClientOptions } from 'convex/browser';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

type CreateAuthLike = (ctx: never) => {
	options: Parameters<typeof createCookieGetter>[0];
};

export const getToken = async (
	createAuth: CreateAuthLike,
	cookies: Cookies
): Promise<string | undefined> => {
	const options = createAuth({} as never).options;
	const createCookie = createCookieGetter(options);
	const cookie = createCookie(JWT_COOKIE_NAME);
	return cookies.get(cookie.name);
};

export const createConvexHttpClient = ({
	token,
	convexUrl,
	options
}: {
	token?: string;
	convexUrl?: string;
	options?: ConvexClientOptions;
}) => {
	const client = new ConvexHttpClient(convexUrl ?? PUBLIC_CONVEX_URL, options);
	if (token) {
		client.setAuth(token);
	}
	return client;
};

const proxyAuthRequest = async (
	request: Request,
	opts?: {
		convexSiteUrl?: string;
	}
) => {
	const requestUrl = new URL(request.url);
	const convexSiteUrl = opts?.convexSiteUrl ?? PUBLIC_CONVEX_SITE_URL;
	if (!convexSiteUrl) {
		throw new Error('PUBLIC_CONVEX_SITE_URL environment variable is not set');
	}

	const nextUrl = `${convexSiteUrl}${requestUrl.pathname}${requestUrl.search}`;
	const newRequest = new Request(nextUrl, request);
	newRequest.headers.set('host', new URL(nextUrl).host);
	newRequest.headers.set('accept-encoding', 'application/json');
	return fetch(newRequest, { method: request.method, redirect: 'manual' });
};

export const createSvelteKitHandler = (opts?: { convexSiteUrl?: string }) => {
	const requestHandler = async ({ request }: RequestEvent) => proxyAuthRequest(request, opts);
	return {
		GET: requestHandler,
		POST: requestHandler
	};
};
