import { Hono } from "hono";
import api from "./backend/api";

const app = new Hono();

app.get("/hello", async (c) => {
  return c.html(
    <>Hello World!</>
  )
})

app.route("/api", api);

export default app;
