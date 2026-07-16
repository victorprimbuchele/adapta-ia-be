import { UserNotFoundError } from "../domain/errors.js";
import type { User } from "../domain/user.js";
import type { UserRepository } from "../ports/user-repository.js";

export class GetAuthenticatedUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}
