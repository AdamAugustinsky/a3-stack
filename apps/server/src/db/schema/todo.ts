import { pgTable, text, boolean, serial } from "drizzle-orm/pg-core";

export const todo = pgTable("todo", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
  label: text("label").notNull().$type<"bug" | "feature" | "documentation">(),
  status: text("status")
    .notNull()
    .$type<"backlog" | "todo" | "in progress" | "done" | "canceled">(),
  priority: text("priority").notNull().$type<"low" | "medium" | "high">(),
});
