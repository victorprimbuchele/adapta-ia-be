// Garante variáveis de ambiente determinísticas para os testes, independente
// do `.env` local do desenvolvedor (ex.: módulos que exigem JWT_SECRET no load).
process.env.JWT_SECRET ??= "test-only-secret-do-not-use-in-production";
process.env.JWT_EXPIRES_IN ??= "15m";
