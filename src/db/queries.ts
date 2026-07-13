import { db } from "./db.ts";
import * as schema from "./schema.ts";

// QUERIES //
export async function insertUser(username: string, password: string) {
  const passwordHash = await Bun.password.hash(password)
  return await db.insert(schema.users).values({
    username: username,
    passwordHash: passwordHash
  }).returning({
    id: schema.users.id
  })
}
