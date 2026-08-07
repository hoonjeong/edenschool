import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/reading/prisma";
import { getSession } from "@/lib/reading/session";
import { readCorrectionImage, toImagePaths } from "@/lib/reading/correction-images";

export const runtime = "nodejs";

// 첨삭 원본 답안 이미지 서빙. 학생 답안이므로 독서교육원(code='R') 로그인 필수.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, index } = await params;
  const cid = Number(id);
  const idx = Number(index);
  if (!Number.isInteger(cid) || !Number.isInteger(idx) || idx < 0) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const c = await prisma.correction.findUnique({
    where: { id: cid },
    select: { images: true },
  });
  if (!c) return new NextResponse("Not Found", { status: 404 });

  const paths = toImagePaths(c.images);
  const rel = paths[idx];
  if (!rel) return new NextResponse("Not Found", { status: 404 });

  try {
    const { buf, contentType } = await readCorrectionImage(rel);
    return new NextResponse(new Uint8Array(buf) as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        // 로그인한 사용자에게만 나가는 학생 자료이므로 사설 캐시만 허용
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("첨삭 원본 이미지 읽기 실패:", e);
    return new NextResponse("Not Found", { status: 404 });
  }
}
