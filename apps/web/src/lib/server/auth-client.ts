import { getRequestEvent } from "$app/server";
import { PUBLIC_SERVER_URL } from "$env/static/public";
import { createAuthClient } from "better-auth/svelte";
import { sveltekitCookies } from "better-auth/svelte-kit";

export const authServerClient = createAuthClient({
  baseURL: PUBLIC_SERVER_URL,
  // @ts-expect-error sveltekitCookies expects getRequestEvent to return a promise, but it doesn't
  plugins: [sveltekitCookies(getRequestEvent)],
});
