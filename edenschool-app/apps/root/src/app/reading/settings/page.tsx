import { prisma } from "@/lib/reading/prisma";
import { getEdenPhilosophy } from "@/lib/reading/settings";
import SettingsClient from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [users, philosophy] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: "asc" } }),
    getEdenPhilosophy(),
  ]);

  return (
    <SettingsClient
      users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active }))}
      philosophy={philosophy}
    />
  );
}
