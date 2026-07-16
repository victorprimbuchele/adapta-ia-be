import { Router } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { RegisterUser } from "../../application/register-user.js";
import { PrismaUserRepository } from "../persistence/prisma-user-repository.js";
import { UserController } from "./user.controller.js";

const userRepository = new PrismaUserRepository(prisma);
const registerUser = new RegisterUser(userRepository);
const userController = new UserController(registerUser);

export const userRouter = Router();

userRouter.post("/", asyncHandler(userController.create));
