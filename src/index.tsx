import { Hono } from "hono";
import authRoutes from "./routes/auth.tsx";
import entryRoutes from "./routes/entry.tsx";
import uploadsApi from "./backend/uploads.ts"
import { serveStatic } from "hono/bun";

const app = new Hono();


app.use(
  '/static/uploads/*',
  serveStatic({
    root: './public',
    rewriteRequestPath: (path) => path.replace(/^\/static/, '')
  })
);
app.use('/static/*', serveStatic({ root: './src' }));

app.route("/", authRoutes);
app.route("/", entryRoutes);

app.route("/api", uploadsApi);

export default app;
