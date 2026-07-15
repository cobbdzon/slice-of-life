import { LibsqlError } from "@libsql/client";
import { db } from "./db";
import * as schema from "./schema";
import { DrizzleQueryError, eq } from "drizzle-orm";

export type UserQueryResult = {
  success: boolean;
  errorType?: string;
  message?: string;
};

export type InsertUserQueryResult = UserQueryResult & {
  id?: number;
}

export type GetUserQueryResult = UserQueryResult & {
  user: schema.User;
}

// QUERIES //
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

export async function getUser(userId: number) {
  try {
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getUserFromUsername(username: string): Promise<GetUserQueryResult> {
  try {
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return {
      success: true,
      user: user as schema.User,
    }
  } catch (error) {
    throw error;
  }
}

// TODO: make delete queries
