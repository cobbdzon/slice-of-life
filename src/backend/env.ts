import type { Env } from "bun";
import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string(),
  NODE_ENV: z.optional(z.string())
})

const parseEnv = envSchema.parse(process.env)

export const env = parseEnv as Env;
