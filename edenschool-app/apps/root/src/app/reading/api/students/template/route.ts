import { generateTemplateBuffer } from "@/lib/reading/student-import";

export const runtime = "nodejs";

export async function GET() {
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
