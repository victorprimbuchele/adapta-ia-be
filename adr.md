# Architecture Decision Records - Hackathon 6FSDT

> Cada ADR segue o formato: Status, Contexto, Decisão, Consequências, Alternativas consideradas.

---

## ADR 001 - Backend em Node.js + TypeScript + Prisma

**Status**: Aceito

**Contexto**: Prazo curto (até 27/07), equipe de 5 pessoas, necessidade de equilibrar velocidade de desenvolvimento com qualidade mínima de engenharia para um hackathon avaliado também em "Documentação" e "MVP".

**Decisão**: Backend em Node.js com TypeScript. ORM/Query builder via Prisma, por agilizar migrations, type-safety end-to-end com o schema do banco e reduzir boilerplate de acesso a dados.

**Consequências**:
- Ganho de velocidade de desenvolvimento e tipagem automática a partir do schema.
- Acoplamento ao Prisma Client deve ficar restrito à camada de infraestrutura (adapters de repositório), nunca vazando para a camada de domínio/aplicação - ver ADR 003.

**Alternativas consideradas**: TypeORM (mais boilerplate, decorators acoplam entidades ao ORM), Knex puro (mais controle, mais tempo de desenvolvimento - não compensa para o prazo do hackathon).

---

## ADR 002 - TypeScript em todo o stack

**Status**: Aceito

**Contexto**: Equipe pequena, código compartilhado conceitualmente entre front, back e (futuramente) mobile.

**Decisão**: TypeScript obrigatório em backend, frontend web e - quando aplicável - mobile.

**Consequências**: Contratos de API (DTOs, schemas Zod) podem ser usados como referência de tipos em ambos os lados, reduzindo bugs de integração, ainda que back e front estejam em repositórios separados (ADR 010) e não compartilhem pacote de tipos automaticamente. Compensação: manter o contrato de API documentado (OpenAPI/Swagger ou doc manual) como fonte da verdade.

---

## ADR 003 - Monolito modular com Arquitetura Hexagonal (Ports & Adapters)

**Status**: Aceito

**Contexto**: A equipe quer entregar rápido para o hackathon, mas deixar o caminho aberto para extrair módulos como microsserviços no futuro (ex.: módulo de geração de áudio/TTS, ou de simplificação de texto via LLM), sem reescrever regra de negócio.

**Decisão**: Adotar um monolito modular, organizado por módulos de domínio (ex.: `material`, `adaptacao`, `usuario`, `relatorio`), cada um internamente estruturado em camadas hexagonais:
- **Domain**: entidades, regras de negócio puras, sem dependência de framework.
- **Application**: casos de uso (use cases), orquestram o domínio via portas (interfaces).
- **Ports**: interfaces que definem contratos (ex.: `TextSimplifierPort`, `AudioGeneratorPort`, `MaterialRepositoryPort`).
- **Adapters**: implementações concretas das portas (Prisma, BullMQ, cliente de LLM, cliente de TTS, SMTP).

Cada módulo só se comunica com outro através de uma interface de aplicação (use case ou evento), nunca acessando o domínio interno de outro módulo diretamente. Isso é o que viabiliza, no futuro, extrair um módulo para um serviço separado trocando apenas o adapter de comunicação (de chamada direta para HTTP/fila).

**Consequências**:
- Mais disciplina na escrita de código (interfaces antes de implementação).
- Importante: aplicar Clean Architecture/SOLID **apenas onde reduz risco real de troca de peça** (ex.: trocar provedor de LLM/TTS, trocar de monólito para microsserviço) - não introduzir abstração para chamadas triviais e estáveis (ex.: não vale a pena criar uma porta para `bcrypt` ou para `Date`). Overengineering é um risco explícito a evitar, dado o prazo.
- Times menores podem trabalhar em módulos diferentes com baixo conflito.

**Alternativas consideradas**: Clean Architecture "em camadas" sem hexagonal (mais simples, mas mistura menos bem a ideia de múltiplos adapters por porta); microsserviços desde o início (descartado - overhead de infraestrutura incompatível com o prazo do hackathon).

---

## ADR 004 - PostgreSQL como banco de dados relacional

**Status**: Aceito

**Contexto**: Dados estruturados (usuários, materiais, perfis de adaptação, relatórios de uso) com relacionamentos claros (professor → materiais → adaptações; coordenadora → relatórios).

**Decisão**: PostgreSQL como banco principal, acessado via Prisma (ADR 001).

**Consequências**: Suporte maduro a transações e integridade referencial; bom suporte do Prisma; fácil de rodar localmente via Docker para a equipe toda.

