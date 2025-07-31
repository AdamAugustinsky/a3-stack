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

// Generic Schema type for data-table components
export interface Schema {
  id: number;
  header: string;
  type: string;
  status: string;
  target?: number | string;
  [key: string]: any;
}
