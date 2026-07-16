import { Router } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { AuthenticateUser } from "../../application/authenticate-user.js";
import { PrismaUserRepository } from "../persistence/prisma-user-repository.js";
import { AuthController } from "./auth.controller.js";

const userRepository = new PrismaUserRepository(prisma);
const authenticateUser = new AuthenticateUser(userRepository);
const authController = new AuthController(authenticateUser);

export const authRouter = Router();

authRouter.post("/login", asyncHandler(authController.login));