**Alternativas consideradas**: MongoDB (descartado - dados são predominantemente relacionais, sem necessidade de schema flexível que justifique um NoSQL).

---

## ADR 005 - Redis para idempotência

**Status**: Aceito

**Contexto**: Operações como geração de áudio (TTS) e simplificação de texto via LLM têm custo (tempo e possivelmente financeiro) e podem ser disparadas em duplicidade por reenvio de requisição (ex.: internet instável nas escolas - fricção já mapeada na jornada do usuário).

**Decisão**: Usar Redis para armazenar chaves de idempotência (ex.: hash do request + identificador do usuário) com TTL, evitando reprocessamento de uma mesma operação custosa em um curto intervalo.

**Consequências**: Componente de infraestrutura adicional para rodar (mitigado: já é necessário para o BullMQ - ADR 006 -, então não há custo operacional extra). Lógica de idempotência deve viver em um adapter próprio (`IdempotencyPort`), não espalhada pelos use cases.

---

## ADR 006 - BullMQ (sobre Redis) para filas e mensageria assíncrona

**Status**: Aceito

**Contexto**: Operações como envio de e-mail (notificação à coordenadora, confirmação de cadastro) e possivelmente geração de áudio/TTS são naturalmente assíncronas e não devem bloquear a resposta HTTP nem falhar silenciosamente.

**Decisão**: BullMQ, que já roda sobre Redis (reaproveitando a infraestrutura do ADR 005), para filas de processamento assíncrono (e-mail, e candidatos futuros como geração de TTS se ficar lenta o suficiente para justificar).

**Consequências**: Reaproveitamento de infraestrutura (mesmo Redis); retries e backoff configuráveis nativamente; necessidade de um worker process separado (mesmo monólito, processo distinto) para consumir as filas.

**Alternativas consideradas**: RabbitMQ/SQS (mais robustos, mas overhead de infraestrutura desnecessário para o escopo do MVP do hackathon).

---

## ADR 007 - Gmail SMTP (free tier) para envio de e-mail

**Status**: Aceito - decisão explicitamente temporária/MVP

**Contexto**: Necessidade de enviar e-mails (ex.: relatórios para a coordenadora, notificações) sem custo e sem complexidade de setup adicional durante o hackathon.

**Decisão**: Usar SMTP do Gmail (limite de ~500 e-mails/dia), suficiente para o volume de demonstração e validação do MVP.

**Consequências**: Limite de 500 e-mails/dia é uma restrição conhecida e aceitável para o contexto de hackathon/demo - não é uma decisão para produção real. O acesso a SMTP deve ficar isolado atrás de uma porta (`EmailSenderPort`), de forma que trocar para um provedor transacional (SES, SendGrid, Resend) no futuro seja apenas a troca do adapter, sem tocar em regra de negócio.

**Alternativas consideradas**: SendGrid/Resend free tier (mais robustos, mas setup e verificação de domínio consomem tempo que não há no prazo do hackathon).

---

## ADR 008 - Zod para validação

**Status**: Aceito

**Contexto**: Necessidade de validar entradas de API (DTOs) de forma type-safe e com boas mensagens de erro, tanto no backend quanto, potencialmente, no frontend (validação de formulários).

**Decisão**: Zod como biblioteca de validação de schemas no backend (validação de request/DTOs na borda da aplicação - adapters HTTP) e no frontend (validação de formulários, especialmente integrada a formulários do React).

**Consequências**: Validação fica centralizada em schemas declarativos, reutilizáveis como fonte de tipos TypeScript via inferência (`z.infer`). Evita duplicar definição de tipo + validação manualmente.

---

## ADR 009 - Jest para testes, com foco em comportamento de regra de negócio

**Status**: Aceito

**Contexto**: Critério de avaliação do hackathon inclui MVP funcional; tempo é escasso; testes triviais (ex.: "variável foi declarada", getters/setters) não agregam valor proporcional ao tempo gasto.

**Decisão**: Jest como framework de testes. Foco estrito em testes de **comportamento** das camadas de Domain e Application (use cases) - ex.: "dado um material com X palavras, o glossário gerado deve conter os termos complexos identificados", "dado um perfil de aluno tipo 2, o conteúdo deve ser fragmentado em microtarefas". Evitar testes unitários excessivos em adapters triviais, DTOs ou camadas de UI sem lógica.

**Consequências**: Suíte de testes menor, mas mais significativa, com testes mapeados diretamente para regras de negócio descritas no escopo do MVP (seção 6 do contexto do projeto). Isso também facilita rodar testes filtrados por diff no pre-push (ADR 013), já que os testes relevantes tendem a estar próximos do código de domínio alterado.

