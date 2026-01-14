-- Create "todo" table
CREATE TABLE "todo" (
  "id" serial NOT NULL,
  "text" text NOT NULL,
  "completed" boolean NOT NULL DEFAULT false,
  "label" text NOT NULL,
  "status" text NOT NULL,
  "priority" text NOT NULL,
  "organization_id" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "todo_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
