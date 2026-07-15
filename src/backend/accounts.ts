import { Hono } from "hono";
import * as queries from "../db/queries";
import { loginValidator } from "../schemas/login";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import { env } from "./env";

const app = new Hono();

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

app.post("/register", loginValidator, async (c) => {
  const body = c.req.valid("form");
  const { username, password } = body;
  console.log(`${username} is attempting to register!`);

  const { success, errorType, message } = await queries.insertUser(username, password);
  if (success) {
    // const token = await generateToken(id);
    // setCookie(c, "AUTH_TOKEN", token, tokenOptions);
    return c.redirect("/login?registration=SUCCESS");
  } else if (typeof (message) == "string") {
    if (errorType == "USERNAME_TAKEN") {
      return c.redirect("/register?error=USERNAME_TAKEN")
    } else {
      c.redirect("/register?error=INTERNAL_SERVER_ERROR");
    }
    return c.text(message);
  }
})

app.post("/login", loginValidator, async (c) => {
  const body = c.req.valid("form");
  const { username, password } = body;
  console.log(`${username} is attempting to log in!`);

  // validate username
  const { user } = await queries.getUserFromUsername(username);
  if (!user) {
    return c.redirect("/login?error=USER_DOES_NOT_EXIST");
  }

  // validate password
  const isCorrectPassword = await Bun.password.verify(password, user.passwordHash);
  if (!isCorrectPassword) {
    return c.redirect("/login?error=INCORRECT_PASDWORD");
  }

  const token = await generateToken(user.id);
  setCookie(c, "AUTH_TOKEN", token, tokenOptions);

  console.log(`${username} sucessfully logged in!`)
  return c.redirect("/dashboard");
})

// app.get("/user/:username", async (c) => {
//   const username = c.req.param("username");
//   if (!username) {
//     return c.status(400);
//   }
//
//   const { user } = await queries.getUserFromUsername(username);
//   if (!user) {
//     return c.status(404);
//   }
//
//   return c.json({
//     id: user.id,
//     username: user.username,
//     createdAt: user.createdAt
//   });
// })

export default app;
