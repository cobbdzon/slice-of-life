import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export type User = typeof users.$inferSelect;
export type JournalEntry = {
  id: string;
  date: Date;
  title: string;
  note: string;
  imagePaths: string[];
}

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const entries = sqliteTable("entries", {
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

export const usersRelations = relations(users, (r) => ({
  entries: r.many(entries),
}));

export const entriesRelations = relations(entries, (r) => ({
  author: r.one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
}));
