import type { Request, Response } from "express";

import { getAuthenticatedUser } from "../../../../shared/auth/authenticate.js";
import type { GetDeliveryDetail } from "../../application/get-delivery-detail.js";
import type { ResendDelivery } from "../../application/resend-delivery.js";

export class EnvioController {
  constructor(
    private readonly getDeliveryDetail: GetDeliveryDetail,
    private readonly resendDelivery: ResendDelivery,
  ) {}

  show = async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const delivery = await this.getDeliveryDetail.execute(id, teacherId);

    res.status(200).json(delivery);
  };

  resend = async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const result = await this.resendDelivery.execute(id, teacherId);

    res.status(202).json({ deliveryId: id, ...result });
  };
}
