import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { GetFile } from "../../application/get-file.js";
import { LocalObjectStorage } from "../storage/local-object-storage.js";
import { PrismaFileRepository } from "../persistence/prisma-file-repository.js";
import { FileController } from "./file.controller.js";

const fileRepository = new PrismaFileRepository(prisma);
const objectStorage = new LocalObjectStorage();
const getFile = new GetFile(fileRepository, objectStorage);
const fileController = new FileController(getFile);

export const fileRouter = Router();

fileRouter.get("/:id/publico", asyncHandler(fileController.showPublic));

fileRouter.get("/:id", authenticate, asyncHandler(fileController.show));
