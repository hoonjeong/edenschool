import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import {
  selectTeacherDisplayList,
  insertTeacherDisplay,
  updateTeacherDisplay,
  deleteTeacherDisplay,
} from '@edenschool/common/queries/site-config';

export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();

  // 테이블이 비어있으면 시드 데이터 자동 삽입
  let list = await selectTeacherDisplayList();
  if (list.length === 0) {
    await seedTeacherDisplayData();
    list = await selectTeacherDisplayList();
  }

  return NextResponse.json({ list });
});

async function seedTeacherDisplayData() {
  const pool = (await import('@edenschool/common/db')).default;
  const seeds = [
    // 고등부
    ['HIGH_SCHOOL','이든배움국어상동2관','상원고','김보름 선생님',null,'/assets/teachers/김보름.jpg',null,'[{"grade":"고1","time":"토 19:00~22:00 / 일 19:00~22:00"},{"grade":"고2","time":"토 10:00~13:00 / 토 16:00~19:00"},{"grade":"고3","time":"일 10:00~13:00 / 일 15:00~18:00"}]',1,1],
    ['HIGH_SCHOOL','이든배움국어상동3관','상동고','이창완 선생님',null,'/assets/teachers/이창완.jpg',null,'[{"grade":"고1","time":"토 18:00~21:00"},{"grade":"고2","time":"일 19:00~22:00"},{"grade":"고3","time":"일 10:00~13:00"}]',2,1],
    ['HIGH_SCHOOL','이든배움국어본관','송내고','이우용 선생님',null,'/assets/teachers/이우용.jpg',null,'[{"grade":"고1","time":"일 16:00~19:00"},{"grade":"고2","time":"토 16:00~19:00"},{"grade":"고3","time":"토 19:00~22:00"}]',3,1],
    ['HIGH_SCHOOL','이든배움국어본관','부명고','박옥선 선생님',null,'/assets/teachers/박옥선.jpg',null,'[{"grade":"고1","time":"토 10:00~13:00"},{"grade":"고2","time":"토 18:30~21:30 / 일 14:30~17:30"},{"grade":"고3","time":"토 13:00~16:00 / 일 19:00~22:00"}]',4,1],
    ['HIGH_SCHOOL','이든배움국어본관','정명고','박정영 선생님',null,'/assets/teachers/박정영.jpg',null,'[{"grade":"고1","time":"토 10:00~13:00"},{"grade":"고2","time":"토 15:00~18:00 / 일 10:00~13:00"},{"grade":"고3","time":"금 19:00~22:00 / 토 19:00~22:00"}]',5,1],
    ['HIGH_SCHOOL','이든배움국어상동3관','상일고','권지영 선생님',null,'/assets/teachers/권지영.jpg',null,'[{"grade":"고1","time":"토 16:00~19:00"},{"grade":"고2","time":"토 19:00~22:00"},{"grade":"고3","time":"토 12:00~15:00 / 토 16:00~19:00"}]',6,1],
    ['HIGH_SCHOOL','이든배움국어상동5관','중원·중흥고','김소솜 선생님',null,'/assets/teachers/김소솜.jpg',null,'{"schools":[{"name":"중원고","schedule":[{"grade":"고1","time":"토 10:00~13:00"},{"grade":"고2","time":"토 16:00~19:00"},{"grade":"고3","time":"일 19:00~22:00"}]},{"name":"중흥고","schedule":[{"grade":"고1","time":"일 14:00~17:00"},{"grade":"고2","time":"일 10:00~13:00"},{"grade":"고3","time":"일 19:00~22:00"}]}]}',7,1],
    ['HIGH_SCHOOL','이든배움국어본관','계남고','백슬기 선생님',null,'/assets/teachers/백슬기.jpg',null,'[{"grade":"고1","time":"토 14:00~17:00"},{"grade":"고3","time":"토 10:00~13:00"}]',8,1],
    ['HIGH_SCHOOL','이든배움국어상동3관','소명여고·상동중','박서연 선생님',null,'/assets/teachers/박서연.jpg',null,'{"schools":[{"name":"소명여고","schedule":[{"grade":"고1","time":"일 18:00~21:00"}]},{"name":"상동중","schedule":[{"grade":"1학년","time":"토 16:00~18:30"},{"grade":"2학년","time":"토 12:30~15:30"},{"grade":"3학년","time":"일 14:00~17:00"}]}]}',9,1],
    // 중등부
    ['MIDDLE_SCHOOL','이든배움국어본관','상일중','김태경 선생님',null,'/assets/teachers/김태경.jpg',null,'[{"grade":"1학년","time":"토 14:00~16:30"},{"grade":"2학년","time":"토 10:00~13:00 / 일 17:00~20:00"},{"grade":"3학년","time":"토 17:00~20:00 / 일 14:00~17:00"}]',1,1],
    ['MIDDLE_SCHOOL','이든배움국어상동5관','석천중','심미숙 선생님',null,'/assets/teachers/심미숙.jpg',null,'[{"grade":"1학년","time":"토 14:00~16:30"},{"grade":"2학년","time":"일 17:00~20:00"},{"grade":"3학년","time":"토 10:00~13:00"}]',2,1],
    // 수능올인반
    ['SUNEUNG',null,null,'라영서 선생님',null,'/assets/teachers/라영서.jpg',null,'[{"grade":"","time":"일 14:00~17:00"}]',1,1],
    ['SUNEUNG',null,null,'박정영 선생님',null,'/assets/teachers/박정영.jpg',null,'[{"grade":"","time":"일 18:00~21:00"}]',2,1],
    ['SUNEUNG',null,null,'이우용 선생님',null,'/assets/teachers/이우용.jpg',null,'[{"grade":"","time":"일 19:00~22:00"}]',3,1],
    ['SUNEUNG',null,null,'이창완 선생님',null,'/assets/teachers/이창완.jpg',null,'[{"grade":"","time":"토 14:00~17:00"}]',4,1],
    // 초등부
    ['ELEMENTARY',null,null,'서미정 원장님',null,'/assets/teachers/서미정.png',null,null,1,1],
    ['ELEMENTARY',null,null,'강지하 선생님',null,'/assets/teachers/강지하.jpg',null,null,2,1],
    ['ELEMENTARY',null,null,'민지연 선생님',null,'/assets/teachers/민지연.jpg',null,null,3,1],
    // 운영진
    ['STAFF',null,null,'서효정','대표원장','/assets/teachers/서효정.jpg',null,null,1,1],
    ['STAFF',null,null,'정훈','부원장','/assets/teachers/정훈.jpg',null,null,2,1],
    ['STAFF',null,null,'김진옥','상담실장','/assets/teachers/김진옥.jpg',null,null,3,1],
    ['STAFF',null,null,'장소연','운영실장','/assets/teachers/장소연.jpg',null,null,4,1],
    ['STAFF',null,null,'권나연','운영실장','/assets/teachers/권나연.jpg',null,null,5,1],
  ];
  for (const row of seeds) {
    await pool.query(
      `INSERT INTO teacher_display (section,branch,school,name,role,photo_url,photo_file_id,schedule_data,sort_order,is_active) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      row
    );
  }
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const body = await req.json();
  const id = await insertTeacherDisplay({
    section: body.section,
    branch: body.branch || null,
    school: body.school || null,
    name: body.name,
    role: body.role || null,
    photo_url: body.photo_url || null,
    photo_file_id: body.photo_file_id || null,
    schedule_data: body.schedule_data || null,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ? 1 : 0,
  });
  return NextResponse.json({ success: true, id });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  await updateTeacherDisplay(body.id, {
    section: body.section,
    branch: body.branch || null,
    school: body.school || null,
    name: body.name,
    role: body.role || null,
    photo_url: body.photo_url || null,
    photo_file_id: body.photo_file_id || null,
    schedule_data: body.schedule_data || null,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ? 1 : 0,
  });
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  await deleteTeacherDisplay(id);
  return NextResponse.json({ success: true });
});
