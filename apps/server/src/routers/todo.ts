import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { todo } from "../db/schema/todo";
import { publicProcedure } from "../lib/orpc";
import { type } from "arktype";
import { createSelectSchema, createInsertSchema } from "drizzle-arktype";

const todoSchema = createSelectSchema(todo);
const newTodoSchema = createInsertSchema(todo);

export const todoRouter = {
  getAll: publicProcedure.handler(async () => {
    return await db.select().from(todo);
  }),

  create: publicProcedure
    .input(newTodoSchema.omit("id"))
    .handler(async ({ input }) => {
      return await db.insert(todo).values(input);
    }),

  toggle: publicProcedure
    .input(
      type({
        id: "number",
        completed: "boolean",
      }),
    )
    .handler(async ({ input }) => {
      return await db
        .update(todo)
        .set({ completed: input.completed })
        .where(eq(todo.id, input.id));
    }),

  update: publicProcedure
    .input(
      type({
        id: "number",
        text: "string",
        label: "'bug' | 'feature' | 'documentation'",
        status: "'backlog' | 'todo' | 'in progress' | 'done' | 'canceled'",
        priority: "'low' | 'medium' | 'high'",
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...updateData } = input;
      return await db
        .update(todo)
        .set(updateData)
        .where(eq(todo.id, id));
    }),

  delete: publicProcedure
    .input(
      type({
        id: "number",
      }),
    )
    .handler(async ({ input }) => {
      return await db.delete(todo).where(eq(todo.id, input.id));
    }),

  bulkUpdate: publicProcedure
    .input(
      type({
        ids: "number[]",
        updates: {
          "label?": "'bug' | 'feature' | 'documentation'",
          "status?": "'backlog' | 'todo' | 'in progress' | 'done' | 'canceled'",
          "priority?": "'low' | 'medium' | 'high'",
        },
      }),
    )
    .handler(async ({ input }) => {
      const { ids, updates } = input;
      return await db
        .update(todo)
        .set(updates)
        .where(inArray(todo.id, ids));
    }),

  bulkDelete: publicProcedure
    .input(
      type({
        ids: "number[]",
      }),
    )
    .handler(async ({ input }) => {
      const { ids } = input;
      return await db.delete(todo).where(inArray(todo.id, ids));
    }),
};
