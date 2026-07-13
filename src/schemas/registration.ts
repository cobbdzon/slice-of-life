import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const registrationSchema = z.object({
  username: z.string(),
  password: z.string().min(8, {
    message: "Pasword must be at least 8 characters!"
  })
})

const registrationValidator = zValidator("json", registrationSchema, (result, c) => {
  if (!result.success) {
    return c.json({
      errors: result.error.issues.map((issue) => issue.message)
    }, 400);
  }
})

export { registrationSchema, registrationValidator };
