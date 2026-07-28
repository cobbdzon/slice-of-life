import { stat } from "fs/promises";
import { z } from "zod";

const envSchema = z.object({
  MAX_UPLOAD_FILE_SIZE: z.coerce.number().min(1), // in mb
  GARBAGE_COLLECT_INTERVAL: z.coerce.number(), // in minutes
  UPLOAD_FILE_STALE_THRESHOLD: z.coerce.number().min(5), // in minutes

  IMAGE_UPLOAD_PATH: z.string(),
  IMAGE_URL_PATH: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z.optional(z.string())
})

const parseEnv = envSchema.parse(process.env)

// validate env
const imageUploadPath = await stat(parseEnv.IMAGE_UPLOAD_PATH);
if (!imageUploadPath.isDirectory()) {
  console.error(`Path: "${imageUploadPath}, does not exist!"`);
} else if (parseEnv.IMAGE_UPLOAD_PATH.at(-1) != "/") {
  console.error("IMAGE_UPLOAD_PATH does not have a trailing slash!");
}

if (parseEnv.IMAGE_URL_PATH.at(-1) != "/") {
  console.error("IMAGE_URL_PATH does not have a trailing slash!");
}

export const env = parseEnv as z.infer<typeof envSchema>;
