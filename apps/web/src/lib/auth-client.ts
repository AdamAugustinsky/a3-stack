import { PUBLIC_SERVER_URL } from "$env/static/public";
import { createAuthClient } from "better-auth/svelte";

console.log("AUTH PUBLIC_SERVER_URL", PUBLIC_SERVER_URL);
export const authClient = createAuthClient({
  baseURL: PUBLIC_SERVER_URL,
});
