import { treaty } from "@elysiajs/eden";
import type { App } from "./server/elysia";
import { PUBLIC_SERVER_URL } from "$env/static/public";

// Use the server URL for Eden treaty
const baseUrl = PUBLIC_SERVER_URL || "http://localhost:5173";

export const edenTreaty = treaty<App>(baseUrl);
