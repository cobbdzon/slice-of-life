import { Hono } from "hono";
import * as queries from "../db/queries";
import { loginValidator } from "../schemas/login";
import { generateToken, setToken } from "./cookies";

const app = new Hono();

app.post("/register", loginValidator, async (c) => {
  const body = c.req.valid("form");
  const { username, password } = body;
  console.log(`${username} is attempting to register!`);

  const { success, errorType, message } = await queries.insertUser(username, password);
  if (success) {
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
  const user = await queries.getUserFromUsername(username);
  if (!user) {
    return c.redirect("/login?error=USER_DOES_NOT_EXIST");
  }

  // validate password
  const isCorrectPassword = await Bun.password.verify(password, user.passwordHash);
  if (!isCorrectPassword) {
    return c.redirect("/login?error=INCORRECT_PASDWORD");
  }

  const token = await generateToken(user.id);
  setToken(c, token);

  console.log(`${username} sucessfully logged in!`)
  return c.redirect("/");
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
