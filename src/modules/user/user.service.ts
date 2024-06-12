import argon2 from 'argon2';
import { User, NewUser, UserRepository } from '@modules/user/';
import { DuplicateUserError, EmailAlreadyUsedError } from '@constants/errors';

class UserService {
    private userRepo: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepo = userRepository;
    }

    async createUser({ password, ...rest }: NewUser) {
        // check if user already exists.
        const user = await this.userRepo.getUser(rest.username);

        if (user) throw new DuplicateUserError();

        if (rest.email) {
            // check if email is used;
            const user = await this.userRepo.getUser(rest.email);
            if (user) throw new EmailAlreadyUsedError();
        }

        const passwordHash = await argon2.hash(password);

        const newUser: User = {
            passwordHash,
            ...rest,
        };

        return this.userRepo.createUser(newUser);
    }
}

export default UserService;
