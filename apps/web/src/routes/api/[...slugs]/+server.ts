import type { RequestHandler } from "@sveltejs/kit";
import { app } from "$lib/server/elysia";

const handler: RequestHandler = async (event) =>
  await app.handle(event.request);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
