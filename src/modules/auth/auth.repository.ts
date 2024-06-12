import { DbClient } from '@db';
import { UserSession, sessions } from './auth.model';
import { eq } from 'drizzle-orm';

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
}

export default AuthRepository;
