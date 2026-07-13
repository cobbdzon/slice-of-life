import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const entries = sqliteTable('entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  caption: text('caption').notNull(),
  imagePath: text('image_path'),

  displayTime: text('display_time').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;

export const usersRelations = relations(users, (r) => ({
  entries: r.many(entries),
}));

export const entriesRelations = relations(entries, (r) => ({
  author: r.one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
}));
