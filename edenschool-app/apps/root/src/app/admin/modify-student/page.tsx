import { requireAdminSession } from '@/lib/admin-session';
import { selectStudentById } from '@edenschool/common/queries/student';

export default async function ModifyStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireAdminSession();

  const params = await searchParams;
  const studentId = params.id;

  if (!studentId) {
    return (
      <div>
        <div className="alert alert-warning">학생 ID가 필요합니다.</div>
      </div>
    );
  }

  const student = await selectStudentById(Number(studentId));

  if (!student) {
    return (
      <div>
        <div className="alert alert-danger">학생 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-3">학생 정보 수정</h4>
      {/* autoComplete="off": 비밀번호 칸이 있어 브라우저가 [특이사항]을 아이디 칸으로 오인해 저장값을 채우는 것을 막는다 */}
      <form action="/api/admin/student/modify" method="POST" autoComplete="off">
        <input type="hidden" name="id" value={student.id} />

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">이름</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="name"
              defaultValue={student.name}
              required
            />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학교</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="school"
              defaultValue={student.school}
            />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학급</label>
          <div className="col-sm-10">
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="grade"
                id="gradeMiddle"
                value="중"
                defaultChecked={student.grade === '중'}
              />
              <label className="form-check-label" htmlFor="gradeMiddle">중</label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="grade"
                id="gradeHigh"
                value="고"
                defaultChecked={student.grade === '고'}
              />
              <label className="form-check-label" htmlFor="gradeHigh">고</label>
            </div>
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학년</label>
          <div className="col-sm-10">
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="year"
                id="year1"
                value="1"
                defaultChecked={student.year === 1}
              />
              <label className="form-check-label" htmlFor="year1">1</label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="year"
                id="year2"
                value="2"
                defaultChecked={student.year === 2}
              />
              <label className="form-check-label" htmlFor="year2">2</label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="year"
                id="year3"
                value="3"
                defaultChecked={student.year === 3}
              />
              <label className="form-check-label" htmlFor="year3">3</label>
            </div>
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학생 연락처</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="sphone"
              defaultValue={student.sphone}
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학부모 연락처</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="pphone"
              defaultValue={student.pphone}
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">주소</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="address"
              defaultValue={student.address}
            />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">특이사항</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="specialty"
              autoComplete="off"
              defaultValue={student.specialty}
            />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">비밀번호</label>
          <div className="col-sm-10">
            <input
              type="password"
              className="form-control"
              name="pw"
              autoComplete="new-password"
              placeholder="변경 시에만 입력"
            />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">메모</label>
          <div className="col-sm-10">
            <textarea
              className="form-control"
              name="memo"
              rows={3}
              defaultValue={student.memo}
            />
          </div>
        </div>

        <div className="form-group row mb-2">
          <div className="col-sm-10 offset-sm-2">
            <button type="submit" className="btn btn-primary">수정</button>
          </div>
        </div>
      </form>
    </div>
  );
}
