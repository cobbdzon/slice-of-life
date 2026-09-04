import { stat } from "fs/promises";
import { z } from "zod";
import { logger } from "./logger";

const envSchema = z.object({
  MAX_UPLOAD_FILE_SIZE: z.coerce.number().min(1), // in mb
  GARBAGE_COLLECT_INTERVAL: z.coerce.number(), // in minutes
  UPLOAD_FILE_STALE_THRESHOLD: z.coerce.number().min(5), // in minutes

  UPLOAD_DIR: z.string(), // disk directory for uploaded files (e.g. ./public/uploads/)
  UPLOAD_URL_PREFIX: z.string(), // URL prefix that serves uploaded files (e.g. /static/uploads/)
  JWT_SECRET: z.string(),
  NODE_ENV: z.optional(z.string()),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
})

const parseEnv = envSchema.parse(process.env)

// validate upload directory exists
const uploadDirStat = await stat(parseEnv.UPLOAD_DIR);
if (!uploadDirStat.isDirectory()) {
  logger.error(`UPLOAD_DIR does not exist or is not a directory: ${parseEnv.UPLOAD_DIR}`);
} else if (parseEnv.UPLOAD_DIR.at(-1) != "/") {
  logger.warn("UPLOAD_DIR missing trailing slash");
}

if (parseEnv.UPLOAD_URL_PREFIX.at(-1) != "/") {
  logger.warn("UPLOAD_URL_PREFIX missing trailing slash");
}

export const env = parseEnv as z.infer<typeof envSchema>;
