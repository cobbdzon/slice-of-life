import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import authRoutes from "./routes/auth.tsx";
import entryRoutes from "./routes/entry.tsx";
import profileRoutes from "./routes/profile.tsx";
import uploadsApi, { startGarbageCollectionLoop } from "./backend/uploads.ts"
import { logger } from "./backend/logger";
import { ErrorPage } from "./pages/ErrorPage";

const app = new Hono();

// Serve static assets + uploaded files under /static/* → ./public/*
app.use(
  '/static/*',
  serveStatic({
    root: './public',
    rewriteRequestPath: (path) => path.replace(/^\/static/, '')
  })
);

app.route("/", authRoutes);
app.route("/", profileRoutes);

app.route("/api", uploadsApi);
app.route("/", entryRoutes);

startGarbageCollectionLoop();

const isApiRequest = (path: string) => path.startsWith("/api");

app.notFound((c) => {
  c.status(404);
  if (isApiRequest(c.req.path)) {
    return c.json({ error: "Not Found" }, 404);
  }
  return c.html(
    <ErrorPage
      status={404}
      title="Page not found"
      message="The page you're looking for doesn't exist or has moved."
    />
  );
});

app.onError((err, c) => {
  logger.error(`unhandled error: ${(err as Error).message}`);
  if (isApiRequest(c.req.path)) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
  return c.html(
    <ErrorPage
      status={500}
      title="Something went wrong"
      message="An unexpected error occurred. Please try again."
    />
  );
});

export default app;
