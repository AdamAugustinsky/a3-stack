import { PUBLIC_SERVER_URL } from "$env/static/public";
import { createAuthClient } from "better-auth/svelte";
import { sveltekitCookies } from "better-auth/svelte-kit";

export const authClient = createAuthClient({
  baseURL: `${PUBLIC_SERVER_URL}/api/auth`,
});
