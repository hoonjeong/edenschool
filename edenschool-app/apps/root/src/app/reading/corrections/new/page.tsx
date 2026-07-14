import { prisma } from "@/lib/reading/prisma";
import WizardClient from "./wizard-client";
import { DEFAULT_CORRECTION_OPTIONS } from "@/lib/reading/correction-config";
import { getEdenPhilosophy } from "@/lib/reading/settings";

export const dynamic = "force-dynamic";

export default async function NewCorrectionPage() {
  const [students, edenPhilosophy] = await Promise.all([
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      select: { id: true, name: true, grade: true },
      orderBy: { name: "asc" },
    }),
    getEdenPhilosophy(),
  ]);

  return (
    <WizardClient
      students={students}
      edenPhilosophy={edenPhilosophy}
      defaults={DEFAULT_CORRECTION_OPTIONS}
    />
  );
}
