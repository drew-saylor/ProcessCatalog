import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { processes, versions, deployments, executions } from "@db/schema";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Create uploads directory if it doesn't exist
  import("fs").then(({ mkdir }) => {
    mkdir("uploads", { recursive: true }, (err) => {
      if (err && err.code !== "EEXIST") {
        console.error("Error creating uploads directory:", err);
      }
    });
  });

  // Get all processes
  app.get("/api/processes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const allProcesses = await db.select().from(processes);
    res.json(allProcesses);
  });

  // Get single process with its versions
  app.get("/api/processes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [process] = await db
      .select()
      .from(processes)
      .where(eq(processes.id, parseInt(req.params.id)));

    if (!process) return res.sendStatus(404);

    const processVersions = await db
      .select()
      .from(versions)
      .where(eq(versions.processId, process.id));

    res.json({ ...process, versions: processVersions });
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

  // Create process version
  app.post("/api/processes/:id/versions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [version] = await db
      .insert(versions)
      .values({
        ...req.body,
        processId: parseInt(req.params.id),
      })
      .returning();
    res.status(201).json(version);
  });

  // Get user's deployments
  app.get("/api/deployments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userDeployments = await db
      .select()
      .from(deployments)
      .where(eq(deployments.userId, req.user.id));
    res.json(userDeployments);
  });

  // Create deployment
  app.post("/api/versions/:id/deploy", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [deployment] = await db
      .insert(deployments)
      .values({
        ...req.body,
        versionId: parseInt(req.params.id),
        userId: req.user.id,
      })
      .returning();
    res.status(201).json(deployment);
  });

  // Execute deployment with file upload support
  app.post("/api/deployments/:id/execute", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Verify deployment ownership
    const [deployment] = await db
      .select()
      .from(deployments)
      .where(
        and(
          eq(deployments.id, parseInt(req.params.id)),
          eq(deployments.userId, req.user.id)
        )
      );

    if (!deployment) return res.sendStatus(404);

    const inputType = req.body.inputType as "direct" | "file" | "bigquery";
    let inputSource = req.body.inputSource;
    let inputMetadata = {};

    try {
      // Handle different input types
      switch (inputType) {
        case "file":
          if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
          }
          inputSource = req.file.path;
          inputMetadata = {
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          };
          break;

        case "bigquery":
          // Validate BigQuery table format (project.dataset.table)
          if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(inputSource)) {
            return res.status(400).json({
              error: "Invalid BigQuery table format. Use project.dataset.table",
            });
          }
          break;

        case "direct":
          // Validate JSON input
          try {
            JSON.parse(inputSource);
          } catch (e) {
            return res.status(400).json({ error: "Invalid JSON input" });
          }
          break;

        default:
          return res.status(400).json({ error: "Invalid input type" });
      }

      const [execution] = await db
        .insert(executions)
        .values({
          deploymentId: deployment.id,
          status: "pending",
          inputType,
          inputSource,
          inputMetadata,
        })
        .returning();

      // In a real app, this would trigger an async job based on the input type
      const [updated] = await db
        .update(executions)
        .set({
          status: "completed",
          output: { result: `Simulated execution result for ${inputType} input` },
          completedAt: new Date(),
        })
        .where(eq(executions.id, execution.id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Execution error:", error);
      res.status(500).json({ error: "Failed to execute deployment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}