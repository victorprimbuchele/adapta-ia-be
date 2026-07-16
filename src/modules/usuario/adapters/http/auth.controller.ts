import type { Request, Response } from "express";

import { signAccessToken } from "../../../../shared/auth/jwt.js";
import type { AuthenticateUser } from "../../application/authenticate-user.js";
import { toPublicUser } from "../../domain/user.js";
import { loginSchema } from "./login.dto.js";

export class AuthController {
  constructor(private readonly authenticateUser: AuthenticateUser) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await this.authenticateUser.execute({ email, password });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });

    res.status(200).json({
      accessToken,
      user: toPublicUser(user),
    });
  };
}
