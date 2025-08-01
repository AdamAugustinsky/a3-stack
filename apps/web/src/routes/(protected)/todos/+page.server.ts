import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { arktype } from "sveltekit-superforms/adapters";
import { edenTreatyServer } from "$lib/eden-server";
import type { Actions, PageServerLoad } from "./$types";
import { createTodoSchema, updateTodoSchema } from "./schemas";

export const load: PageServerLoad = async ({ cookies }) => {
  const createForm = await superValidate(
    {
      text: "",
      label: "feature",
      status: "todo",
      priority: "medium",
    },
    arktype(createTodoSchema),
  );

  const updateForm = await superValidate(arktype(updateTodoSchema));

  // Fetch todos using Eden client
  const todosResponse = await edenTreatyServer.api.todo.get();
  const todos = todosResponse.data ?? [];

  return {
    createForm,
    updateForm,
    todos,
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, arktype(createTodoSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const response = await edenTreatyServer.api.todo.post({
        text: form.data.text,
        completed: false,
        label: form.data.label,
        status: form.data.status,
        priority: form.data.priority,
      });

      if (response.error) {
        throw new Error(response.error.value.message ?? "");
      }

      return { form };
    } catch (error) {
      return fail(500, {
        form,
        error: "Failed to create todo",
      });
    }
  },

  update: async ({ request }) => {
    const form = await superValidate(request, arktype(updateTodoSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const response = await edenTreatyServer.api
        .todo({ id: form.data.id })
        .patch({
          text: form.data.text,
          label: form.data.label,
          status: form.data.status,
          priority: form.data.priority,
        });

      if (response.error) {
        throw new Error(response.error.value.message ?? "");
      }

      return { form };
    } catch (error) {
      return fail(500, {
        form,
        error: "Failed to update todo",
      });
    }
  },

  toggle: async ({ request }) => {
    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const completed = formData.get("completed") === "true";

    try {
      const response = await edenTreatyServer.api.todo.toggle.patch({
        id,
        completed,
      });

      if (response.error) {
        throw new Error(response.error.value.message ?? "");
      }

      return { success: true };
    } catch (error) {
      return fail(500, {
        error: "Failed to toggle todo",
      });
    }
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = Number(formData.get("id"));

    try {
      const response = await edenTreatyServer.api.todo({ id }).delete();

      if (response.error) {
        throw new Error(response.error.value.message ?? "");
      }

      return { success: true };
    } catch (error) {
      return fail(500, {
        error: "Failed to delete todo",
      });
    }
  },
};
