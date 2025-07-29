import { type } from "arktype";

export const createTodoSchema = type({
  text: "string >= 1",
  label: "'bug' | 'feature' | 'documentation'",
  status: "'backlog' | 'todo' | 'in progress' | 'done' | 'canceled'",
  priority: "'low' | 'medium' | 'high'",
});

export const updateTodoSchema = type({
  id: "number",
  text: "string >= 1",
  label: "'bug' | 'feature' | 'documentation'",
  status: "'backlog' | 'todo' | 'in progress' | 'done' | 'canceled'",
  priority: "'low' | 'medium' | 'high'",
});

export type CreateTodoInput = typeof createTodoSchema.infer;
export type UpdateTodoInput = typeof updateTodoSchema.infer;