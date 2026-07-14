import "server-only";
import { prisma } from "./prisma";
import { EDEN_PHILOSOPHY_DEFAULT } from "./correction-config";

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function getEdenPhilosophy(): Promise<string> {
  return getSetting("eden_philosophy", EDEN_PHILOSOPHY_DEFAULT);
}
