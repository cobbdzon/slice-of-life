import { Hono } from "hono";
import accounts from "./backend/accounts";
import { getPayloadFromToken, getToken, deleteToken } from "./backend/cookies";
import { getUser } from "./db/queries"

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

// PROTECTED //

// protected path template
// could be turned into a helper function
app.get("/protected", async (c) => {
  // validate token
  const token = await getToken(c);
  if (!token) {
    console.log("No token")
    return c.redirect("/login");
  }

  // validate token payload
  const payload = await getPayloadFromToken(token);
  if (!payload) {
    console.log("No payload found from token")
    deleteToken(c);
    return c.redirect("/login");
  }

  // validate if user exists
  const userId = payload.sub;
  const user = await getUser(userId);
  if (!user) {
    console.log("No user found from payload")
    deleteToken(c);
    return c.redirect("/login");
  }

  // validate if token is expired
  const expiryTime = payload.exp;
  const now = Math.floor(Date.now() / 1000);
  if (now > expiryTime) {
    console.log("Token is expired")
    deleteToken(c);
    return c.redirect("/login");
  }

  return c.text("Valid token!");
})

export default app;
