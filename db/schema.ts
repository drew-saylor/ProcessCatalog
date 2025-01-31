import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Add input source type enum
export const inputSourceType = pgEnum("input_source_type", ["direct", "file", "bigquery"]);

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

// Process versions table
export const versions = pgTable("versions", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id),
  version: text("version").notNull(),
  commitHash: text("commit_hash").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Process deployments table
export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  versionId: integer("version_id").references(() => versions.id),
  userId: integer("user_id").references(() => users.id),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  config: jsonb("config").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Process execution history
export const executions = pgTable("executions", {
  id: serial("id").primaryKey(),
  deploymentId: integer("deployment_id").references(() => deployments.id),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull(),
  inputType: inputSourceType("input_type").notNull(),
  inputSource: text("input_source").notNull(),
  inputMetadata: jsonb("input_metadata").notNull().default({}),
  output: jsonb("output"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const processRelations = relations(processes, ({ one, many }) => ({
  user: one(users, {
    fields: [processes.userId],
    references: [users.id],
  }),
  versions: many(versions),
}));

export const versionRelations = relations(versions, ({ one, many }) => ({
  process: one(processes, {
    fields: [versions.processId],
    references: [processes.id],
  }),
  deployments: many(deployments),
}));

export const deploymentRelations = relations(deployments, ({ one, many }) => ({
  version: one(versions, {
    fields: [deployments.versionId],
    references: [versions.id],
  }),
  user: one(users, {
    fields: [deployments.userId],
    references: [users.id],
  }),
  executions: many(executions),
}));

export const executionRelations = relations(executions, ({ one }) => ({
  deployment: one(deployments, {
    fields: [executions.deploymentId],
    references: [deployments.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertProcessSchema = createInsertSchema(processes);
export const selectProcessSchema = createSelectSchema(processes);

export const insertVersionSchema = createInsertSchema(versions);
export const selectVersionSchema = createSelectSchema(versions);

export const insertDeploymentSchema = createInsertSchema(deployments);
export const selectDeploymentSchema = createSelectSchema(deployments);

export const insertExecutionSchema = createInsertSchema(executions);
export const selectExecutionSchema = createSelectSchema(executions);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertProcess = typeof processes.$inferInsert;
export type SelectProcess = typeof processes.$inferSelect;

export type InsertVersion = typeof versions.$inferInsert;
export type SelectVersion = typeof versions.$inferSelect;

export type InsertDeployment = typeof deployments.$inferInsert;
export type SelectDeployment = typeof deployments.$inferSelect;

export type InsertExecution = typeof executions.$inferInsert;
export type SelectExecution = typeof executions.$inferSelect;