import { Hono } from "hono";
import * as queries from "../db/queries";
import { registrationValidator } from "../schemas/registration";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import { env } from "./env";

const api = new Hono();

// TODO: MOVE TO COOKIES.TS, WITH A VALIDATOR FUNCTION
// TODO: COOKIES ZOD VALIDATOR
export async function generateToken(id: number) {
  const secret = env.JWT_SECRET;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: id, // subject
    iat: now, // issued at
    exp: now + 1 * 60 * 60 // expiration (1 hour)
  };
  return await sign(payload, secret);
}

export const tokenOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV == "production",
  sameSite: "Lax",
  path: "/",
  maxAge: 3600,
}

api.post("/register", registrationValidator, async (c) => {
  const body = c.req.valid("json");
  const { username, password } = body;
  console.log(`${username} is attempting to register!`);

  const { success, errorType, message, id } = await queries.insertUser(username, password);
  if (success && id) {
    const token = await generateToken(id);
    setCookie(c, "AUTH_TOKEN", token, tokenOptions);
    return c.text(`success, your user id is ${id}`);
  } else if (typeof (message) == "string") {
    if (errorType == "USERNAME_TAKEN") {
      c.status(409);
    } else {
      c.status(500);
    }
    return c.text(message);
  }
})

api.post("/login", registrationValidator, async (c) => {
  const body = c.req.valid("json");
  const { username, password } = body;
  console.log(`${username} is attempting to log in!`);

  // validate username
  const { user } = await queries.getUserFromUsername(username);
  if (!user) {
    c.status(401);
    return c.text("user not found");
  }

  // validate password
  const isCorrectPassword = await Bun.password.verify(password, user.passwordHash);
  if (!isCorrectPassword) {
    c.status(401);
    return c.text("Wrong password!");
  }

  const token = await generateToken(user.id);
  setCookie(c, "AUTH_TOKEN", token, tokenOptions);

  console.log(`${username} sucessfully logged in!`)
  return c.text(`Successfully logged in as ${username}`);
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
