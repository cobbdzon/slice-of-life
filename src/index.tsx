import { Hono } from "hono";
import accounts from "./backend/accounts";
import { deleteToken, validateTokenFromContext } from "./backend/cookies";

import { LoginLayout } from "./layouts/login";
import { RegisterLayout } from "./layouts/register";

const app = new Hono();

app.get("/hello", async (c) => {
  return c.html(
    <>Hello World!</>
  )
})

// ACCOUNTS //
app.route("/", accounts);

app.get("/login", async (c) => {
  return c.html(
    <LoginLayout>
    </LoginLayout>
  );
})

app.get("/register", async (c) => {
  return c.html(
    <RegisterLayout>
    </RegisterLayout>
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
