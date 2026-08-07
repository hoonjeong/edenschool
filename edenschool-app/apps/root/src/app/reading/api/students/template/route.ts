import { generateTemplateBuffer } from "@/lib/reading/student-import";
import { getSession } from "@/lib/reading/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const buf = await generateTemplateBuffer();
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="eden_students_template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
