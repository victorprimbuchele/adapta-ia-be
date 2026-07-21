import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { GetDeliveryDetail } from "../../application/get-delivery-detail.js";
import { ResendDelivery } from "../../application/resend-delivery.js";
import { BullMqDeliveryQueue } from "../queue/bullmq-delivery-queue.js";
import { PrismaDeliveryRepository } from "../persistence/prisma-delivery-repository.js";
import { EnvioController } from "./envio.controller.js";

const deliveryRepository = new PrismaDeliveryRepository(prisma);
const deliveryQueue = new BullMqDeliveryQueue();
const getDeliveryDetail = new GetDeliveryDetail(deliveryRepository);
const resendDelivery = new ResendDelivery(deliveryRepository, deliveryQueue);
const envioController = new EnvioController(getDeliveryDetail, resendDelivery);

export const envioRouter = Router();

envioRouter.get("/:id", authenticate, asyncHandler(envioController.show));
envioRouter.post("/:id/reenviar", authenticate, asyncHandler(envioController.resend));
