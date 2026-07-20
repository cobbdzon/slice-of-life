import { Hono } from "hono";
import authRoutes from "./routes/auth.tsx";
import entryRoutes from "./routes/entry.tsx";
import { serveStatic } from "hono/bun";

const app = new Hono();


app.use('/static/*', serveStatic({ root: './src' }));

app.route("/", authRoutes);
app.route("/", entryRoutes);

export default app;
