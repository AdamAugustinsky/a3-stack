import { eq } from "drizzle-orm";
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

  delete: publicProcedure
    .input(
      type({
        id: "number",
      }),
    )
    .handler(async ({ input }) => {
      return await db.delete(todo).where(eq(todo.id, input.id));
    }),
};
