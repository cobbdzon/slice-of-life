import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const entrySchema = z.object({
  year: z.coerce.number().int().min(1975).max(new Date().getFullYear() + 1),
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31)
}).refine(({ year, month, day }) => {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === (month - 1) &&
    date.getDate() === day
  )
}, { message: "Invalid calendar date!" })

const entryValidator = zValidator("param", entrySchema, (result, c) => {
  if (!result.success) {
    return c.json({
      errors: result.error.issues.map((issue) => issue.message)
    }, 400);
  }
})

export { entrySchema, entryValidator };
