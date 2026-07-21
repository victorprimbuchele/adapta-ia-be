# AdaptaAI — Tarefas Técnicas e Critérios de Aceite (MVP v0.1)

> Baseado no ERD final (Miro) e no `schema.prisma` já validados. Organizado pelos módulos de domínio do backend: `user`, `material`, `adaptacao`, `relatorio` (este último fora do MVP).

---

## Como usar este documento

- Cada **Épico** corresponde a um fluxo do MVP.
- Cada **Tarefa técnica** é granular o suficiente para virar um card de board (Trello/Jira/Notion), com módulo de origem indicado.
- Os **Critérios de Aceite** (Dado/Quando/Então) cobrem as histórias de usuário principais — não cada tarefa técnica individualmente, já que várias tarefas técnicas compõem uma única história observável pelo usuário.

---



## Épico 1 — Autenticação e Cadastro de Professor

**Módulo:** `user`

### Tarefas técnicas

1. Modelar e migrar entidade `User` (Prisma) — ✅ já feito.
2. Endpoint `POST /api/v1/usuarios` (cadastro de professor) com validação Zod (email, senha, nome).
3. Hash de senha (bcrypt/argon2) no cadastro.
4. Endpoint `POST /api/v1/auth/login` (JWT) com verificação de credenciais.
5. Middleware de autenticação JWT (validação de token em rotas protegidas).
6. Atualização de `last_login` no login bem-sucedido.
7. Endpoint `GET /api/v1/usuarios/me` (dados do professor autenticado).
8. Tratamento de erros: email duplicado, credenciais inválidas, senha fraca.
9. Testes Jest (regras de negócio: senha não pode ser fraca, email deve ser único, hash nunca deve ser retornado na resposta).



### Critérios de Aceite

**História: Cadastro de professor**

```
Dado que sou um visitante não cadastrado na plataforma
Quando eu preencho nome, e-mail e senha válidos e envio o formulário de cadastro
Então minha conta de professor é criada com sucesso
E recebo uma confirmação de que o cadastro foi concluído
E minha senha é armazenada de forma criptografada (nunca em texto puro)
```

```
Dado que já existe uma conta cadastrada com um determinado e-mail
Quando eu tento me cadastrar novamente usando esse mesmo e-mail
Então o sistema rejeita o cadastro
E recebo uma mensagem informando que o e-mail já está em uso
```

**História: Login**

```
Dado que já possuo uma conta de professor cadastrada
Quando eu informo e-mail e senha corretos
Então recebo um token de autenticação válido
E meu campo last_login é atualizado
```

```
Dado que já possuo uma conta de professor cadastrada
Quando eu informo uma senha incorreta
Então o sistema recusa o acesso
E recebo uma mensagem de erro genérica (sem indicar se o e-mail existe ou não)
```

---



## Épico 2 — Gestão de Escolas, Séries e Turmas

**Módulo:** `user`

### Tarefas técnicas

1. Seed de `School` e `Grade` (dados de referência fixos — **confirmado: sem cadastro dinâmico no MVP**).
2. Endpoint `GET /api/v1/escolas` e `GET /api/v1/series` (listagem dos dados de referência para popular o formulário de criação de turma).
3. Endpoint `POST /api/v1/turmas` (criação de turma vinculada a `school_id`, `grade_id`, e `professor_id` = usuário autenticado).
4. Endpoint `GET /api/v1/turmas` (listar turmas do professor autenticado).
5. Endpoint `GET /api/v1/turmas/:id` (detalhe da turma, incluindo alunos vinculados).
6. Validação: professor só pode ver/editar suas próprias turmas (autorização por `professor_id`).
7. Soft delete de turma (`deleted_at`).
8. Testes Jest (regra: turma sempre precisa de escola, série e professor responsável).



### Critérios de Aceite

**História: Criação de turma**

```
Dado que estou autenticado como professor
Quando eu crio uma turma informando nome, escola e série
Então a turma é criada com sucesso
E eu sou automaticamente definido como o professor responsável por ela
```

