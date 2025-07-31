import { getRequestEvent } from "$app/server";
import { PUBLIC_SERVER_URL } from "$env/static/public";
import { createAuthClient } from "better-auth/svelte";
import { sveltekitCookies } from "better-auth/svelte-kit";

console.log("auth-client server: PUBLIC_SERVER_URL", PUBLIC_SERVER_URL);
export const authServerClient = createAuthClient({
  baseURL: `${PUBLIC_SERVER_URL}/api`,
  plugins: [sveltekitCookies(getRequestEvent)],
});
