import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { processes, executions } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get all processes
  app.get("/api/processes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const allProcesses = await db.select().from(processes);
    res.json(allProcesses);
  });

  // Get single process
  app.get("/api/processes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [process] = await db
      .select()
      .from(processes)
      .where(eq(processes.id, parseInt(req.params.id)));
    
    if (!process) return res.sendStatus(404);
    res.json(process);
  });

  // Create process
  app.post("/api/processes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [process] = await db
      .insert(processes)
      .values({ ...req.body, userId: req.user.id })
      .returning();
    res.status(201).json(process);
  });

  // Execute process
  app.post("/api/processes/:id/execute", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [execution] = await db
      .insert(executions)
      .values({
        processId: parseInt(req.params.id),
        status: "pending",
        input: req.body,
      })
      .returning();
    
    // In a real app, this would trigger an async job
    const [updated] = await db
      .update(executions)
      .set({
        status: "completed",
        output: { result: "Simulated execution result" },
        completedAt: new Date(),
      })
      .where(eq(executions.id, execution.id))
      .returning();
    
    res.json(updated);
  });

  const httpServer = createServer(app);
  return httpServer;
}
