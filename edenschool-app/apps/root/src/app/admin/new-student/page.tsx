import { requireAdminSession } from '@/lib/admin-session';

export default async function NewStudentPage() {
  const session = await requireAdminSession();

  return (
    <div>
      <h4 className="mb-3">신규 학생 등록</h4>
      <form action="/api/admin/student" method="POST">
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">이름</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="name" required />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학교</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="school" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학급</label>
          <div className="col-sm-10">
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="grade" id="gradeMiddle" value="중" />
              <label className="form-check-label" htmlFor="gradeMiddle">중</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="grade" id="gradeHigh" value="고" defaultChecked />
              <label className="form-check-label" htmlFor="gradeHigh">고</label>
            </div>
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학년</label>
          <div className="col-sm-10">
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="year" id="year1" value="1" defaultChecked />
              <label className="form-check-label" htmlFor="year1">1</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="year" id="year2" value="2" />
              <label className="form-check-label" htmlFor="year2">2</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="year" id="year3" value="3" />
              <label className="form-check-label" htmlFor="year3">3</label>
            </div>
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학생 연락처</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="sphone" placeholder="010-0000-0000" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학부모 연락처</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="pphone" placeholder="010-0000-0000" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">주소</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="address" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">특이사항</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="specialty" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">메모</label>
          <div className="col-sm-10">
            <textarea className="form-control" name="memo" rows={3} />
          </div>
        </div>

        <div className="form-group row mb-2">
          <div className="col-sm-10 offset-sm-2">
            <button type="submit" className="btn btn-primary">회원가입</button>
          </div>
        </div>
      </form>
    </div>
  );
}
