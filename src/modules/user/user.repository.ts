import { DbClient } from '@db';
import { User, users } from './user.model';
import { eq, getTableColumns } from 'drizzle-orm';

type GetUserType = Promise<
    | {
          userId: number;
          fullName: string | null;
          username: string;
          email: string | null;
          createdAt: string | null;
          updatedAt: string | null;
      }
    | undefined
>;

class UserRepository {
    private readonly db: DbClient;

    constructor(db: DbClient) {
        this.db = db;
    }

    async createUser(user: User) {
        const { passwordHash, ...rest } = getTableColumns(users);
        return this.db
            .insert(users)
            .values(user)
            .returning({
                ...rest,
            });
    }

    async getUser(userId: number): GetUserType;
    async getUser(email: string): GetUserType;
    async getUser(username: string): GetUserType;
    async getUser(param: string | number) {
        if (typeof param === 'number') {
            return this.getUserById(param);
        }

        if (this.isEmail(param)) {
            return this.getUserByEmail(param);
        }

        return this.getUserByUsername(param);
    }

    private async getUserById(userId: number) {
        return this.db.query.users.findFirst({
            columns: {
                passwordHash: false,
            },
            where: eq(users.userId, userId),
        });
    }

    private async getUserByEmail(email: string) {
        return this.db.query.users.findFirst({
            columns: {
                passwordHash: false,
            },
            where: eq(users.email, email),
        });
    }

    private async getUserByUsername(username: string) {
        return this.db.query.users.findFirst({
            columns: {
                passwordHash: false,
            },
            where: eq(users.username, username),
        });
    }

    private isEmail(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async getPasswordHash(userId: number) {
        const obj = await this.db.query.users.findFirst({
            columns: {
                passwordHash: true,
            },
            where: eq(users.userId, userId),
        });
        return obj?.passwordHash;
    }
}

export default UserRepository;
