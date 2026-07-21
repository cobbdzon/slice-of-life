import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export type User = typeof users.$inferSelect;
export type JournalEntry = {
  id: string;
  date: Date;
  title: string;
  note: string;
  imagePaths: string[];
  userId?: number;
}
export type DBJournalEntry = typeof journalEntries.$inferInsert;
export type JournalAsset = typeof journalAssets.$inferInsert;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const journalEntries = sqliteTable("entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // only added when saving a JournalEntry
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  note: text("note").notNull(),

  date: text("date").notNull(),

  imagePaths: text("image_paths", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),

  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const journalAssets = sqliteTable("journal_assets", {
  id: text("id").primaryKey(), // Crypto.randomUUID()
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  entryId: text("entry_id")
    .references(() => journalEntries.id, { onDelete: "set null" }),

  serverPath: text("server_path").notNull().unique(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});


export const usersRelations = relations(users, (r) => ({
  entries: r.many(journalEntries),
}));

export const entriesRelations = relations(journalEntries, (r) => ({
  author: r.one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
  assets: r.many(journalAssets),
}));

export const assetsRelations = relations(journalAssets, (r) => ({
  author: r.one(users, {
    fields: [journalAssets.userId],
    references: [users.id],
  }),
  entry: r.one(journalEntries, {
    fields: [journalAssets.entryId],
    references: [journalEntries.id],
  })
}))