**Alternativas consideradas**: Vitest (mais rápido, mas Jest tem maior maturidade de ecossistema e é suficiente para o volume de testes planejado).

---

## ADR 010 - Repositórios separados (backend e frontend)

**Status**: Aceito

**Contexto**: Equipe decidiu não usar monorepo.

**Decisão**: Backend e frontend (e, futuramente, mobile) em repositórios Git separados, comunicando-se exclusivamente via API REST (ADR 011) com contrato documentado.

**Consequências**: Não há compartilhamento automático de tipos TypeScript entre front e back - o contrato de API precisa ser mantido sincronizado manualmente (recomenda-se documentar com OpenAPI/Swagger gerado a partir dos schemas Zod do backend, ou ao menos um doc de contrato versionado). Deploys e pipelines de CI/CD são independentes por repositório, o que também facilita a futura extração de microsserviços (alinhado ao ADR 003).

---

## ADR 011 - API REST

**Status**: Aceito

**Contexto**: Comunicação entre frontend e backend, com possível consumo futuro por app mobile (React Native).

**Decisão**: API REST convencional (recursos, verbos HTTP, status codes), versionada por path (ex.: `/api/v1/...`) para permitir evolução sem quebrar clientes existentes durante o hackathon.

**Consequências**: Padrão simples, bem conhecido por toda a equipe, fácil de documentar e testar manualmente (Postman/Insomnia) durante o desenvolvimento sob pressão de tempo. Mobile reaproveita a mesma API sem necessidade de adaptação.

---

## ADR 012 - Sem upload de arquivos no MVP - entrada via texto/formulário

**Status**: Aceito

**Contexto**: Conforme decisão tomada em conversa anterior do projeto (e refletida na seção 5 do documento de contexto consolidado), o OCR de caligrafia via foto foi removido do escopo por alto risco técnico, e substituído por entrada digital (textarea + múltipla escolha). Isso elimina a necessidade de upload de arquivos (PDF/imagem) no MVP.

**Decisão**: A entrada de material pelo professor é feita via texto digitado (textarea) e/ou estruturas de múltipla escolha na interface, não por upload de arquivo. Consequentemente, **não há necessidade de um serviço de armazenamento de objetos (S3 ou similar) no MVP**.

**Consequências**: Reduz drasticamente a complexidade de infraestrutura (sem bucket, sem políticas de acesso a arquivo, sem necessidade de parsing de PDF/imagem no backend). Caso o roadmap pós-hackathon inclua upload de material (ex.: PDFs/slides reais), este ADR deverá ser revisitado e um novo ADR criado para a escolha do storage.

---

## ADR 013 - Autenticação via JWT próprio (email/senha)

**Status**: Aceito

**Contexto**: MVP precisa de autenticação simples para diferenciar professor (Marta) e aluno (João), sem necessidade de SSO institucional no curto prazo do hackathon.

**Decisão**: Autenticação própria com email/senha, emissão de JWT (access token, possivelmente com refresh token) pelo backend. Hash de senha com bcrypt (ou argon2) na camada de adapter, nunca exposto ao domínio.

**Consequências**: Controle total sobre o fluxo, sem dependência de serviço terceiro (custo zero, sem necessidade de configurar provedor externo durante o hackathon). Trade-off: equipe assume responsabilidade por segurança básica (expiração de token, hashing, proteção de rotas) - escopo aceitável para MVP de hackathon, mas deve ser revisitado antes de qualquer uso em produção real.

**Alternativas consideradas**: Clerk/Auth0 (mais rápido de integrar em alguns aspectos, mas adiciona dependência externa e curva de configuração que não compensa para o tempo disponível, além de gerar menos controle pedagógico sobre o fluxo de auth para fins de avaliação técnica do hackathon).

---

## ADR 014 - Frontend React com separação estrita entre apresentação (JSX) e lógica (custom hooks)

**Status**: Aceito

**Contexto**: Equipe planeja reaproveitar a lógica de negócio do frontend web para um futuro app React Native, evitando reescrita.

**Decisão**: Componentes React devem conter apenas marcação (JSX) e chamadas a custom hooks - nenhuma lógica de estado, efeito colateral ou orquestração de dados deve viver dentro do corpo de retorno de um componente. Toda lógica de estado/efeitos vive em custom hooks (`useX`), que por sua vez consomem uma camada de **services** (regra de aplicação do frontend: orquestração de chamadas, formatação de dados para a UI).

**Consequências**: Custom hooks e a camada de services são, em tese, reaproveitáveis quase integralmente no React Native - apenas os componentes visuais (JSX/View) precisam ser reescritos por plataforma. Exige disciplina da equipe para não "vazar" lógica para dentro do JSX sob pressão de prazo.

