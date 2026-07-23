import type { Request, Response } from "express";

import {
  resolveFileDownloadSecret,
  verifySignedFileDownload,
} from "../../../../shared/auth/signed-file-download.js";
import type { GetFile } from "../../application/get-file.js";

export class FileController {
  constructor(private readonly getFile: GetFile) {}

  show = async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;

    const { file, data } = await this.getFile.execute(id);

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", file.sizeBytes.toString());
    res.status(200).send(data);
  };

  /** Download público via link assinado (ex.: áudio no e-mail — BE-E7.5). */
  showPublic = async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;
    const expires = Number(req.query["expires"]);
    const signature = req.query["sig"];
    const secret = resolveFileDownloadSecret();

    if (
      typeof signature !== "string" ||
      !secret ||
      !verifySignedFileDownload(id, expires, signature, secret)
    ) {
      res.status(403).json({
        error: {
          code: "INVALID_DOWNLOAD_LINK",
          message: "Link de download inválido ou expirado.",
        },
      });
      return;
    }

    await this.show(req, res);
  };
}
