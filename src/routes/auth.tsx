// routes/auth.ts

import { Hono } from "hono";
import { getUserFromUsername, insertUser } from "../db/queries/auth";
import { authValidator } from "../schemas/auth";
import { generateToken, setToken, deleteToken } from "../backend/cookies";
import { logger } from "../backend/logger";

import { LoginPage } from "../pages/Login";
import { RegisterPage } from "../pages/Register";

// dummy hash so not-found and wrong-password take similar time (anti-enumeration)
const DUMMY_PASSWORD_HASH = await Bun.password.hash("dummy-password-for-timing");

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
  logger.info(`login attempt: ${username}`);

  // verify against user or dummy hash for similar timing
  const user = await getUserFromUsername(username);
  const passwordMatches = user
    ? await Bun.password.verify(password, user.passwordHash)
    : await Bun.password.verify(password, DUMMY_PASSWORD_HASH);

  // same error for unknown user and wrong password (anti-enumeration)
  if (!user || !passwordMatches) {
    logger.info(`login failed: ${username}`);
    return c.redirect("/login?error=INVALID_CREDENTIALS");
  }

  const token = await generateToken(user.id);
  setToken(c, token);

  logger.info(`login success: ${username}`)
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
  logger.info(`register attempt: ${username}`);

  const { success, errorType, message } = await insertUser(username, password);
  if (success) {
    return c.redirect("/login?registration=SUCCESS");
  } else if (typeof (message) === "string") {
    if (errorType === "USERNAME_TAKEN") {
      return c.redirect("/register?error=USERNAME_TAKEN")
    } else {
      c.redirect("/register?error=INTERNAL_SERVER_ERROR");
    }
    return c.text(message);
  }
})

app.get("/logout", async (c) => {
  deleteToken(c);
  return c.redirect("/login");
})

export default app;

