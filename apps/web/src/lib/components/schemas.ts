import { type } from "arktype";

export const Task = type({
  id: "number",
  text: "string",
  completed: "boolean",
  label: "'bug' | 'feature' | 'documentation'",
  status: "'backlog' | 'todo' | 'in progress' | 'done' | 'canceled'",
  priority: "'low' | 'medium' | 'high'",
});

export type Task = typeof Task.infer;
export type NewTask = Omit<Task, "id">;
