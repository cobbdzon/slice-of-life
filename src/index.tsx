import { Hono } from "hono";
import authRoutes from "./routes/auth.tsx";
import entryRoutes from "./routes/entry.tsx";
import profileRoutes from "./routes/profile.tsx";
import uploadsApi, { startGarbageCollectionLoop } from "./backend/uploads.ts"
import { serveStatic } from "hono/bun";
import { env } from "./backend/env";

const app = new Hono();

// Serve uploaded files: URL prefix (e.g. /static/uploads/) → disk dir (e.g. ./public/uploads/)
app.use(
  `${env.UPLOAD_URL_PREFIX}*`,
  serveStatic({
    root: './public',
    rewriteRequestPath: (path) => path.replace(/^\/static/, '')
  })
);
app.use('/static/*', serveStatic({ root: './src' }));

app.route("/", authRoutes);
app.route("/", profileRoutes);

app.route("/api", uploadsApi);
app.route("/", entryRoutes);

startGarbageCollectionLoop();

export default app;