```
Dado que estou autenticado como professor
Quando eu tento visualizar uma turma que não é minha
Então o sistema nega o acesso
```

---



## Épico 3 — Cadastro de Alunos e Vinculação com Perfis de Aprendizagem

**Módulo:** `user`

> **Regra de negócio confirmada:** quando um aluno tem mais de uma dificuldade, isso **não** gera múltiplos perfis simultâneos para ele — as dificuldades se somam em um **perfil de aprendizagem composto** (ex.: "Dislexia + baixa visão"), previamente cadastrado como um único `LearningProfile`. Isso evita que o aluno precise juntar informação de e-mails/PDFs separados para entender a atividade completa. Na prática, cada aluno é vinculado a **um único perfil de aprendizagem** por vez (mesmo que o schema `UserLearningProfile` seja N:N por flexibilidade futura em v0.2+, o fluxo do MVP assume 1 perfil ativo por aluno).



### Tarefas técnicas

1. Endpoint `POST /api/v1/turmas/:id/alunos` (cadastro/vinculação de aluno à turma via `UserClass`).
2. Endpoint `POST /api/v1/alunos/:id/perfil-aprendizagem` (vincula **um único** `LearningProfile` — composto ou simples — ao aluno via `UserLearningProfile`; substitui o perfil anterior se já existir).
3. Endpoint `GET /api/v1/turmas/:id/alunos` (listar alunos da turma com seu perfil).
4. Endpoint `DELETE /api/v1/turmas/:id/alunos/:alunoId` (remoção de aluno da turma).
5. Seed de `LearningProfile`: os 3 perfis-base definidos (simplificado+glossário+TTS; microtarefas+estrutura visual; alto contraste+fonte grande+leitor de tela) **e** perfis compostos combinando-os (ex.: perfil 1+3), cada um com seu próprio `prompt` (JSONB) ajustado para a combinação.
6. Validação: e-mail do aluno obrigatório e válido (necessário para distribuição posterior).
7. Testes Jest (regra: ao vincular um novo perfil a um aluno que já tinha um, o anterior é substituído, não somado).



### Critérios de Aceite

**História: Vinculação de aluno a perfil de aprendizagem**

```
Dado que estou autenticado como professor e tenho uma turma criada
Quando eu cadastro um aluno informando nome e e-mail, e seleciono o perfil de aprendizagem correspondente às dificuldades dele (simples ou composto)
Então o aluno é vinculado à turma
E o perfil de aprendizagem selecionado fica associado a ele
```

```
Dado que um aluno tem mais de um tipo de dificuldade de aprendizagem
Quando eu vinculo esse aluno a um perfil de aprendizagem
Então devo selecionar um perfil composto que já reflita a combinação de dificuldades
E não devo vincular múltiplos perfis simples separadamente a esse aluno
```

```
Dado que um aluno já está vinculado a um perfil de aprendizagem
Quando eu atualizo o perfil dele para um diferente
Então o novo perfil substitui o anterior
E nenhuma atividade já adaptada e enviada anteriormente é alterada retroativamente
```

---



## Épico 4 — Criação de Atividade (Formulário Estruturado)

**Módulo:** `material`

### Tarefas técnicas

1. Endpoint `POST /api/v1/atividades` (criação de `Homework` geradora — `is_draft = true`, `homework_id = null`, `learning_profile_id = null`).
2. Validação Zod do formulário estruturado (título, conteúdo principal, questão, disciplina, turma).
3. Endpoint `PATCH /api/v1/atividades/:id` (edição de rascunho).
4. Endpoint `GET /api/v1/atividades/:id` (detalhe da atividade, incluindo variantes já geradas).
5. Endpoint `GET /api/v1/turmas/:id/atividades` (listar atividades da turma).
6. Seed de `Subject` (lista de disciplinas).
7. Testes Jest (regra: atividade geradora nunca tem `learning_profile_id` preenchido).



### Critérios de Aceite

**História: Criação de atividade via formulário**

```
Dado que estou autenticado como professor e tenho uma turma com alunos vinculados
Quando eu preencho o formulário estruturado de atividade (título, conteúdo, questão, disciplina) e salvo
Então uma atividade geradora é criada como rascunho
E ela fica disponível para solicitar adaptação por perfil de aprendizagem
```

