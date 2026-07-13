import { Hono } from "hono";
import * as queries from "./db/queries";

const app = new Hono();

app.get("/hello", async (c) => {
  return c.html(
    <>Hello World!</>
  )
})

app.post("/register", async (c) => {
  const body = await c.req.json();
  const { username, password } = body;
})

export default app;
