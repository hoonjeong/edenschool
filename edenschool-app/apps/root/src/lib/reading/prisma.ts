import { PrismaClient } from "@/lib/reading/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// 독서교육원(edenbooks) 전용 DB 연결 — Prisma 7 드라이버 어댑터 방식.
// edenschool 운영 DB와 분리된 별도 데이터베이스(EDENBOOKS_DB_NAME, 기본 'edenbooks')를 사용한다.
// 접속 정보는 EDENBOOKS_DB_* 를 우선 사용하고, 없으면 edenschool DB_* 자격증명을 재사용한다.
function createClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.EDENBOOKS_DB_HOST ?? process.env.DB_HOST ?? "localhost",
    port: Number(process.env.EDENBOOKS_DB_PORT ?? process.env.DB_PORT ?? 3306),
    user: process.env.EDENBOOKS_DB_USER ?? process.env.DB_USER ?? "root",
    password: process.env.EDENBOOKS_DB_PASSWORD ?? process.env.DB_PASSWORD ?? "",
    database: process.env.EDENBOOKS_DB_NAME ?? "edenbooks",
    connectionLimit: Number(process.env.EDENBOOKS_DB_CONNECTION_LIMIT ?? 5),
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  readingPrisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.readingPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.readingPrisma = prisma;
