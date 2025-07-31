import { authServerClient } from "$lib/server/auth-client";
import { redirect, type Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  if (event.route.id?.startsWith("/(protected)/")) {
    console.log("test server middleware", event.request.headers);
    const session = await authServerClient.getSession();

    console.log("session", session);

    if (session.data) {
      event.locals.session = session.data?.session;
      event.locals.user = session?.data?.user;

      const response = await resolve(event);
      return response;
    } else {
      redirect(307, "/sign-in");
    }
  } else {
    const response = await resolve(event);
    return response;
  }
};