```
Dado que tenho uma atividade salva como rascunho
Quando eu edito o conteúdo antes de solicitar a adaptação
Então as alterações são salvas
E nenhuma variante adaptada é gerada automaticamente até que eu solicite
```

---



## Épico 5 — Adaptação via LLM (Texto Simplificado + Glossário + TTS)

**Módulo:** `adaptacao`

### Tarefas técnicas

1. Endpoint `POST /api/v1/atividades/:id/adaptar` — dispara adaptação para cada perfil de aprendizagem presente na turma (ou perfis selecionados).
2. Fila BullMQ para processamento assíncrono de adaptação (evita bloquear a requisição do professor).
3. Skill/prompt de adaptação: chamada à API de LLM usando `LearningProfile.prompt` + conteúdo estruturado da atividade geradora.
4. Geração de glossário (JSON estruturado) a partir do conteúdo simplificado.
5. Persistência: criação de `Homework` variante (`homework_id` = geradora, `learning_profile_id` preenchido, `glossary` preenchido).
6. Integração com API de TTS — geração de áudio a partir do texto simplificado.
7. Upload do áudio gerado para storage e criação de registro em `File` (`type = audio`), vinculado a `Homework.audio_file_id`.
8. Idempotência: evitar gerar duas variantes para o mesmo par atividade+perfil (usar Redis).
9. Endpoint `GET /api/v1/atividades/:id/status-adaptacao` (polling de status: pendente/processando/concluído/erro).
10. Tratamento de falha da API de LLM/TTS (retry com backoff via BullMQ; status de erro visível ao professor).
11. Testes Jest (regra: glossário e áudio só existem em variantes, nunca na atividade geradora — quando aplicável ao fluxo).



### Critérios de Aceite

**História: Solicitação de adaptação**

```
Dado que tenho uma atividade geradora salva e minha turma tem alunos com perfis de aprendizagem definidos
Quando eu solicito a adaptação da atividade
Então o sistema gera uma variante adaptada para cada perfil de aprendizagem (simples ou composto) presente na turma
E cada variante contém texto simplificado, glossário e áudio TTS correspondentes àquele perfil específico
```

```
Dado que solicitei a adaptação de uma atividade
Quando o processamento ainda está em andamento
Então eu consigo consultar o status da adaptação (processando)
E não recebo uma variante incompleta como se estivesse pronta
```

```
Dado que solicitei a adaptação de uma atividade
Quando a chamada à API de LLM ou de TTS falha
Então o sistema tenta novamente automaticamente (retry)
E, se persistir a falha, o status da atividade indica erro
E eu sou informado de que preciso tentar novamente
```

```
Dado que já solicitei a adaptação de uma atividade para um perfil específico
Quando eu solicito a adaptação novamente para o mesmo perfil antes da anterior terminar
Então o sistema não cria uma variante duplicada
```

---



## Épico 6 — Geração de PDF Adaptado

**Módulo:** `material`

### Tarefas técnicas

1. Template de PDF por perfil de aprendizagem (ex.: alto contraste/fonte grande para o perfil 3).
2. Geração de PDF a partir da variante adaptada (texto simplificado + glossário), pós-processamento da adaptação LLM.
3. Upload do PDF gerado para storage e criação de registro em `File` (`type = pdf`), vinculado a `Homework.content_file_id`.
4. Endpoint `GET /api/v1/atividades/:id/pdf` (download/preview do PDF gerado, autorizado apenas ao professor da turma).
5. Testes de geração de PDF (verificação de que glossário e conteúdo simplificado aparecem corretamente formatados).



### Critérios de Aceite

**História: Geração de PDF adaptado**

```
Dado que uma variante adaptada de atividade foi gerada com sucesso (texto + glossário)
Quando o processo de geração de PDF é concluído
Então um arquivo PDF é criado refletindo o perfil de aprendizagem correspondente (ex.: alto contraste, fonte grande)
E o PDF fica disponível para download pelo professor
```

