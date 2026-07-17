import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "../src/generated/prisma/client.js";

/**
 * Dados de referência fixos do MVP (Épico 2 — Gestão de Escolas, Séries e
 * Turmas; Épico 3 — Perfis de Aprendizagem). Sem cadastro dinâmico: escolas,
 * séries e perfis só existem via seed.
 *
 * Idempotente (`upsert`): pode ser re-executado com segurança em qualquer
 * ambiente (dev, CI, produção) sem duplicar registros.
 */
const SCHOOLS: ReadonlyArray<{ name: string; city: string; state: string }> = [
  { name: "Escola Municipal João de Barro", city: "São Paulo", state: "SP" },
  { name: "Colégio Estadual Dom Pedro II", city: "Rio de Janeiro", state: "RJ" },
  { name: "Escola Estadual Anísio Teixeira", city: "Salvador", state: "BA" },
  { name: "Colégio Municipal Paulo Freire", city: "Belo Horizonte", state: "MG" },
  { name: "Escola Municipal Cecília Meireles", city: "Curitiba", state: "PR" },
  { name: "Escola Estadual Machado de Assis", city: "Porto Alegre", state: "RS" },
];

const GRADES: ReadonlyArray<{ name: string; sortOrder: number }> = [
  { name: "1º Ano - Ensino Fundamental", sortOrder: 1 },
  { name: "2º Ano - Ensino Fundamental", sortOrder: 2 },
  { name: "3º Ano - Ensino Fundamental", sortOrder: 3 },
  { name: "4º Ano - Ensino Fundamental", sortOrder: 4 },
  { name: "5º Ano - Ensino Fundamental", sortOrder: 5 },
  { name: "6º Ano - Ensino Fundamental", sortOrder: 6 },
  { name: "7º Ano - Ensino Fundamental", sortOrder: 7 },
  { name: "8º Ano - Ensino Fundamental", sortOrder: 8 },
  { name: "9º Ano - Ensino Fundamental", sortOrder: 9 },
  { name: "1º Ano - Ensino Médio", sortOrder: 10 },
  { name: "2º Ano - Ensino Médio", sortOrder: 11 },
  { name: "3º Ano - Ensino Médio", sortOrder: 12 },
];

type AdaptationFlags = {
  simplifyText: boolean;
  glossary: boolean;
  tts: boolean;
  microtasks: boolean;
  visualStructure: boolean;
  highContrast: boolean;
  largeFont: boolean;
  screenReader: boolean;
};

type LearningProfileSeed = {
  name: string;
  prompt: {
    code: string;
    kind: "base" | "composite";
    combines: string[];
    adaptations: AdaptationFlags;
    instructions: string;
  };
};

const ADAPTATIONS_OFF: AdaptationFlags = {
  simplifyText: false,
  glossary: false,
  tts: false,
  microtasks: false,
  visualStructure: false,
  highContrast: false,
  largeFont: false,
  screenReader: false,
};

/**
 * Catálogo de `LearningProfile` (Épico 3, BE-E3.5): 3 perfis-base e as
 * combinações compostas. Dificuldades combinadas = um único perfil composto
 * com `prompt` próprio (não múltiplos vínculos ao aluno).
 */
