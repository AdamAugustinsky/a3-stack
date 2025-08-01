import { treaty } from "@elysiajs/eden";
import { Elysia, t } from "elysia";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { todo } from "./db/schema/todo";
import { auth } from "./auth";

// Authentication middleware
const requireAuth = (app: Elysia) =>
  app.derive(async ({ request, error }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return error(401, "Unauthorized");
    }
    
    return { session };
  });

export const app = new Elysia({ prefix: "/api" })
  // Public routes
  .get("/", () => "hi")
  .get("/healthcheck", () => "OK")
  
  // Protected routes
  .group("/private", (app) =>
    app
      .use(requireAuth)
      .get("/data", ({ session }) => ({
        message: "This is private",
        user: session.user,
      }))
  )
  
  // Todo routes
  .group("/todo", (app) =>
    app
      .get("/", async () => {
        return await db.select().from(todo);
      })
      
      .post("/", async ({ body }) => {
        const todoData = {
          text: body.text,
          completed: body.completed ?? false,
          priority: body.priority ?? "medium",
          status: body.status ?? "todo",
          label: body.label ?? "feature"
        };
        return await db.insert(todo).values(todoData);
      }, {
        body: t.Object({
          text: t.String(),
          completed: t.Optional(t.Boolean()),
          priority: t.Optional(t.Union([
            t.Literal("low"),
            t.Literal("medium"),
            t.Literal("high")
          ])),
          status: t.Optional(t.Union([
            t.Literal("backlog"),
            t.Literal("todo"),
            t.Literal("in progress"),
            t.Literal("done"),
            t.Literal("canceled")
          ])),
          label: t.Optional(t.Union([
            t.Literal("bug"),
            t.Literal("feature"),
            t.Literal("documentation")
          ]))
        })
      })
      
      .patch("/toggle", async ({ body }) => {
        return await db
          .update(todo)
          .set({ completed: body.completed })
          .where(eq(todo.id, body.id));
      }, {
        body: t.Object({
          id: t.Number(),
          completed: t.Boolean()
        })
      })
      
      .patch("/:id", async ({ params: { id }, body }) => {
        return await db
          .update(todo)
          .set(body)
          .where(eq(todo.id, Number(id)));
      }, {
        body: t.Object({
          text: t.String(),
          label: t.Union([
            t.Literal("bug"),
            t.Literal("feature"),
            t.Literal("documentation")
          ]),
          status: t.Union([
            t.Literal("backlog"),
            t.Literal("todo"),
            t.Literal("in progress"),
            t.Literal("done"),
            t.Literal("canceled")
          ]),
          priority: t.Union([
            t.Literal("low"),
            t.Literal("medium"),
            t.Literal("high")
          ])
        })
      })
      
      .delete("/:id", async ({ params: { id } }) => {
        return await db.delete(todo).where(eq(todo.id, Number(id)));
      })
      
      .patch("/bulk", async ({ body }) => {
        const { ids, updates } = body;
        return await db
          .update(todo)
          .set(updates)
          .where(inArray(todo.id, ids));
      }, {
        body: t.Object({
          ids: t.Array(t.Number()),
          updates: t.Object({
            label: t.Optional(t.Union([
              t.Literal("bug"),
              t.Literal("feature"),
              t.Literal("documentation")
            ])),
            status: t.Optional(t.Union([
              t.Literal("backlog"),
              t.Literal("todo"),
              t.Literal("in progress"),
              t.Literal("done"),
              t.Literal("canceled")
            ])),
            priority: t.Optional(t.Union([
              t.Literal("low"),
              t.Literal("medium"),
              t.Literal("high")
            ]))
          })
        })
      })
      
      .delete("/bulk", async ({ body }) => {
        const { ids } = body;
        return await db.delete(todo).where(inArray(todo.id, ids));
      }, {
        body: t.Object({
          ids: t.Array(t.Number())
        })
      })
  );

export type App = typeof app;
