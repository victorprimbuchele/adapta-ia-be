import type {
  TextSimplifierInput,
  TextSimplifierPort,
  TextSimplifierResult,
} from "../../ports/text-simplifier.js";

/**
 * Fake de `TextSimplifierPort` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009).
 */
export class InMemoryTextSimplifier implements TextSimplifierPort {
  readonly calls: TextSimplifierInput[] = [];

  result: TextSimplifierResult = {
    title: "Título simplificado",
    content: "Conteúdo adaptado em linguagem simples.",
  };

  async simplify(input: TextSimplifierInput): Promise<TextSimplifierResult> {
    this.calls.push(input);
    return this.result;
  }
}
