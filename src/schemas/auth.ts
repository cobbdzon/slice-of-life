import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const authSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8, {
    message: "Pasword must be at least 8 characters!"
  })
})

const authValidator = zValidator("form", authSchema, (result, c) => {
  if (!result.success) {
    return c.json({
      errors: result.error.issues.map((issue) => issue.message)
    }, 400);
  }
})

export { authSchema, authValidator };
