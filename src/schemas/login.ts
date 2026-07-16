import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8, {
    message: "Pasword must be at least 8 characters!"
  })
})

// TODO: ADD CLIENT SIDE CHECKS TO PREVENT TRIGGERING THIS
const loginValidator = zValidator("form", loginSchema, (result, c) => {
  if (!result.success) {
    return c.json({
      errors: result.error.issues.map((issue) => issue.message)
    }, 400);
  }
})

export { loginSchema, loginValidator };
