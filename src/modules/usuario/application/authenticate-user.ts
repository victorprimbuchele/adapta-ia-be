import bcrypt from "bcrypt";

import { InvalidCredentialsError } from "../domain/errors.js";
import type { User } from "../domain/user.js";
import type { UserRepository } from "../ports/user-repository.js";

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export class AuthenticateUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: AuthenticateUserInput): Promise<User> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    return user;
  }
}
