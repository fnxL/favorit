import { InferInsertModel, relations } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { users } from '@modules/user/user.model';

export const sessions = sqliteTable('sessions', {
    sessionId: integer('session_id').primaryKey({ autoIncrement: true }),
    refreshToken: text('refresh_token'),
    userId: integer('user_id')
        .references(() => users.userId)
        .notNull(),
    device: text('device'),
    os: text('os'),
    browser: text('browser'),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.userId],
    }),
}));

export type UserSession = InferInsertModel<typeof sessions>;