const LEARNING_PROFILES: ReadonlyArray<LearningProfileSeed> = [
  {
    name: "Simplificado + glossário + TTS",
    prompt: {
      code: "P1",
      kind: "base",
      combines: ["P1"],
      adaptations: {
        ...ADAPTATIONS_OFF,
        simplifyText: true,
        glossary: true,
        tts: true,
      },
      instructions:
        "Reescreva a atividade em linguagem simples e clara, adequada a " +
        "estudantes com dificuldades de leitura (ex.: dislexia). Produza um " +
        "glossário com os termos mais complexos e prepare o texto " +
        "simplificado para síntese de voz (TTS).",
    },
  },
  {
    name: "Microtarefas + estrutura visual",
    prompt: {
      code: "P2",
      kind: "base",
      combines: ["P2"],
      adaptations: {
        ...ADAPTATIONS_OFF,
        microtasks: true,
        visualStructure: true,
      },
      instructions:
        "Fragmente a atividade em microtarefas sequenciais e curtas. Use " +
        "estrutura visual explícita (passos numerados, listas, destaques) " +
        "para reduzir a carga cognitiva e facilitar o acompanhamento.",
    },
  },
  {
    name: "Alto contraste + fonte grande + leitor de tela",
    prompt: {
      code: "P3",
      kind: "base",
      combines: ["P3"],
      adaptations: {
        ...ADAPTATIONS_OFF,
        highContrast: true,
        largeFont: true,
        screenReader: true,
      },
      instructions:
        "Adapte o conteúdo para baixa visão e leitores de tela: priorize " +
        "texto com alto contraste, fonte ampliada e marcação semântica " +
        "compatível com leitores de tela (estrutura linear, descrições " +
        "textuais, evite informação só por cor ou imagem).",
    },
  },
  {
    name: "Simplificado + glossário + TTS + microtarefas + estrutura visual",
    prompt: {
      code: "P1+P2",
      kind: "composite",
      combines: ["P1", "P2"],
      adaptations: {
        ...ADAPTATIONS_OFF,
        simplifyText: true,
        glossary: true,
        tts: true,
        microtasks: true,
        visualStructure: true,
      },
      instructions:
        "Combine simplificação textual (com glossário e TTS) e fragmentação " +
        "em microtarefas com estrutura visual. O texto deve ser simples e, " +
        "ao mesmo tempo, organizado em passos curtos e bem sinalizados.",
    },
  },
  {
    name: "Simplificado + glossário + TTS + alto contraste + fonte grande + leitor de tela",
    prompt: {
      code: "P1+P3",
      kind: "composite",
      combines: ["P1", "P3"],
      adaptations: {
        ...ADAPTATIONS_OFF,
        simplifyText: true,
        glossary: true,
        tts: true,
        highContrast: true,
        largeFont: true,
        screenReader: true,
      },
      instructions:
        "Combine linguagem simplificada (glossário + TTS) com acessibilidade " +
        "visual e para leitores de tela. O texto simplificado deve permanecer " +
        "linear e semanticamente marcado, adequado a alto contraste e fonte " +
        "grande (ex.: dislexia + baixa visão).",
    },
  },
  {
    name: "Microtarefas + estrutura visual + alto contraste + fonte grande + leitor de tela",
    prompt: {
      code: "P2+P3",
      kind: "composite",
      combines: ["P2", "P3"],
      adaptations: {
        ...ADAPTATIONS_OFF,
        microtasks: true,
        visualStructure: true,
        highContrast: true,
        largeFont: true,
        screenReader: true,
      },
      instructions:
        "Combine microtarefas com estrutura visual e requisitos de " +
        "acessibilidade (alto contraste, fonte grande, leitor de tela). " +
        "Cada passo deve ser curto, visualmente claro e navegável por " +
        "tecnologia assistiva.",
    },
  },
  {
    name: "Simplificado + glossário + TTS + microtarefas + estrutura visual + alto contraste + fonte grande + leitor de tela",
    prompt: {
      code: "P1+P2+P3",
      kind: "composite",
      combines: ["P1", "P2", "P3"],
      adaptations: {
        simplifyText: true,
        glossary: true,
        tts: true,
        microtasks: true,
        visualStructure: true,
        highContrast: true,
        largeFont: true,
        screenReader: true,
      },
      instructions:
        "Aplique todas as adaptações dos perfis-base: simplifique o texto " +
        "(glossário + TTS), fragmente em microtarefas com estrutura visual " +
        "e garanta acessibilidade para baixa visão e leitores de tela. " +
        "O resultado deve ser um único material coerente, não a junção de " +
        "versões separadas.",
    },
  },
];

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});
const prisma = new PrismaClient({ adapter });

async function seedSchools(): Promise<void> {
  // `School` não tem `@unique` em `name` (duas escolas podem ter o mesmo
  // nome em cidades diferentes), então verificamos existência manualmente
  // por `name` + `city` para manter o seed idempotente.
  for (const school of SCHOOLS) {
    const existing = await prisma.school.findFirst({
      where: { name: school.name, city: school.city },
    });
    if (!existing) {
      await prisma.school.create({ data: school });
    }
  }
}

async function seedGrades(): Promise<void> {
  for (const grade of GRADES) {
    await prisma.grade.upsert({
      where: { name: grade.name },
      update: { sortOrder: grade.sortOrder },
      create: grade,
    });
  }
}

async function seedLearningProfiles(): Promise<void> {
  for (const profile of LEARNING_PROFILES) {
    const prompt = profile.prompt as Prisma.InputJsonValue;
    await prisma.learningProfile.upsert({
      where: { name: profile.name },
      update: { prompt },
      create: { name: profile.name, prompt },
    });
  }
}

async function main(): Promise<void> {
  await seedGrades();
  await seedSchools();
  await seedLearningProfiles();

  const [schoolCount, gradeCount, learningProfileCount] = await Promise.all([
    prisma.school.count(),
    prisma.grade.count(),
    prisma.learningProfile.count(),
  ]);
  console.log(
    `Seed concluído: ${schoolCount} escola(s), ${gradeCount} série(s), ` +
      `${learningProfileCount} perfil(is) de aprendizagem.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
