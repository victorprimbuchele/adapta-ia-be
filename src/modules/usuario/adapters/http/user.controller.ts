import type { Request, Response } from "express";

import type { RegisterUser } from "../../application/register-user.js";
import { toPublicUser } from "../../domain/user.js";
import { createUserSchema } from "./create-user.dto.js";

export class UserController {
  constructor(private readonly registerUser: RegisterUser) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = createUserSchema.parse(req.body);

    const user = await this.registerUser.execute({
      name,
      email,
      password,
    });

    res.status(201).json(toPublicUser(user));
  };
}
