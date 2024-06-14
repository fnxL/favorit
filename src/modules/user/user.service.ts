import argon2 from 'argon2';
import { User, NewUser, CreateUser, UserRepository } from '@modules/user/';
import { DuplicateUserError, EmailAlreadyUsedError } from '@constants/errors';

class UserService {
    constructor(private readonly userRepo: UserRepository) {}

    async createUser({ password, ...rest }: NewUser) {
        const findUser = await this.userRepo.getUser(rest.username);
        if (findUser) throw new DuplicateUserError();

        if (rest.email) {
            // check if email is used;
            const user = await this.userRepo.getUser(rest.email);
            if (user) throw new EmailAlreadyUsedError();
        }

        const passwordHash = await argon2.hash(password);
        const user: CreateUser = {
            passwordHash,
            ...rest,
        };

        return this.userRepo.createUser(user);
    }
}

export default UserService;
