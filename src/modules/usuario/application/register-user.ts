import bcrypt from "bcrypt";

import { EmailAlreadyInUseError } from "../domain/errors.js";
import type { User } from "../domain/user.js";
import type { UserRepository } from "../ports/user-repository.js";

const SALT_ROUNDS = 10;

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class RegisterUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new EmailAlreadyInUseError(input.email);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    return this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
  }
}
