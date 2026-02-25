import './class-info.css';
import { selectTeacherDisplayListActive, type TeacherDisplay } from '@edenschool/common/queries/site-config';
import { type ScheduleItem, type SchoolSchedule, parseScheduleData, getPhotoSrc } from '@/lib/teacher-display-utils';

export const metadata = {
  title: '수업안내 | 이든배움국어학원',
  description: '이든배움국어학원 학교별 수업 시간표 및 선생님 소개',
};

export const dynamic = 'force-dynamic';

interface Teacher {
  branch?: string;
  school: string;
  name: string;
  photo: string;
  schedule: ScheduleItem[];
  schools?: SchoolSchedule[];
}

interface SuneungTeacher {
  name: string;
  photo: string;
  time: string;
}

interface ElementaryTeacher {
  name: string;
  photo: string;
}

interface StaffMember {
  name: string;
  role: string;
  photo: string;
}

/* ===== DB → 정적 타입 변환 ===== */
function toTeacher(item: TeacherDisplay): Teacher {
  const { schedule, schools } = parseScheduleData(item.schedule_data);
  return {
    branch: item.branch || undefined,
    school: item.school || '',
    name: item.name,
    photo: getPhotoSrc(item),
    schedule,
    schools: schools.length > 0 ? schools : undefined,
  };
}

function toSuneungTeacher(item: TeacherDisplay): SuneungTeacher {
  const { schedule } = parseScheduleData(item.schedule_data);
  return {
    name: item.name,
    photo: getPhotoSrc(item),
    time: schedule[0]?.time || '',
  };
}

function toElementaryTeacher(item: TeacherDisplay): ElementaryTeacher {
  return { name: item.name, photo: getPhotoSrc(item) };
}

function toStaffMember(item: TeacherDisplay): StaffMember {
  return { name: item.name, role: item.role || '', photo: getPhotoSrc(item) };
}

