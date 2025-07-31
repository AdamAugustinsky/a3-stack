import { RPCHandler } from "@orpc/server/fetch";
import { appRouter } from "$lib/server/routers";
import { createContext } from "$lib/server/context";
import type { RequestHandler } from "./$types";

const handler = new RPCHandler(appRouter);

const handleRPC: RequestHandler = async ({ request }) => {
  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: await createContext({ context: { request } }),
  });
  return response ?? new Response("Not Found", { status: 404 });
};

export const GET: RequestHandler = handleRPC;
export const POST: RequestHandler = handleRPC;
export const PUT: RequestHandler = handleRPC;
export const DELETE: RequestHandler = handleRPC;
export const PATCH: RequestHandler = handleRPC;