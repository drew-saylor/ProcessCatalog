import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// User table from auth blueprint
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

// Computational process table
export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["llm", "ml"] }).notNull(),
  repositoryUrl: text("repository_url").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

// Process execution history
export const executions = pgTable("executions", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull(),
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const processRelations = relations(processes, ({ one }) => ({
  user: one(users, {
    fields: [processes.userId],
    references: [users.id],
  }),
}));

export const executionRelations = relations(executions, ({ one }) => ({
  process: one(processes, {
    fields: [executions.processId],
    references: [processes.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertProcessSchema = createInsertSchema(processes);
export const selectProcessSchema = createSelectSchema(processes);

export const insertExecutionSchema = createInsertSchema(executions);
export const selectExecutionSchema = createSelectSchema(executions);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertProcess = typeof processes.$inferInsert;
export type SelectProcess = typeof processes.$inferSelect;

export type InsertExecution = typeof executions.$inferInsert;
export type SelectExecution = typeof executions.$inferSelect;
