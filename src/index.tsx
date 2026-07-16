import { Hono } from "hono";
import accounts from "./backend/accounts";
import { deleteToken, validateTokenFromContext } from "./backend/cookies";
import { serveStatic } from "hono/bun";

import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";

const app = new Hono();

app.get("/hello", async (c) => {
  return c.html(
    <>Hello World!</>
  )
})

// ASSETS //
app.use('/static/*', serveStatic({ root: './src' }));

// ACCOUNTS //
app.route("/", accounts);

app.get("/login", async (c) => {
  const errorCode = c.req.query("error") as string;
  return c.html(
    <LoginPage errorCode={errorCode}>
    </LoginPage>
  );
});

app.get("/register", async (c) => {
  const errorCode = c.req.query("error") as string;
  return c.html(
    <RegisterPage errorCode={errorCode}>
    </RegisterPage>
  );
})

app.get("logout", async (c) => {
  deleteToken(c);
  return c.text("Logged out")
})

// PROTECTED //
app.get("/protected", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }
  return c.text("Valid token!");
})

export default app;
