import { and, eq, isNotNull, lte } from "drizzle-orm";
import { db } from "../db/db";
import { journalAssets, journalEntries, users, type User } from "../db/schema";
import { env } from "./env";
import { logger } from "./logger";
import { toSafeUploadFilename } from "./imageProcessing";

const SWEEP_INTERVAL_MS = 60 * 1000;

export function isUserExpired(user: User): boolean {
  return (
    env.TEST_INSTANCE &&
    user.testExpiresAt != null &&
    user.testExpiresAt <= Date.now()
  );
}

async function deleteUserFiles(userId: number): Promise<void> {
  const assets = await db
    .select()
    .from(journalAssets)
    .where(eq(journalAssets.userId, userId));

  await Promise.all(
    assets.map(async (asset) => {
      const filename = toSafeUploadFilename(asset.serverPath);
      if (!filename) return;
      try {
        const file = Bun.file(`${env.UPLOAD_DIR}${filename}`);
        if (await file.exists()) {
          await file.delete();
        }
      } catch (error) {
        logger.error(`expired account file delete failed: ${(error as Error).message}`);
      }
    })
  );
}

export async function purgeUser(userId: number): Promise<void> {
  await deleteUserFiles(userId);

  await db.transaction(async (tx) => {
    await tx.delete(journalAssets).where(eq(journalAssets.userId, userId));
    await tx.delete(journalEntries).where(eq(journalEntries.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });

  logger.info(`purged expired test account: ${userId}`);
}

export async function purgeExpiredTestUsers(): Promise<number> {
  if (!env.TEST_INSTANCE) return 0;

  const expired = await db
    .select()
    .from(users)
    .where(
      and(isNotNull(users.testExpiresAt), lte(users.testExpiresAt, Date.now()))
    );

  for (const user of expired) {
    await purgeUser(user.id);
  }

  return expired.length;
}

export function startTestAccountSweep(): void {
  if (!env.TEST_INSTANCE) return;

  (async () => {
    while (true) {
      try {
        const purged = await purgeExpiredTestUsers();
        if (purged > 0) {
          logger.info(`test account sweep purged ${purged} account(s)`);
        }
      } catch (error) {
        logger.error(`test account sweep failed: ${(error as Error).message}`);
      }
      await Bun.sleep(SWEEP_INTERVAL_MS);
    }
  })();
}
