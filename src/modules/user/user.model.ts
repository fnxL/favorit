import { InferInsertModel, relations, sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { sessions } from '@modules/auth/auth.model';

export const users = sqliteTable('users', {
    userId: integer('user_id').primaryKey({ autoIncrement: true }),
    fullName: text('full_name'),
    username: text('username').unique().notNull(),
    email: text('email').unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at')
        .default(sql`(CURRENT_TIMESTAMP)`)
        .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export type User = InferInsertModel<typeof users>;

export const userRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
}));
