import { DbClient } from '@db';
import { UserSession, sessions } from './auth.model';
import { eq } from 'drizzle-orm';
import { users } from '@modules/user';

type UpdateSession = Omit<UserSession, 'userId'>;
class AuthRepository {
    private readonly db: DbClient;

    constructor(db: DbClient) {
        this.db = db;
    }

    async createSession(session: UserSession) {
        return this.db.insert(sessions).values(session).returning();
    }

    async updateSession(sessionId: number, session: UpdateSession) {
        return this.db
            .update(sessions)
            .set({
                refreshToken: session.refreshToken,
            })
            .where(eq(sessions.sessionId, sessionId));
    }

    async getSession(refreshToken: string) {
        return this.db.query.sessions.findFirst({
            with: {
                user: true,
            },
            where: eq(sessions.refreshToken, refreshToken),
        });
    }

    async deleteSession(refreshToken: string) {
        return this.db
            .delete(sessions)
            .where(eq(sessions.refreshToken, refreshToken));
    }

    async deleteAllSessions(userId: number) {
        return this.db.delete(sessions).where(eq(users.userId, userId));
    }
}

export default AuthRepository;
