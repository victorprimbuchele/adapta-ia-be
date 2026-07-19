# Adapta IA — Documentação da API (integração Frontend)

Documentação de contrato da API REST do backend **adapta-ia-be**, pensada para consumo pelo frontend (web/mobile).

> Fonte de verdade: código em `src/modules/**/adapters/http` e use cases associados.  
> Base local (Docker): `http://localhost:3000`  
> Prefixo padrão: `/api/v1` (`API_PREFIX`)

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Autenticação](#2-autenticação)
3. [Erros](#3-erros)
4. [Modelos (TypeScript)](#4-modelos-typescript)
5. [Fluxos recomendados no FE](#5-fluxos-recomendados-no-fe)
6. [Endpoints](#6-endpoints)
7. [Adaptação assíncrona (polling)](#7-adaptação-assíncrona-polling)
8. [Catálogo de códigos de erro](#8-catálogo-de-códigos-de-erro)
9. [Lacunas conhecidas / cuidados](#9-lacunas-conhecidas--cuidados)
10. [Checklist de integração](#10-checklist-de-integração)

---

## 1. Visão geral

| Item | Valor |
|------|--------|
| Estilo | REST + JSON |
| Auth | JWT Bearer (`Authorization: Bearer <token>`) |
| Content-Type | `application/json` |
| Datas | ISO-8601 (`createdAt`, `updatedAt`, `lastLoginAt`, `deletedAt`) |
| IDs | strings (`cuid`) |
| Papel atual no MVP | **Professor** autenticado (aluno é recurso gerido pelo professor) |

### Naming importante

| Conceito de produto | Path / campo na API |
|---------------------|---------------------|
| Atividade | Em geral `homeworks` no path raiz |
| Atividades da turma | `GET /turmas/:id/atividades` |
| Geradora | `homeworkId === null` e `learningProfileId === null` |
| Variante / adaptação | `homeworkId` aponta para a geradora; `learningProfileId` preenchido |

Não existe mount raiz `/atividades`. Use `/homeworks` para CRUD e adaptação.

### Tabela rápida

| Method | Path | Auth | Sucesso |
|--------|------|------|---------|
| GET | `/api/v1/health` | — | 200 texto |
| POST | `/api/v1/usuarios` | — | 201 |
| POST | `/api/v1/auth/login` | — | 200 |
| GET | `/api/v1/usuarios/me` | JWT | 200 |
| GET | `/api/v1/escolas` | JWT | 200 |
| GET | `/api/v1/series` | JWT | 200 |
| POST | `/api/v1/turmas` | JWT | 201 |
| GET | `/api/v1/turmas` | JWT | 200 |
| GET | `/api/v1/turmas/:id` | JWT | 200 |
| DELETE | `/api/v1/turmas/:id` | JWT | 204 |
| GET | `/api/v1/turmas/:id/alunos` | JWT | 200 |
| POST | `/api/v1/turmas/:id/alunos` | JWT | 201 |
| DELETE | `/api/v1/turmas/:id/alunos/:alunoId` | JWT | 204 |
| GET | `/api/v1/turmas/:id/atividades` | JWT | 200 |
| POST | `/api/v1/alunos/:id/perfil-aprendizagem` | JWT | 200 |
| POST | `/api/v1/homeworks` | JWT | 201 |
| GET | `/api/v1/homeworks/:id` | JWT | 200 |
| PATCH | `/api/v1/homeworks/:id` | JWT | 200 |
| POST | `/api/v1/homeworks/:id/adaptar` | JWT | 202 |
| GET | `/api/v1/homeworks/:id/status-adaptacao` | JWT | 200 |

---

## 2. Autenticação

### Fluxo

```
POST /usuarios          → cadastra professor
POST /auth/login        → recebe accessToken + user
Authorization: Bearer   → nas demais rotas
GET /usuarios/me        → sessão / bootstrap
```

### Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Payload do JWT

```ts
{
  sub: string;   // user.id (= teacherId nas rotas do professor)
  email: string;
  // + iat, exp (padrão JWT)
}
```

- Expiração padrão: `15m` (`JWT_EXPIRES_IN`)
- **Não há refresh token** no MVP: ao expirar, o FE deve pedir login de novo

### Política de senha (cadastro)

- 8–72 caracteres
- Pelo menos 1 minúscula, 1 maiúscula, 1 dígito

---

## 3. Erros

Todas as respostas de erro (exceto health) seguem:

```json
{
  "error": {
    "code": "HOMEWORK_NOT_FOUND",
    "message": "Homework \"abc\" não encontrada."
  }
}
```

### Validação Zod (`400`)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload inválido.",
    "details": [
      { "path": "email", "message": "E-mail inválido." }
    ]
  }
}
```

### JWT (`401`)

| code | Situação |
|------|----------|
| `MISSING_TOKEN` | Sem `Authorization` ou Bearer vazio |
| `INVALID_TOKEN` | Token inválido/malformado |
| `TOKEN_EXPIRED` | Token expirado |

### Erro genérico (`500`)

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Erro interno do servidor."
  }
}
```

**Sugestão FE:** tratar por `error.code` (estável), não por texto de `message`.

---

## 4. Modelos TypeScript

```ts
type ISODateString = string;

interface PublicUser {
  id: string;
  name: string;
  email: string;
  lastLoginAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface Grade {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface Class {
  id: string;
  name: string;
  schoolId: string;
  gradeId: string;
  teacherId: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt: ISODateString | null;
}

interface ClassDetail extends Class {
  /** No MVP atual, este array vem sempre vazio. Use GET /turmas/:id/alunos. */
  students: unknown[];
}

interface LearningProfile {
  id: string;
  name: string;
  /** JSON do prompt canônico (ver seed). */
  prompt: unknown;
}

interface ClassStudentWithProfile {
  id: string;
  name: string;
  email: string;
  learningProfile: LearningProfile | null;
}

interface GlossaryEntry {
  term: string;
  definition: string;
}

interface Homework {
  id: string;
  title: string;
  content: string;
  /** Só em variantes (quando o perfil pede glossário). Geradora: sempre null. */
  glossary: GlossaryEntry[] | null;
  isDraft: boolean;
  /** null = geradora; preenchido = id da geradora (variante). */
  homeworkId: string | null;
  /** null = geradora; preenchido = perfil da variante. */
  learningProfileId: string | null;
  /** Só em variantes com TTS. Geradora: sempre null. */
  audioFileId: string | null;
  classId: string;
  teacherId: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface HomeworkDetail extends Homework {
  adaptations: Homework[];
}

type AdaptationStatus = "pendente" | "processando" | "concluido" | "erro";

interface ProfileAdaptationStatus {
  learningProfileId: string;
  status: AdaptationStatus;
  /** Presente somente se status === "concluido". */
  variantId?: string;
  /** Presente somente se status === "erro" (falha persistente). */
  failedReason?: string;
}

interface HomeworkAdaptationStatus {
  homeworkId: string;
  status: AdaptationStatus;
  adaptations: ProfileAdaptationStatus[];
}
```

### Regras de domínio úteis no FE

| Regra | Como detectar |
|-------|----------------|
| É geradora | `homeworkId === null` |
| É variante | `homeworkId !== null` |
| Geradora sem perfil | `learningProfileId === null` |
| Glossário/áudio só na variante | Geradora: ambos `null`; variante: podem estar preenchidos |
| Editável via PATCH | `isDraft === true` |

---

## 5. Fluxos recomendados no FE

### 5.1 Onboarding do professor

```
1. POST /usuarios
2. POST /auth/login  → guardar accessToken (memória/secure storage)
3. GET /usuarios/me  → bootstrap da sessão
4. GET /escolas + GET /series → popular selects
5. POST /turmas
```

### 5.2 Turma e alunos

```
1. GET /turmas
2. GET /turmas/:id/alunos
3. POST /turmas/:id/alunos
4. POST /alunos/:alunoId/perfil-aprendizagem  { learningProfileId }
   ⚠️ Não há GET de catálogo de perfis na API (ver §9)
```

### 5.3 Criar e editar atividade

```
1. POST /homeworks  { title, content, question, subject, classId }
   → nasce isDraft=true (geradora)
2. PATCH /homeworks/:id enquanto isDraft
3. GET /turmas/:id/atividades → lista geradoras
4. GET /homeworks/:id → detalhe + adaptations[]
```

### 5.4 Adaptar (assíncrono)

```
1. POST /homeworks/:id/adaptar  (body opcional)
   → 202 { enqueued..., skipped... }
2. Poll GET /homeworks/:id/status-adaptacao
   a cada 2–3s até status agregado ∈ { concluido, erro }
   ou até cada adaptation terminar
3. GET /homeworks/:id para carregar variantes (glossary, etc.)
```

---

## 6. Endpoints

### 6.1 Health

#### `GET /api/v1/health`

| | |
|--|--|
| Auth | Não |
| Sucesso | **200** `text/plain`: `OK` |

---

### 6.2 Usuários e Auth

#### `POST /api/v1/usuarios`

Cadastro de professor.

**Body**

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `name` | string | sim | trim, 2–120 |
| `email` | string | sim | e-mail válido, normalizado lower |
| `password` | string | sim | política de senha (§2) |

**Sucesso `201`** — `PublicUser`

**Erros**

| HTTP | code |
|------|------|
| 400 | `VALIDATION_ERROR` |
| 409 | `EMAIL_ALREADY_IN_USE` |
| 422 | `WEAK_PASSWORD` |

---

#### `POST /api/v1/auth/login`

**Body**

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `email` | string | sim | e-mail, lower |
| `password` | string | sim | min 1 |

**Sucesso `200`**

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "lastLoginAt": "2026-07-19T20:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Erros:** `VALIDATION_ERROR` 400 · `INVALID_CREDENTIALS` 401

---

#### `GET /api/v1/usuarios/me`

| Auth | JWT |
| Sucesso | **200** `PublicUser` |
| Erros | JWT 401 · `USER_NOT_FOUND` 404 |

---

### 6.3 Escolas e séries (referência / seed)

#### `GET /api/v1/escolas`

| Auth | JWT |
| Sucesso | **200** `School[]` |

Dados fixos de referência (seed). Usar para select de criação de turma.

#### `GET /api/v1/series`

| Auth | JWT |
| Sucesso | **200** `Grade[]` |

Ordenar no FE por `sortOrder` (1º ano → 9º ano).

---

### 6.4 Turmas

#### `POST /api/v1/turmas`

| Auth | JWT (`sub` vira `teacherId`) |

**Body**

| Campo | Obrigatório | Regras |
|-------|-------------|--------|
| `name` | sim | trim, 2–120 |
| `schoolId` | sim | id de escola existente |
| `gradeId` | sim | id de série existente |

**Sucesso `201`** — `Class`

**Erros:** `VALIDATION_ERROR` 400 · `SCHOOL_NOT_FOUND` 404 · `GRADE_NOT_FOUND` 404 · `TEACHER_NOT_FOUND` 404 · JWT

---

#### `GET /api/v1/turmas`

Lista turmas do professor autenticado (não soft-deleted).

| Sucesso | **200** `Class[]` |

---

#### `GET /api/v1/turmas/:id`

| Sucesso | **200** `ClassDetail` |
| Erros | `CLASS_NOT_FOUND` 404 · `CLASS_ACCESS_DENIED` 403 |

> **Atenção:** `students` no detalhe vem **sempre `[]`**. Liste alunos em `GET /turmas/:id/alunos`.

---

#### `DELETE /api/v1/turmas/:id`

Soft delete (`deletedAt`).

| Sucesso | **204** (sem body) |
| Erros | `CLASS_NOT_FOUND` 404 · `CLASS_ACCESS_DENIED` 403 |

---

#### `GET /api/v1/turmas/:id/alunos`

| Sucesso | **200** `ClassStudentWithProfile[]` |

Cada aluno traz `learningProfile` (ou `null` se ainda não vinculado).

---

#### `POST /api/v1/turmas/:id/alunos`

Matricula aluno na turma. Se o e-mail já existir como usuário, reutiliza.

**Body**

| Campo | Obrigatório | Regras |
|-------|-------------|--------|
| `name` | sim | trim, 2–120 |
| `email` | sim | e-mail válido, lower |

**Sucesso `201`**

```json
{ "id": "...", "name": "...", "email": "..." }
```

**Erros:** `VALIDATION_ERROR` 400 · `CLASS_NOT_FOUND` 404 · `CLASS_ACCESS_DENIED` 403 · `STUDENT_ALREADY_ENROLLED` 409

---

#### `DELETE /api/v1/turmas/:id/alunos/:alunoId`

Remove vínculo aluno↔turma.

| Sucesso | **204** |
| Erros | `CLASS_NOT_FOUND` 404 · `CLASS_ACCESS_DENIED` 403 · `STUDENT_NOT_ENROLLED` 404 |

---

#### `GET /api/v1/turmas/:id/atividades`

Lista **apenas geradoras** da turma (mais recentes primeiro).

| Sucesso | **200** `Homework[]` |
| Erros | `CLASS_NOT_FOUND` 404 · `CLASS_ACCESS_DENIED` 403 |

Para ver variantes, use `GET /homeworks/:id`.

---

### 6.5 Alunos (perfil de aprendizagem)

#### `POST /api/v1/alunos/:id/perfil-aprendizagem`

Vincula (ou substitui) o perfil do aluno. MVP: **no máximo 1 perfil ativo** por aluno.

**Path:** `id` = `studentId`  
**Body**

| Campo | Obrigatório |
|-------|-------------|
| `learningProfileId` | sim (string não vazia) |

**Sucesso `200`**

```json
{
  "studentId": "...",
  "learningProfileId": "...",
  "learningProfile": {
    "id": "...",
    "name": "Simplificado + glossário + TTS",
    "prompt": { "code": "P1", "kind": "base", "...": "..." }
  }
}
```

**Erros:** `VALIDATION_ERROR` 400 · `STUDENT_NOT_FOUND` 404 · `LEARNING_PROFILE_NOT_FOUND` 404 · JWT

> Não há checagem de “esse aluno pertence à turma do professor” neste endpoint. O FE deve só chamar para alunos que listou nas turmas do professor.

---

### 6.6 Homeworks (atividades)

#### `POST /api/v1/homeworks`

Cria **geradora** em rascunho.

**Body (todos obrigatórios na validação)**

| Campo | Regras | Persistido? |
|-------|--------|-------------|
| `title` | trim, 2–200 | sim |
| `content` | trim, 1–50000 | sim |
| `question` | trim, 1–10000 | **não** (só validação de formulário) |
| `subject` | trim, 2–120 | **não** (só validação de formulário) |
| `classId` | trim, min 1 | sim |

**Sucesso `201`** — `Homework` com:

- `isDraft: true`
- `homeworkId: null`
- `learningProfileId: null`
- `glossary: null`
- `audioFileId: null`

**Erros:** `VALIDATION_ERROR` 400 · `TEACHER_NOT_FOUND` 404 · `CLASS_NOT_FOUND` 404 · `CLASS_ACCESS_DENIED` 403 · JWT

---

#### `GET /api/v1/homeworks/:id`

| Sucesso | **200** `HomeworkDetail` (`adaptations` ordenadas por criação) |
| Erros | `HOMEWORK_NOT_FOUND` 404 · `HOMEWORK_ACCESS_DENIED` 403 |

---

#### `PATCH /api/v1/homeworks/:id`

Atualiza rascunho. **Mesmo schema do create** (inclui `question`/`subject`/`classId` na validação), mas o use case persiste **apenas** `title` e `content`.

Só funciona se `isDraft === true`.

| Sucesso | **200** `Homework` |
| Erros | `HOMEWORK_NOT_FOUND` 404 · `HOMEWORK_ACCESS_DENIED` 403 · `HOMEWORK_NOT_DRAFT` 409 · `VALIDATION_ERROR` 400 |

---

#### `POST /api/v1/homeworks/:id/adaptar`

Enfileira adaptação assíncrona. **Não espera LLM/TTS.**

**Body (opcional)**

```json
{
  "learningProfileIds": ["cuid-perfil-1", "cuid-perfil-2"]
}
```

| Campo | Comportamento |
|-------|----------------|
| omitido / `[]` | Usa perfis **distintos** já vinculados aos alunos da turma da homework |
| informado | Enfileira só esses ids (deduplicados) |

**Sucesso `202`**

```json
{
  "homeworkId": "<id-geradora>",
  "enqueuedLearningProfileIds": ["profile-1"],
  "skippedLearningProfileIds": ["profile-2"]
}
```

- `enqueued*` — jobs novos na fila  
- `skipped*` — já cobertos por idempotência Redis (mesmo par atividade+perfil recentemente)

**Erros**

| HTTP | code |
|------|------|
| 404 | `HOMEWORK_NOT_FOUND`, `LEARNING_PROFILE_NOT_FOUND` |
| 403 | `HOMEWORK_ACCESS_DENIED` |
| 409 | `HOMEWORK_NOT_GENERATOR` |
| 422 | `NO_LEARNING_PROFILES_TO_ADAPT` |
| 400 | `VALIDATION_ERROR` |

---

#### `GET /api/v1/homeworks/:id/status-adaptacao`

Polling do andamento. Só para **geradora**.

**Sucesso `200`** — `HomeworkAdaptationStatus`

**Erros:** `HOMEWORK_NOT_FOUND` 404 · `HOMEWORK_ACCESS_DENIED` 403 · `HOMEWORK_NOT_GENERATOR` 409

Detalhes do polling na [§7](#7-adaptação-assíncrona-polling).

---

## 7. Adaptação assíncrona (polling)

### Arquitetura (o que o FE precisa saber)

```
FE ──POST /adaptar──► API ──enfileira──► Redis/BullMQ
                              │
                              ▼
                         Worker (LLM + TTS + File)
                              │
FE ◄──GET /status-adaptacao── API ◄── estado do job + DB
```

A API **não** chama a LLM. Sem worker rodando, o status fica em `pendente`/`processando` indefinidamente.

### Status

| Valor | Significado para UI |
|-------|---------------------|
| `pendente` | Na fila / ainda não começou |
| `processando` | Em execução **ou** em retry com backoff |
| `concluido` | Variante completa para o perfil |
| `erro` | Falha persistente (retries esgotados ou erro não retriável) |

**Agregado** (`status` raiz): prioridade `erro` > `processando` > `pendente` > `concluido`.

### Quando considerar “pronto”

- Só use `variantId` / conte como sucesso se `status === "concluido"`.
- **Não** trate existência de variante parcial no detalhe como pronta: o backend pode upsertar texto **antes** do TTS; nesse intervalo o poll continua `processando`.

### Completude da variante (backend)

Uma variante só fica `concluido` se:

1. Tem `title` e `content`
2. Se o perfil pede glossário → `glossary !== null` (pode ser `[]`)
3. Se o perfil pede TTS → `audioFileId !== null`

### Retry

- Até **3 tentativas**, backoff exponencial (2s base)
- Durante retry: poll mostra `processando` (não `erro`)
- Após falha final: `erro` + `failedReason` (mensagem amigável, PT)

Exemplos de `failedReason`:

- `"Falha ao adaptar o texto com a IA. Tente novamente em instantes."`
- `"Falha ao gerar o áudio da atividade. Tente novamente em instantes."`

### Idempotência

Reenviar `POST /adaptar` para o mesmo par geradora+perfil (dentro do TTL Redis, default 24h) **não** cria segunda variante: o perfil vai em `skippedLearningProfileIds`.

### Exemplo de loop de poll (pseudo)

```ts
async function waitAdaptation(homeworkId: string, token: string) {
  for (;;) {
    const res = await api.get(`/homeworks/${homeworkId}/status-adaptacao`, token);
    const { status, adaptations } = res;

    if (status === "concluido") {
      return api.get(`/homeworks/${homeworkId}`, token); // carrega variantes
    }
    if (status === "erro") {
      throw new Error(
        adaptations.find(a => a.status === "erro")?.failedReason ?? "Falha na adaptação",
      );
    }
    await sleep(2500);
  }
}
```

---

## 8. Catálogo de códigos de erro

| code | HTTP | Onde aparece |
|------|------|--------------|
| `VALIDATION_ERROR` | 400 | Qualquer body inválido |
| `MISSING_TOKEN` | 401 | Auth |
| `INVALID_TOKEN` | 401 | Auth |
| `TOKEN_EXPIRED` | 401 | Auth |
| `INVALID_CREDENTIALS` | 401 | Login |
| `EMAIL_ALREADY_IN_USE` | 409 | Cadastro |
| `WEAK_PASSWORD` | 422 | Cadastro |
| `USER_NOT_FOUND` | 404 | `/usuarios/me` |
| `SCHOOL_NOT_FOUND` | 404 | Criar turma |
| `GRADE_NOT_FOUND` | 404 | Criar turma |
| `TEACHER_NOT_FOUND` | 404 | Criar turma / homework |
| `CLASS_NOT_FOUND` | 404 | Turmas / atividades |
| `CLASS_ACCESS_DENIED` | 403 | Turma de outro professor |
| `STUDENT_ALREADY_ENROLLED` | 409 | Matrícula |
| `STUDENT_NOT_ENROLLED` | 404 | Remover aluno |
| `STUDENT_NOT_FOUND` | 404 | Perfil aprendizagem |
| `LEARNING_PROFILE_NOT_FOUND` | 404 | Perfil / adaptar |
| `HOMEWORK_NOT_FOUND` | 404 | Homeworks |
| `HOMEWORK_ACCESS_DENIED` | 403 | Homework de outro professor |
| `HOMEWORK_NOT_DRAFT` | 409 | PATCH em não-rascunho |
| `HOMEWORK_NOT_GENERATOR` | 409 | Adaptar/status em variante |
| `NO_LEARNING_PROFILES_TO_ADAPT` | 422 | Adaptar sem perfis na turma |
| `INTERNAL_SERVER_ERROR` | 500 | Inesperado |

Códigos de worker (`LLM_ADAPTATION_FAILED`, `TTS_ADAPTATION_FAILED`, …) **não** voltam síncronos no HTTP do `/adaptar`; o FE os vê indiretamente via `status: "erro"`.

---

## 9. Lacunas conhecidas / cuidados

Estas limitações afetam a integração do FE no MVP atual:

1. **Sem `GET /learning-profiles` (ou similar)**  
   O catálogo existe no seed do banco, mas **não há endpoint** para listar perfis. Opções temporárias:
   - Hardcode dos nomes/ids após seed em ambiente conhecido
   - Endpoint a ser adicionado no backend (recomendado)

2. **Sem `GET /subjects`**  
   `subject` é obrigatório no formulário de homework, mas **não é persistido** e não há listagem de disciplinas na API.

3. **`question` / `subject` no create/patch**  
   Validados no boundary HTTP, **não gravados** no modelo `Homework`. O FE pode manter localmente para UX do formulário, mas não esperar no `GET`.

4. **`GET /turmas/:id` → `students: []`**  
   Sempre vazio. Use `GET /turmas/:id/alunos`.

5. **Áudio TTS**  
   Variante concluída com TTS tem `audioFileId`, mas **não há endpoint público de download/stream** do arquivo neste MVP. Planeje UI de “áudio disponível” / endpoint futuro.

6. **Sem refresh token**  
   Expiração curta (`15m` default). Tratar `TOKEN_EXPIRED` com redirect para login.

7. **Worker obrigatório para adaptação**  
   `pnpm worker:dev` (ou serviço `worker` no Compose) precisa estar no ar.

8. **CORS**  
   Confirme origem permitida no deploy; em local com FE em outra porta pode ser necessário ajustar.

---

## 10. Checklist de integração

- [ ] Base URL configurável (`VITE_API_URL` / equivalente) apontando para `/api/v1`
- [ ] Interceptor Axios/fetch anexando `Authorization: Bearer`
- [ ] Tratamento global por `error.code` (401 → login; 403 toast; 422 formulário)
- [ ] Fluxo cadastro → login → me
- [ ] Selects escola/série a partir dos GETs de referência
- [ ] CRUD turma + matrícula + perfil do aluno
- [ ] Formulário homework enviando `question`/`subject` mesmo sem persistência
- [ ] Lista de atividades via `/turmas/:id/atividades`
- [ ] Detalhe via `/homeworks/:id` (geradora + `adaptations`)
- [ ] Adaptar + poll de status até `concluido`/`erro`
- [ ] UI de glossário só em variantes com `glossary`
- [ ] Não editar homework com `isDraft === false` via PATCH (backend rejeita)

---

## Apêndice A — Exemplos curl

```bash
# Health
curl -s http://localhost:3000/api/v1/health

# Cadastro
curl -s -X POST http://localhost:3000/api/v1/usuarios \
  -H 'Content-Type: application/json' \
  -d '{"name":"Marta Silva","email":"marta@escola.com","password":"Senha123"}'

# Login
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"marta@escola.com","password":"Senha123"}'
# → copiar accessToken

TOKEN="..."

# Escolas / séries
curl -s http://localhost:3000/api/v1/escolas -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/api/v1/series -H "Authorization: Bearer $TOKEN"

# Criar turma
curl -s -X POST http://localhost:3000/api/v1/turmas \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"5º A","schoolId":"<schoolId>","gradeId":"<gradeId>"}'

# Matricular aluno
curl -s -X POST http://localhost:3000/api/v1/turmas/<classId>/alunos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"João","email":"joao@escola.com"}'

# Criar homework
curl -s -X POST http://localhost:3000/api/v1/homeworks \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{
    "title":"Frações",
    "content":"Explique frações equivalentes.",
    "question":"O que são frações equivalentes?",
    "subject":"Matemática",
    "classId":"<classId>"
  }'

# Adaptar
curl -s -X POST http://localhost:3000/api/v1/homeworks/<homeworkId>/adaptar \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{}'

# Status
curl -s http://localhost:3000/api/v1/homeworks/<homeworkId>/status-adaptacao \
  -H "Authorization: Bearer $TOKEN"
```

---

## Apêndice B — Shape do `LearningProfile.prompt` (seed)

Útil para UI de flags de adaptação (mesmo sem endpoint de listagem):

```ts
{
  code: string;              // "P1" | "P2" | "P3" | "P1+P2" | ...
  kind: "base" | "composite";
  combines: string[];
  adaptations: {
    simplifyText: boolean;
    glossary: boolean;
    tts: boolean;
    microtasks: boolean;
    visualStructure: boolean;
    highContrast: boolean;
    largeFont: boolean;
    screenReader: boolean;
  };
  instructions: string;
}
```

Perfis seed (nomes):

1. Simplificado + glossário + TTS  
2. Microtarefas + estrutura visual  
3. Alto contraste + fonte grande + leitor de tela  
4. Combinações compostas P1+P2, P1+P3, P2+P3, P1+P2+P3  

Os **ids** são gerados no seed (`cuid`) e mudam por ambiente — por isso o catálogo via API é necessário para produção.

---

*Documento gerado para integração FE · backend adapta-ia-be · Épicos 1–5 (MVP).*
