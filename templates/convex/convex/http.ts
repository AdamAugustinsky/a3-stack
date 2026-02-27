import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { authComponent, createAuth } from './auth';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
	path: '/health',
	method: 'GET',
	handler: httpAction(async () => {
		return new Response('ok', { status: 200 });
	})
});

export default http;
