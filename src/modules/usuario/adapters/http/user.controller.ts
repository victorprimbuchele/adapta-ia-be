import type { Request, Response } from "express";

import { getAuthenticatedUser as getRequestUser } from "../../../../shared/auth/authenticate.js";
import type { GetAuthenticatedUser } from "../../application/get-authenticated-user.js";
import type { RegisterUser } from "../../application/register-user.js";
import { toPublicUser } from "../../domain/user.js";
import { createUserSchema } from "./create-user.dto.js";

export class UserController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly getAuthenticatedUser: GetAuthenticatedUser,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = createUserSchema.parse(req.body);

    const user = await this.registerUser.execute({
      name,
      email,
      password,
    });

    res.status(201).json(toPublicUser(user));
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const { sub: userId } = getRequestUser(req);

    const user = await this.getAuthenticatedUser.execute(userId);

    res.status(200).json(toPublicUser(user));
  };
}
