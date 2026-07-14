import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7: 마이그레이션/CLI 는 여기의 datasource.url 을 사용한다.
// 런타임 PrismaClient 의 드라이버 어댑터는 src/lib/reading/prisma.ts 에서 직접 주입한다.
// (edenbooks 전용 별도 DB. 실제 테이블 생성은 sql/edenbooks-init.sql 로 수동 적용)
const DB_URL =
  process.env.EDENBOOKS_DATABASE_URL ??
  "mysql://root:root@localhost:3306/edenbooks";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: DB_URL,
  },
});
