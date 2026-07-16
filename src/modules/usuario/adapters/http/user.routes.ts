import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { GetAuthenticatedUser } from "../../application/get-authenticated-user.js";
import { RegisterUser } from "../../application/register-user.js";
import { PrismaUserRepository } from "../persistence/prisma-user-repository.js";
import { UserController } from "./user.controller.js";

const userRepository = new PrismaUserRepository(prisma);
const registerUser = new RegisterUser(userRepository);
const getAuthenticatedUser = new GetAuthenticatedUser(userRepository);
const userController = new UserController(registerUser, getAuthenticatedUser);

export const userRouter = Router();

userRouter.post("/", asyncHandler(userController.create));
userRouter.get("/me", authenticate, asyncHandler(userController.me));
