import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const entryPayloadSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title is too long"),
  note: z.string().trim().min(1, "Journal thoughts cannot be empty"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  imagePaths: z.array(z.string())
    .max(10, "You can only save up to 10 images per entry")
});

const entryPayloadValidator = zValidator("json", entryPayloadSchema, (result, c) => {
  if (!result.success) {
    return c.json({
      errors: result.error.issues.map((issue) => issue.message)
    }, 400);
  }
})

export { entryPayloadSchema, entryPayloadValidator };
