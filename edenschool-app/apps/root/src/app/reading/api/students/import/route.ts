import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { parseAndImport } from "@/lib/reading/student-import";
import { getSession } from "@/lib/reading/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 첨부되지 않았습니다." }, { status: 400 });
    }
    if (!/\.xlsx$/i.test(file.name)) {
      return NextResponse.json({ error: ".xlsx 엑셀 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const report = await parseAndImport(buf);

    revalidatePath("/reading/students");
    revalidatePath("/reading/classes");
    revalidatePath("/reading");

    return NextResponse.json(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "임포트 중 오류가 발생했습니다.";
    return NextResponse.json({ error: `엑셀을 읽을 수 없습니다: ${message}` }, { status: 400 });
  }
}
