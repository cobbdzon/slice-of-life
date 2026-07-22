import { Hono } from "hono";
import { validateTokenFromContext } from "../backend/cookies";
import { getUserFromContext } from "../db/queries/auth";
import { ProfilePage } from "../pages/Profile";
import type { User } from "../db/schema";

const app = new Hono();

app.get("/profile", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/");
  }

  const user = await getUserFromContext(c) as User;

  return c.html(
    <ProfilePage user={user}/>
  )
})

export default app;
