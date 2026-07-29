import mysql from 'mysql2/promise';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// 수업자료생성 전용 커넥션 풀.
//
// 공용 풀(@edenschool/common/db)은 charset='utf8'(3바이트)이라 이모지 등 4바이트 문자를
// 저장할 수 없다. 이 기능은 AI가 만든 HTML 본문을 LONGTEXT에 그대로 넣으므로 utf8mb4가 필요하다.
// 공용 풀의 charset을 바꾸면 전체 앱에 영향이 가므로, /reading이 별도 Prisma 풀을 쓰는 것과
// 같은 방식으로 이 기능만 별도 풀을 둔다. 접속 대상 DB는 동일(edenschool).
const globalForLm = globalThis as unknown as { __lessonMaterialPool?: Pool };

const pool: Pool =
  globalForLm.__lessonMaterialPool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'edenschool',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: Number(process.env.LESSON_MATERIAL_DB_CONNECTION_LIMIT) || 5,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForLm.__lessonMaterialPool = pool;
}

export default pool;

export async function query<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  // 대용량 LONGTEXT를 다루므로 execute(prepared) 사용 — query는 패킷을 2배로 쓴다.
  const [rows] = await pool.execute<T[]>(sql, params);
  return rows;
}

export async function one<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function insert(sql: string, params: unknown[] = []): Promise<number> {
  const [res] = await pool.execute<ResultSetHeader>(sql, params);
  return res.insertId;
}