/* ===== 정적 폴백 데이터 ===== */
const FALLBACK_HIGH: Teacher[] = [
  { branch: '이든배움국어상동2관', school: '상원고', name: '김보름 선생님', photo: '/assets/teachers/김보름.jpg', schedule: [{ grade: '고1', time: '토 19:00~22:00 / 일 19:00~22:00' }, { grade: '고2', time: '토 10:00~13:00 / 토 16:00~19:00' }, { grade: '고3', time: '일 10:00~13:00 / 일 15:00~18:00' }] },
  { branch: '이든배움국어상동3관', school: '상동고', name: '이창완 선생님', photo: '/assets/teachers/이창완.jpg', schedule: [{ grade: '고1', time: '토 18:00~21:00' }, { grade: '고2', time: '일 19:00~22:00' }, { grade: '고3', time: '일 10:00~13:00' }] },
  { branch: '이든배움국어본관', school: '송내고', name: '이우용 선생님', photo: '/assets/teachers/이우용.jpg', schedule: [{ grade: '고1', time: '일 16:00~19:00' }, { grade: '고2', time: '토 16:00~19:00' }, { grade: '고3', time: '토 19:00~22:00' }] },
  { branch: '이든배움국어본관', school: '부명고', name: '박옥선 선생님', photo: '/assets/teachers/박옥선.jpg', schedule: [{ grade: '고1', time: '토 10:00~13:00' }, { grade: '고2', time: '토 18:30~21:30 / 일 14:30~17:30' }, { grade: '고3', time: '토 13:00~16:00 / 일 19:00~22:00' }] },
  { branch: '이든배움국어본관', school: '정명고', name: '박정영 선생님', photo: '/assets/teachers/박정영.jpg', schedule: [{ grade: '고1', time: '토 10:00~13:00' }, { grade: '고2', time: '토 15:00~18:00 / 일 10:00~13:00' }, { grade: '고3', time: '금 19:00~22:00 / 토 19:00~22:00' }] },
  { branch: '이든배움국어상동3관', school: '상일고', name: '권지영 선생님', photo: '/assets/teachers/권지영.jpg', schedule: [{ grade: '고1', time: '토 16:00~19:00' }, { grade: '고2', time: '토 19:00~22:00' }, { grade: '고3', time: '토 12:00~15:00 / 토 16:00~19:00' }] },
  { branch: '이든배움국어상동5관', school: '중원·중흥고', name: '김소솜 선생님', photo: '/assets/teachers/김소솜.jpg', schedule: [], schools: [{ name: '중원고', schedule: [{ grade: '고1', time: '토 10:00~13:00' }, { grade: '고2', time: '토 16:00~19:00' }, { grade: '고3', time: '일 19:00~22:00' }] }, { name: '중흥고', schedule: [{ grade: '고1', time: '일 14:00~17:00' }, { grade: '고2', time: '일 10:00~13:00' }, { grade: '고3', time: '일 19:00~22:00' }] }] },
  { branch: '이든배움국어본관', school: '계남고', name: '백슬기 선생님', photo: '/assets/teachers/백슬기.jpg', schedule: [{ grade: '고1', time: '토 14:00~17:00' }, { grade: '고3', time: '토 10:00~13:00' }] },
  { branch: '이든배움국어상동3관', school: '소명여고·상동중', name: '박서연 선생님', photo: '/assets/teachers/박서연.jpg', schedule: [], schools: [{ name: '소명여고', schedule: [{ grade: '고1', time: '일 18:00~21:00' }] }, { name: '상동중', schedule: [{ grade: '1학년', time: '토 16:00~18:30' }, { grade: '2학년', time: '토 12:30~15:30' }, { grade: '3학년', time: '일 14:00~17:00' }] }] },
];
const FALLBACK_MIDDLE: Teacher[] = [
  { branch: '이든배움국어본관', school: '상일중', name: '김태경 선생님', photo: '/assets/teachers/김태경.jpg', schedule: [{ grade: '1학년', time: '토 14:00~16:30' }, { grade: '2학년', time: '토 10:00~13:00 / 일 17:00~20:00' }, { grade: '3학년', time: '토 17:00~20:00 / 일 14:00~17:00' }] },
  { branch: '이든배움국어상동5관', school: '석천중', name: '심미숙 선생님', photo: '/assets/teachers/심미숙.jpg', schedule: [{ grade: '1학년', time: '토 14:00~16:30' }, { grade: '2학년', time: '일 17:00~20:00' }, { grade: '3학년', time: '토 10:00~13:00' }] },
];
const FALLBACK_SUNEUNG: SuneungTeacher[] = [
  { name: '라영서 선생님', photo: '/assets/teachers/라영서.jpg', time: '일 14:00~17:00' },
  { name: '박정영 선생님', photo: '/assets/teachers/박정영.jpg', time: '일 18:00~21:00' },
  { name: '이우용 선생님', photo: '/assets/teachers/이우용.jpg', time: '일 19:00~22:00' },
  { name: '이창완 선생님', photo: '/assets/teachers/이창완.jpg', time: '토 14:00~17:00' },
];
const FALLBACK_ELEMENTARY: ElementaryTeacher[] = [
  { name: '서미정 원장님', photo: '/assets/teachers/서미정.png' },
  { name: '강지하 선생님', photo: '/assets/teachers/강지하.jpg' },
  { name: '민지연 선생님', photo: '/assets/teachers/민지연.jpg' },
];
const FALLBACK_STAFF: StaffMember[] = [
  { name: '서효정', role: '대표원장', photo: '/assets/teachers/서효정.jpg' },
  { name: '정훈', role: '부원장', photo: '/assets/teachers/정훈.jpg' },
  { name: '김진옥', role: '상담실장', photo: '/assets/teachers/김진옥.jpg' },
  { name: '장소연', role: '운영실장', photo: '/assets/teachers/장소연.jpg' },
  { name: '권나연', role: '운영실장', photo: '/assets/teachers/권나연.jpg' },
];

/* ===== 컴포넌트 ===== */
function ScheduleList({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="ci-schedule">
      {items.map((s, i) => (
        <div className="ci-schedule-row" key={`${s.grade}-${i}`}>
          <span className="ci-schedule-grade">{s.grade}</span>
          <span className="ci-schedule-time">{s.time}</span>
        </div>
      ))}
    </div>
  );
}

