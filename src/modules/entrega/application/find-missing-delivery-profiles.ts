import { ZodError } from "zod";

import { parseLearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { LearningProfileRepository } from "../../escola/ports/learning-profile-repository.js";
import type { ClassStudentWithProfile } from "../../escola/domain/student.js";
import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { isVariantAdaptationComplete } from "../../material/application/is-variant-adaptation-complete.js";
import type { Homework } from "../../material/domain/homework.js";
import { indexVariantsByLearningProfileId } from "./resolve-delivery-variant-for-profile.js";

export interface MissingDeliveryProfile {
  id: string;
  name: string;
}

/**
 * Perfis presentes na turma (via alunos matriculados) que ainda não têm
 * variante adaptada pronta para envio (Épico 7, BE-E7.1).
 */
export async function findMissingDeliveryProfiles(input: {
  studentsWithProfile: Array<
    ClassStudentWithProfile & { learningProfile: LearningProfile }
  >;
  variants: Homework[];
  learningProfileRepository: LearningProfileRepository;
}): Promise<MissingDeliveryProfile[]> {
  const requiredProfiles: Map<string, string> = new Map();

  for (const student of input.studentsWithProfile) {
    requiredProfiles.set(
      student.learningProfile.id,
      student.learningProfile.name,
    );
  }

  const variantByProfileId = indexVariantsByLearningProfileId(input.variants);

  const missing: MissingDeliveryProfile[] = [];

  for (const [profileId, profileName] of requiredProfiles) {
    const variant = variantByProfileId.get(profileId);
    if (!variant) {
      missing.push({ id: profileId, name: profileName });
      continue;
    }

    const profile = await input.learningProfileRepository.findById(profileId);
    if (!profile) {
      missing.push({ id: profileId, name: profileName });
      continue;
    }

    try {
      const profilePrompt = parseLearningProfilePrompt(profile.prompt);
      if (!isVariantAdaptationComplete(variant, profilePrompt)) {
        missing.push({ id: profileId, name: profileName });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        missing.push({ id: profileId, name: profileName });
        continue;
      }
      throw error;
    }
  }

  return missing.sort((a, b) => a.name.localeCompare(b.name));
}