---

## ADR 015 - Axios isolado em camada de infraestrutura + React Query

**Status**: Aceito

**Contexto**: Necessidade de uma camada HTTP testável e substituível, e de um bom gerenciamento de cache/estado de servidor (loading, erro, revalidação) sem reinventar isso manualmente.

**Decisão**: Axios como cliente HTTP, mas encapsulado inteiramente em uma camada de infraestrutura (ex.: `infra/http/apiClient.ts` + clients específicos por recurso), nunca chamado diretamente de componentes ou hooks de UI. React Query (`@tanstack/react-query`) para gerenciamento de estado de servidor (cache, refetch, invalidação), consumido pelos custom hooks (ADR 014) e pela camada de services.

**Consequências**: Troca de biblioteca HTTP (ex.: para `fetch` nativo no caso do React Native, se necessário) fica restrita à camada de infraestrutura. React Query reduz significativamente código manual de loading/erro/cache, ganho relevante de produtividade para o prazo do hackathon.

---

## ADR 016 - Zustand para estado global/contextos

**Status**: Aceito

**Contexto**: Necessidade de estado global leve (ex.: usuário autenticado, perfil de adaptação selecionado), sem o boilerplate do Redux e sem os problemas de re-render do Context API puro para estados que mudam com frequência.

**Decisão**: Zustand para qualquer estado verdadeiramente global ou cross-cutting. Estado local de UI continua em `useState`/`useReducer` dentro dos custom hooks (ADR 014). Estado de servidor (dados vindos da API) é responsabilidade do React Query (ADR 015), não do Zustand - separação clara entre "estado de servidor" e "estado de cliente".

**Consequências**: API mínima, fácil de aprender pela equipe inteira rapidamente, e compatível com React Native sem alterações relevantes.

---

## ADR 017 - Tailwind CSS + shadcn/ui para estilização e componentes

**Status**: Aceito

**Contexto**: Necessidade de uma interface com curva de aprendizado zero para o usuário final (restrição mapeada na jornada do usuário) e produtividade alta de desenvolvimento dado o prazo.

**Decisão**: Tailwind CSS como abordagem de estilização (utility-first), shadcn/ui como base de componentes acessíveis e customizáveis (não é uma dependência de runtime - os componentes são copiados para o projeto, o que mantém controle total sobre eles).

**Consequências**: Velocidade alta de desenvolvimento de UI; boa acessibilidade de base (relevante para o perfil de adaptação 3 - alto contraste, compatibilidade com leitor de tela - ver seção 6 do contexto). Tailwind não se aplica diretamente ao React Native (ADR 014 cobre reaproveitamento de lógica, não de estilos - estilização mobile será refeita com a abordagem nativa equivalente, ex. NativeWind, a avaliar em ADR futuro quando o mobile entrar em escopo).

---

## ADR 018 - Husky com lint/prettier no pre-commit e testes por diff no pre-push

**Status**: Aceito

**Contexto**: Equipe de 5 pessoas, ritmo acelerado de hackathon, risco de quebrar build ou introduzir código mal formatado/sem padrão sob pressão.

**Decisão**: Husky configurado em ambos os repositórios (frontend e backend) com:
- **pre-commit**: lint (ESLint) + Prettier rodando via `lint-staged`, restrito aos arquivos staged (não o projeto inteiro, para manter o commit rápido).
- **pre-push**: execução dos testes de regra de negócio (Jest) restrita aos arquivos impactados pelo diff (ex.: via `jest --changedSince` ou equivalente, comparando contra a branch base), evitando rodar a suíte inteira a cada push e mantendo o foco nos testes de comportamento definidos no ADR 009.

**Consequências**: Feedback rápido para a equipe, sem bloquear o fluxo de trabalho com suítes completas a cada commit. Risco aceito: testes não diretamente relacionados ao diff não rodam localmente no pre-push (mitigado por rodar a suíte completa em CI, se houver tempo de configurar).

---

## Resumo de pendências relacionadas a estas decisões

- [ ] Definir e documentar o contrato de API (OpenAPI/Swagger ou doc manual) dado que back e front estão em repositórios separados (ADR 010, 011).
- [ ] Decidir nome dos módulos de domínio do monólito modular (ADR 003) - provavelmente: `material`, `adaptacao`, `usuario`, `relatorio`.
- [ ] Validar limite de 500 e-mails/dia do Gmail SMTP (ADR 007) contra o volume esperado de demo.
- [ ] Avaliar, quando o mobile entrar em escopo, a abordagem de estilização equivalente ao Tailwind (ex.: NativeWind) - novo ADR.
