import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    console.log("user already logged in:", locals.user);
    redirect(302, "/dashboard");
  }
};
