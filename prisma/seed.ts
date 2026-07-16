import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";

/**
 * Dados de referência fixos do MVP (Épico 2 — Gestão de Escolas, Séries e
 * Turmas). Sem cadastro dinâmico: escolas e séries só existem via seed.
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

async function main(): Promise<void> {
  await seedGrades();
  await seedSchools();

  const [schoolCount, gradeCount] = await Promise.all([
    prisma.school.count(),
    prisma.grade.count(),
  ]);
  console.log(`Seed concluído: ${schoolCount} escola(s), ${gradeCount} série(s).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
