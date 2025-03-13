import { Express, Request, Response, NextFunction } from "express";
import { createServer } from "vite";
import { Server } from "http";
import path from "path";
import fs from "fs";
import { log } from "./utils/logger";

export async function setupVite(app: Express, server: Server) {
  try {
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
      server: {
        middlewareMode: true,
        hmr: { server },
        watch: {
          usePolling: false,
          interval: 1000,
        },
        cors: true,
      },
      appType: "custom",
      base: "/",
    });

    app.use(vite.middlewares);

    // Handle SPA routing
    app.use("*", async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;

      try {
        // Always serve index.html for client-side routes
        const indexPath = path.resolve(__dirname, "..", "client", "index.html");
        
        if (!fs.existsSync(indexPath)) {
          log(`Cannot find index.html at ${indexPath}`, "error");
          return next(new Error(`Cannot find index.html at ${indexPath}`));
        }

        let html = await fs.promises.readFile(indexPath, "utf-8");
        html = await vite.transformIndexHtml(url, html);
        
        res.status(200)
           .set({ "Content-Type": "text/html" })
           .end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    log("Vite middleware successfully set up");
    return vite;
  } catch (error) {
    log(`Failed to setup Vite: ${(error as Error).message}`, "error");
    throw error;
  }
}

async function createViteServer(config: any) {
  try {
    return await createServer(config);
  } catch (error) {
    log(`Failed to create Vite server: ${(error as Error).message}`, "error");
    throw error;
  }
}
