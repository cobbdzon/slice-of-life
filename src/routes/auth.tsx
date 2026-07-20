// routes/auth.ts

import { Hono } from "hono";
import { getUserFromUsername, insertUser } from "../db/queries/auth";
import { authValidator } from "../schemas/auth";
import { generateToken, setToken, deleteToken } from "../backend/cookies";

import { LoginPage } from "../pages/Login";
import { RegisterPage } from "../pages/Register";

const app = new Hono();

app.get("/login", async (c) => {
  const errorCode = c.req.query("error") as string;
  return c.html(
    <LoginPage errorCode={errorCode}>
    </LoginPage>
  );
});

app.post("/login", authValidator, async (c) => {
  const body = c.req.valid("form");
  const { username, password } = body;
  console.log(`${username} is attempting to log in!`);

  // validate username
  const user = await getUserFromUsername(username);
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

app.get("/register", async (c) => {
  const errorCode = c.req.query("error") as string;
  return c.html(
    <RegisterPage errorCode={errorCode}>
    </RegisterPage>
  );
})

app.post("/register", authValidator, async (c) => {
  const body = c.req.valid("form");
  const { username, password } = body;
  console.log(`${username} is attempting to register!`);

  const { success, errorType, message } = await insertUser(username, password);
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

app.get("logout", async (c) => {
  deleteToken(c);
  return c.redirect("/login");
})

export default app;

