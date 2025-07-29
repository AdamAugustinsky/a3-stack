import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { arktype } from "sveltekit-superforms/adapters";
import { client } from "$lib/orpc";
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
    arktype(createTodoSchema)
  );
  
  const updateForm = await superValidate(arktype(updateTodoSchema));
  
  return {
    createForm,
    updateForm,
  };
};

export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const form = await superValidate(request, arktype(createTodoSchema));
    
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await client.todo.create({
        text: form.data.text,
        completed: false,
        label: form.data.label,
        status: form.data.status,
        priority: form.data.priority,
      });
      
      return { form };
    } catch (error) {
      return fail(500, { 
        form,
        error: "Failed to create todo" 
      });
    }
  },

  update: async ({ request, cookies }) => {
    const form = await superValidate(request, arktype(updateTodoSchema));
    
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await client.todo.update({
        id: form.data.id,
        text: form.data.text,
        label: form.data.label,
        status: form.data.status,
        priority: form.data.priority,
      });
      
      return { form };
    } catch (error) {
      return fail(500, { 
        form,
        error: "Failed to update todo" 
      });
    }
  },
};