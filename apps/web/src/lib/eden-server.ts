import { treaty } from "@elysiajs/eden";
import { app } from "./server/elysia";

// Server-side Eden client that uses localhost for internal API calls
export const edenTreatyServer = treaty(app);

