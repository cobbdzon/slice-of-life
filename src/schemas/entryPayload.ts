import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { env } from "../backend/env";

// imagePaths must match exactly the assets our own upload endpoint produces:
// <UPLOAD_URL_PREFIX>/<uuid32>.<safe-ext>. Blocks ../, absolute paths,
// cross-extension references, and any client-forged filename.
const escapedPrefix = env.UPLOAD_URL_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const imagePathPattern = new RegExp(
  `^${escapedPrefix}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpe?g|png|webp|gif|avif)$`,
  "i"
);

const entryPayloadSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title is too long"),
  note: z.string().trim().min(1, "Journal thoughts cannot be empty"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  imagePaths: z.array(z.string().regex(imagePathPattern, "Invalid image path"))
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
