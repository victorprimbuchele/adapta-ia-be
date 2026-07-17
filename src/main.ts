import express from "express";

import { errorHandler } from "./shared/http/error-handler.js";
import { classRouter } from "./modules/escola/adapters/http/class.routes.js";
import { gradeRouter } from "./modules/escola/adapters/http/grade.routes.js";
import { schoolRouter } from "./modules/escola/adapters/http/school.routes.js";
import { studentRouter } from "./modules/escola/adapters/http/student.routes.js";
import { authRouter } from "./modules/usuario/adapters/http/auth.routes.js";
import { userRouter } from "./modules/usuario/adapters/http/user.routes.js";

const PORT = process.env["PORT"] ?? 3000;
const API_PREFIX = process.env["API_PREFIX"] ?? "/api/v1";

const app = express();

app.use(express.json());

app.get(`${API_PREFIX}/health`, (req, res) => {
  res.send("OK\n");
});

app.use(`${API_PREFIX}/usuarios`, userRouter);
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/escolas`, schoolRouter);
app.use(`${API_PREFIX}/series`, gradeRouter);
app.use(`${API_PREFIX}/turmas`, classRouter);
app.use(`${API_PREFIX}/alunos`, studentRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
