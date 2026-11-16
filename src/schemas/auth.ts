import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const authSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters!"
  })
})

const authValidator = zValidator("form", authSchema, (result, c) => {
  if (!result.success) {
    const target = c.req.path.includes("register") ? "/register" : "/login";
    return c.redirect(`${target}?error=VALIDATION_ERROR`);
  }
})

export { authSchema, authValidator };