---



## Épico 7 — Distribuição por E-mail

**Módulo:** `adaptacao`

### Tarefas técnicas

1. Endpoint `POST /api/v1/atividades/:id/enviar` — cria um `Sending` (status inicial: pendente/agendado).
2. Para cada aluno da turma, criar um `HomeworkSending` (vinculando a variante correta ao perfil do aluno) e um `EmailSending` correspondente.
3. Lógica de seleção de variante: para cada aluno, escolher a `Homework` (variante) cujo `learning_profile_id` corresponde **exatamente ao único perfil (simples ou composto) do aluno** — sem lógica de prioridade entre múltiplos perfis, já que cada aluno tem um único perfil ativo (ver regra confirmada no Épico 3).
4. Preenchimento de `EmailSending.recipient_email` (snapshot do e-mail do aluno) e `EmailSending.payload` (snapshot do que foi enviado: `homework_id`, título).
5. Integração com Gmail SMTP para envio efetivo do e-mail (anexando PDF e/ou link para áudio).
6. Fila BullMQ para envio assíncrono em lote (evita timeout em turmas grandes).
7. Atualização de `Sending.status` e `Sending.sent_at` ao concluir o lote.
8. Tratamento de falha de envio individual (não travar o lote inteiro por causa de um e-mail inválido) — status do `EmailSending` individual marcado como falho.
9. Endpoint `GET /api/v1/envios/:id` (status do envio, com contagem de sucesso/falha por aluno).
10. **Endpoint** `POST /api/v1/envios/:id/reenviar` (reenvio manual acionado pelo professor na plataforma, reprocessando apenas os `EmailSending` marcados como falhos daquele envio).
11. Testes Jest (regra: cada aluno recebe a variante compatível com seu perfil de aprendizagem, não a atividade geradora; regra: reenvio afeta apenas os destinatários que falharam, não o lote inteiro).



### Critérios de Aceite

**História: Envio de atividades adaptadas**

```
Dado que uma atividade tem variantes adaptadas geradas para todos os perfis de aprendizagem presentes na turma
Quando eu solicito o envio da atividade para a turma
Então cada aluno recebe por e-mail a variante correspondente ao seu perfil de aprendizagem
E o e-mail usado no envio fica registrado historicamente, mesmo que o cadastro do aluno mude depois
```

```
Dado que solicitei o envio de uma atividade para a turma
Quando o e-mail de um aluno específico falha no envio (ex.: endereço inválido)
Então os demais alunos da turma continuam recebendo normalmente
E eu consigo ver quais envios falharam e para quem
```

```
Dado que uma atividade ainda não teve suas variantes adaptadas geradas para todos os perfis da turma
Quando eu tento solicitar o envio
Então o sistema impede o envio incompleto
E me informa quais perfis ainda não têm variante pronta
```

**História: Reenvio manual em caso de falha**

```
Dado que um envio foi concluído mas alguns e-mails falharam
Quando eu acesso o status do envio e aciono o reenvio manual
Então o sistema tenta reenviar apenas para os alunos cujo envio falhou
E os alunos que já receberam com sucesso não recebem o e-mail novamente
```

---



## Decisões confirmadas (não são mais pendências)

- **Múltiplos perfis de aprendizagem por aluno**: dificuldades combinadas geram um **perfil composto único**, não múltiplos perfis simultâneos. Cada aluno tem um único perfil ativo por vez. Ver detalhamento no Épico 3.
- **Cadastro de Escola/Série**: dados de referência fixos via **seed** no MVP — sem cadastro dinâmico pelo professor. Ver Épico 2.
- **Reenvio em caso de falha de e-mail**: fluxo **manual acionado pelo professor na plataforma**, reprocessando apenas os destinatários que falharam. Ver tarefa técnica 10 e critério de aceite no Épico 7.

---

*Documento gerado a partir do ERD e schema.prisma validados em conversa. Fora do MVP: ACL (Permissions/Profiles), Audit, tracking de abertura/clique de e-mail — a reintroduzir em v0.2/v0.3.*