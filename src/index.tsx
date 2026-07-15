import { Hono } from "hono";
import accounts from "./backend/accounts";

import { LoginLayout } from "./layouts/login";
import { RegisterLayout } from "./layouts/register";

const app = new Hono();

app.get("/hello", async (c) => {
  return c.html(
    <>Hello World!</>
  )
})

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

app.route("/", accounts);

export default app;
