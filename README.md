# adapta-ia-be

Backend da Adapta IA — API REST em Node.js + TypeScript, com PostgreSQL, Redis e worker assíncrono (BullMQ).

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) 22+ (apenas se for rodar a API fora do Docker)
- [pnpm](https://pnpm.io/) 11.11.0 (via Corepack: `corepack enable`)

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://adapta:adapta@postgres:5432/adapta_db"
REDIS_URL="redis://redis:6379"
LLM_API_KEY="sk-..."
# Opcionais LLM (defaults: OpenAI + gpt-4o-mini)
# LLM_BASE_URL="https://api.openai.com/v1"
# LLM_MODEL="gpt-4o-mini"
# Opcionais TTS (BE-E5.6; default: mesma chave/base da LLM + tts-1 / voz nova)
# TTS_API_KEY="sk-..."
# TTS_BASE_URL="https://api.openai.com/v1"
# TTS_MODEL="tts-1"
# TTS_VOICE="nova"
# Storage local do áudio TTS (BE-E5.7; default: ./storage)
# STORAGE_PATH="./storage"
# Idempotência Redis do par atividade+perfil (BE-E5.8 / ADR 005; default: 24h)
# ADAPTATION_IDEMPOTENCY_TTL_SECONDS="86400"
```

> Se a API/worker rodarem **no host** (fora do Docker) e só o Postgres/Redis estiverem no Compose, use `localhost` no lugar de `postgres` e `redis`.
>
> `LLM_API_KEY` é exigida pelo **worker** (adaptação via LLM — BE-E5.3; TTS — BE-E5.6, com fallback da mesma chave). O áudio TTS é gravado em filesystem local (`STORAGE_PATH`) com registro em `File` (BE-E5.7). A API usa Redis para não reenfileirar o mesmo par atividade+perfil (BE-E5.8). Falhas retriáveis de LLM/TTS usam retry com backoff no BullMQ (3 tentativas); falha persistente aparece como `erro` em `GET .../status-adaptacao` (BE-E5.10). A API só enfileira jobs e não chama a LLM/TTS.

## Subir com Docker (recomendado)

Sobe API, worker, PostgreSQL e Redis:

```bash
docker compose up -d
```

Acompanhar logs:

```bash
docker compose logs -f api
docker compose logs -f worker
```

Parar:

```bash
docker compose down
```

### Verificar se está no ar

```bash
curl http://localhost:3000/api/v1/health
# OK
```

| Serviço   | Porta |
|-----------|-------|
| API       | 3000  |
| PostgreSQL| 5432  |
| Redis     | 6379  |

## Desenvolvimento local (API no host)

1. Suba só a infraestrutura:

```bash
docker compose up -d postgres redis
```

2. Ajuste o `.env` para apontar ao host:

```env
DATABASE_URL="postgresql://adapta:adapta@localhost:5432/adapta_db"
REDIS_URL="redis://localhost:6379"
LLM_API_KEY="sk-..."
```

3. Instale as dependências e gere o client do Prisma:

```bash
pnpm install
pnpm db:generate
```

4. Rode as migrations (quando existirem):

```bash
pnpm db:migrate
```

5. Suba a API e o worker em terminais separados:

```bash
pnpm dev
pnpm worker:dev
```

## Scripts úteis

| Script            | Descrição                          |
|-------------------|------------------------------------|
| `pnpm dev`        | API em modo watch                  |
| `pnpm worker:dev` | Worker em modo watch               |
| `pnpm build`      | Compila TypeScript para `dist/`    |
| `pnpm start`      | Sobe a API compilada               |
| `pnpm worker`     | Sobe o worker compilado            |
| `pnpm db:migrate` | Cria/aplica migrations (dev)       |
| `pnpm db:deploy`  | Aplica migrations (produção)       |
| `pnpm db:generate`| Gera o Prisma Client               |
| `pnpm db:studio`  | Abre o Prisma Studio               |
| `pnpm test`       | Roda os testes                     |
| `pnpm lint`       | ESLint                             |
| `pnpm format`     | Prettier                           |

## Credenciais locais (Docker)

| Item     | Valor      |
|----------|------------|
| Usuário  | `adapta`   |
| Senha    | `adapta`   |
| Database | `adapta_db`|

## Arquitetura (resumo)

Decisões de arquitetura estão em [`adr.md`](./adr.md). Em resumo:

- Monólito modular com arquitetura hexagonal
- PostgreSQL + Prisma
- Redis (idempotência) + BullMQ (filas)
- LLM OpenAI-compatible no worker (`TextSimplifierPort` — ADR 003)
- API versionada em `/api/v1/...`
