'use client';

import { useState, useEffect, FormEvent, ChangeEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Teacher {
  name: string;
}

interface ClassInfo {
  id: number;
  name: string;
  teacherOne: string;
  teacherTwo: string;
  grade: string;
  year: number;
}

interface UploadedFile {
  fileId: number;
  filename: string;
  isExisting?: boolean;
}

function LectureModifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lectureId = searchParams.get('id');

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [teacher, setTeacher] = useState('');
  const [url, setUrl] = useState('');
  const [lectureDate, setLectureDate] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [teacherList, setTeacherList] = useState<Teacher[]>([]);
  const [classList, setClassList] = useState<ClassInfo[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>('고');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lectureId) return;

    // Fetch teachers
    const fetchTeachers = fetch('/api/admin/lecture/teachers')
      .then((res) => res.json())
      .then((data) => setTeacherList(data));

    // Fetch classes
    const fetchClasses = fetch('/api/admin/lecture/classes')
      .then((res) => res.json())
      .then((data) => setClassList(data));

    // Fetch lecture data
    const fetchLecture = fetch(`/api/admin/lecture/detail?id=${lectureId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.lecture) {
          setSubject(data.lecture.subject || '');
          setDescription(data.lecture.description || '');
          setTeacher(data.lecture.teacher || '');
          setUrl(data.lecture.url || '');
          setLectureDate(data.lecture.lecture_date || '');
          if (data.lecture.class_name) {
            setSelectedClasses([data.lecture.class_name]);
          }
        }
        if (data.files) {
          setFiles(
            data.files.map((f: { id: number; filename: string }) => ({
              fileId: f.id,
              filename: f.filename,
              isExisting: true,
            }))
          );
        }
      });

    Promise.all([fetchTeachers, fetchClasses, fetchLecture])
      .catch(() => alert('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [lectureId]);

  const filteredClasses = classList.filter((cls) => {
    const matchesGrade = cls.grade === gradeFilter;
    const matchesTeacher =
      !teacher || cls.teacherOne === teacher || cls.teacherTwo === teacher;
    return matchesGrade && matchesTeacher;
  });

  const handleTeacherChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTeacher(e.target.value);
    setSelectedClasses([]);
  };

  const handleClassToggle = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className]
    );
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    for (let i = 0; i < fileList.length; i++) {
      const formData = new FormData();
      formData.append('file', fileList[i]);

      try {
        const res = await fetch('/api/admin/file/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.fileId) {
          setFiles((prev) => [
            ...prev,
            { fileId: data.fileId, filename: fileList[i].name },
          ]);
        }
      } catch {
        alert(`파일 업로드 실패: ${fileList[i].name}`);
      }
    }

    e.target.value = '';
  };

  const handleRemoveFile = async (fileId: number, isExisting?: boolean) => {
    if (isExisting) {
      try {
        await fetch(
          `/api/admin/file/status?fid=${fileId}&lid=${lectureId}`,
          { method: 'DELETE' }
        );
      } catch {
        alert('파일 삭제에 실패했습니다.');
        return;
      }
    }
    setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!teacher) {
      alert('선생님을 선택해주세요.');
      return;
    }
    if (selectedClasses.length === 0) {
      alert('반을 하나 이상 선택해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/lecture/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Number(lectureId),
          subject,
          description,
          teacher,
          url,
          date: lectureDate,
          classes: selectedClasses,
          fileIds: files.filter((f) => !f.isExisting).map((f) => f.fileId),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('강의가 수정되었습니다.');
        router.push('/admin/lecture-info');
      } else {
        alert(data.error || '수정에 실패했습니다.');
      }
    } catch {
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!lectureId) {
    return (
      <div>
        <div className="alert alert-danger">강의 ID가 필요합니다.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-3">강의 수정</h4>
      <form onSubmit={handleSubmit}>
        {/* 제목 */}
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">제목</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
        </div>

        {/* 설명 */}
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">설명</label>
          <div className="col-sm-10">
            <textarea
              className="form-control"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* 선생님 */}
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">선생님</label>
          <div className="col-sm-10">
            <select
              className="form-control"
              value={teacher}
              onChange={handleTeacherChange}
            >
              <option value="">선생님 선택</option>
              {teacherList.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 영상 URL */}
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">영상 URL</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://player.vimeo.com/video/..."
            />
          </div>
        </div>

        {/* 강의 날짜 */}
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">강의날짜</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              value={lectureDate}
              onChange={(e) => setLectureDate(e.target.value)}
              placeholder="강의날짜"
            />
          </div>
        </div>

        {/* 파일 첨부 */}
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">파일 첨부</label>
          <div className="col-sm-10">
            <input
              type="file"
              className="form-control-file"
              multiple
              onChange={handleFileUpload}
            />
            {files.length > 0 && (
              <ul className="list-group mt-2">
                {files.map((f) => (
                  <li
                    key={f.fileId}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <span>
                      {f.filename}
                      {f.isExisting && (
                        <span className="badge badge-secondary ml-2">기존</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        handleRemoveFile(f.fileId, f.isExisting)
                      }
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 학년 선택 */}
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학년</label>
          <div className="col-sm-10">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${gradeFilter === '고' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => {
                  setGradeFilter('고');
                  setSelectedClasses([]);
                }}
              >
                고등부
              </button>
              <button
                type="button"
                className={`btn ${gradeFilter === '중' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => {
                  setGradeFilter('중');
                  setSelectedClasses([]);
                }}
              >
                중등부
              </button>
            </div>
          </div>
        </div>

        {/* 반 선택 */}
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">반 선택</label>
          <div className="col-sm-10">
            {filteredClasses.length === 0 ? (
              <p className="text-muted">
                {teacher
                  ? '해당 선생님의 반이 없습니다.'
                  : '선생님을 먼저 선택해주세요.'}
              </p>
            ) : (
              filteredClasses.map((cls) => (
                <div key={cls.id} className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`class-${cls.id}`}
                    checked={selectedClasses.includes(cls.name)}
                    onChange={() => handleClassToggle(cls.name)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`class-${cls.id}`}
                  >
                    {cls.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 제출 */}
        <div className="form-group row mb-2">
          <div className="col-sm-10 offset-sm-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? '수정 중...' : '강의 수정'}
            </button>
            <button
              type="button"
              className="btn btn-secondary ml-2"
              onClick={() => router.push('/admin/lecture-info')}
            >
              취소
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function LectureModifyPage() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <LectureModifyContent />
    </Suspense>
  );
}
