import { DbClient } from '@db';
import { CreateUser, User, users } from './user.model';
import { eq, getTableColumns } from 'drizzle-orm';

class UserRepository {
    private readonly db: DbClient;

    constructor(db: DbClient) {
        this.db = db;
    }

    async createUser(user: CreateUser) {
        const { passwordHash, ...rest } = getTableColumns(users);
        return this.db
            .insert(users)
            .values(user)
            .returning({
                ...rest,
            });
    }

    async getUser(userId: number): Promise<User | undefined>;
    async getUser(email: string): Promise<User | undefined>;
    async getUser(username: string): Promise<User | undefined>;
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
            where: eq(users.userId, userId),
        });
    }

    private async getUserByEmail(email: string) {
        return this.db.query.users.findFirst({
            where: eq(users.email, email),
        });
    }

    private async getUserByUsername(username: string) {
        return this.db.query.users.findFirst({
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
