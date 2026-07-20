import { randomUUID } from "crypto";
import { Hono } from "hono";
import { getUserFromContext } from "../db/queries/auth";
import { validateTokenFromContext } from "./cookies";
import { db } from "../db/db";
import { journalAssets, type User } from "../db/schema";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

const app = new Hono();

export function getFilenameFromUrlPath(urlPath: string) {
  return urlPath.split("/").pop();
}

app.post("/upload", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  const body = await c.req.parseBody();
  const file = body["image"] as File;

  if (!file) return c.json({ message: "No file received" }, 400);

  const assetId = randomUUID();
  const fileExtension = file.name.split(".").pop();
  const filename = `${assetId}.${fileExtension}`;
  const destination = `./public/uploads/${filename}`;
  const publicUrlPath = `/static/uploads/${filename}`;

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ message: "FILE_TOO_BIG" }, 413);
  }

  // TODO: give files age unless they start belonging to an entry
  await Bun.write(destination, file);

  try {
    // TODO: db/queries/uploads.ts
    await db.insert(journalAssets).values({
      id: assetId,
      userId: user.id,
      serverPath: publicUrlPath,
      originalName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error("Database tracking inventory crash: ", error);
    return c.json({ message: "Could not save file asset information" }, 500);
  }

  return c.json({ url: publicUrlPath });
});

export default app;