function TeacherCard({ teacher, index }: { teacher: Teacher; index: number }) {
  const isReverse = index % 2 === 1;
  const hasMultiSchool = teacher.schools && teacher.schools.length > 0;

  return (
    <div className={`ci-card${isReverse ? ' ci-card-reverse' : ''}`}>
      <div className="ci-card-photo">
        <img src={teacher.photo} alt={teacher.name} />
      </div>
      <div className="ci-card-body">
        {teacher.branch && (
          <span className="ci-card-branch">{teacher.branch}</span>
        )}
        <h3 className="ci-card-title">
          {teacher.school} 전임 {teacher.name}
        </h3>
        {hasMultiSchool ? (
          <div className="ci-schedule-split">
            {teacher.schools!.map((s) => (
              <div className="ci-schedule-col" key={s.name}>
                <div className="ci-schedule-col-title">{s.name}</div>
                <ScheduleList items={s.schedule} />
              </div>
            ))}
          </div>
        ) : teacher.schedule.length > 0 ? (
          <ScheduleList items={teacher.schedule} />
        ) : null}
      </div>
    </div>
  );
}

/* ===== 데이터 로드 ===== */
async function loadData() {
  try {
    const dbItems = await selectTeacherDisplayListActive();
    if (dbItems.length === 0) return null;

    const highSchool = dbItems.filter(t => t.section === 'HIGH_SCHOOL').map(toTeacher);
    const middleSchool = dbItems.filter(t => t.section === 'MIDDLE_SCHOOL').map(toTeacher);
    const suneung = dbItems.filter(t => t.section === 'SUNEUNG').map(toSuneungTeacher);
    const elementary = dbItems.filter(t => t.section === 'ELEMENTARY').map(toElementaryTeacher);
    const staff = dbItems.filter(t => t.section === 'STAFF').map(toStaffMember);

    return { highSchool, middleSchool, suneung, elementary, staff };
  } catch {
    return null;
  }
}

export default async function ClassInfoPage() {
  const data = await loadData();

  const highSchool = data?.highSchool ?? FALLBACK_HIGH;
  const middleSchool = data?.middleSchool ?? FALLBACK_MIDDLE;
  const suneung = data?.suneung ?? FALLBACK_SUNEUNG;
  const elementary = data?.elementary ?? FALLBACK_ELEMENTARY;
  const staff = data?.staff ?? FALLBACK_STAFF;

  return (
    <div className="ci-page">
      {/* 고등부 */}
      <section className="ci-section">
        <div className="ci-section-inner">
          <h2 className="ci-section-title">고등부</h2>
          {highSchool.map((teacher, i) => (
            <TeacherCard key={teacher.name} teacher={teacher} index={i} />
          ))}
        </div>
      </section>

      {/* 중등부 */}
      <section className="ci-section ci-section-gray">
        <div className="ci-section-inner">
          <h2 className="ci-section-title">중등부</h2>
          {middleSchool.map((teacher, i) => (
            <TeacherCard key={teacher.name} teacher={teacher} index={i} />
          ))}
        </div>
      </section>

      {/* 수능올인반 */}
      <section className="ci-section">
        <div className="ci-section-inner">
          <h2 className="ci-section-title">수능올인반</h2>
          <div className="ci-grid">
            {suneung.map((t) => (
              <div className="ci-grid-card" key={t.name}>
                <img className="ci-grid-card-photo" src={t.photo} alt={t.name} />
                <div className="ci-grid-card-info">
                  <p className="ci-grid-card-name">{t.name}</p>
                  <p className="ci-grid-card-time">{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 초등부 */}
      <section className="ci-section ci-section-gray">
        <div className="ci-section-inner">
          <h2 className="ci-section-title">초등부</h2>
          <div className="ci-grid ci-grid-3">
            {elementary.map((t) => (
              <div className="ci-grid-card" key={t.name}>
                <img className="ci-grid-card-photo" src={t.photo} alt={t.name} />
                <div className="ci-grid-card-info">
                  <p className="ci-grid-card-name">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 운영진 */}
      <section className="ci-section ci-section-light">
        <div className="ci-section-inner">
          <h2 className="ci-section-title">운영진</h2>
          <div className="ci-grid ci-grid-5">
            {staff.map((s) => (
              <div className="ci-grid-card" key={s.name}>
                <img className="ci-grid-card-photo" src={s.photo} alt={s.name} />
                <div className="ci-grid-card-info">
                  <p className="ci-grid-card-name">{s.name}</p>
                  <p className="ci-grid-card-role">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
