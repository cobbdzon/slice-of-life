import { Hono } from "hono";
import * as queries from "../db/queries";
import { registrationValidator } from "../schemas/registration";

const api = new Hono();

api.post("/register", registrationValidator, async (c) => {
  const body = await c.req.json();
  const { username, password } = body;
  console.log(`${username} is attempting to register!`);

  const { success, message, id } = await queries.insertUser(username, password);
  if (success && id) {
    return c.text(`success, your user id is ${id}`);
  } else if (typeof (message) == "string") {
    return c.text(message);
  }
})

api.get("/user/:username", async (c) => {
  const username = c.req.param("username");
  if (!username) {
    return c.status(400);
  }

  const { user } = await queries.getUserFromUsername(username);
  if (!user) {
    return c.status(404);
  }

  return c.json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  });
})

export default api;
