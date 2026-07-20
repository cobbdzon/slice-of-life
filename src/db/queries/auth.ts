import { db } from "../db";
import * as schema from "../schema";
import { getToken, getUserIdFromToken } from "../../backend/cookies";

import { DrizzleQueryError, eq } from "drizzle-orm";
import { LibsqlError } from "@libsql/client";
import type { Context } from "hono";

export type UserQueryResult = {
  success: boolean;
  errorType?: string;
  message?: string;
};

export type InsertUserQueryResult = UserQueryResult & {
  id?: number;
}

export async function insertUser(username: string, password: string): Promise<InsertUserQueryResult> {
  const passwordHash = await Bun.password.hash(password)
  try {
    return await db.insert(schema.users).values({
      username: username,
      passwordHash: passwordHash
    }).returning({
      id: schema.users.id
    }).then((insertedIds) => {
      console.log(`${username} has successfully registered!`)
      return {
        success: true,
        id: insertedIds[0]?.id
      }
    })
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      const queryErrorCause = error.cause as LibsqlError;
      if (queryErrorCause.code == "SQLITE_CONSTRAINT" && queryErrorCause.message.includes("users.username")) {
        console.warn(`${username} is already taken!`);
        return {
          success: false,
          errorType: "USERNAME_TAKEN",
          message: "This username is already taken!"
        }
      }
    }
    throw error;
  }
}

export async function getUser(userId: number): Promise<schema.User | null> {
  try {
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    return user as schema.User;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getUserFromUsername(username: string): Promise<schema.User | null> {
  try {
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return user as schema.User;
  } catch (error) {
    throw error;
  }
}

export async function getUserFromContext(c: Context): Promise<schema.User | null> {
  const token = await getToken(c);
  if (!token) {
    return null;
  }
  const userId = await getUserIdFromToken(token);
  if (!userId) {
    return null;
  }
  const user = await getUser(userId);
  return user;
}
