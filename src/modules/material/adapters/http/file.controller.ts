import type { Request, Response } from "express";

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
}
