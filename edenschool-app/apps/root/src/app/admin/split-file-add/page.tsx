'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * 파일명에서 메타 정보 자동 파싱
 *
 * 핵심: `[` 앞 텍스트 → searchKeyword
 *       `[...]` 안 → publisher + subject
 *       `]` 뒤 → schoolName, year, term, testType
 */
function parseFileName(fileName: string) {
  const result: {
    searchKeyword?: string;
    publisher?: string;
    subject?: string;
    schoolName?: string;
    year?: string;
    term?: string;
    testType?: string;
  } = {};

  const baseName = fileName.replace(/\.\w+$/, '');

  // `[` 앞 텍스트 → searchKeyword
  const bracketIdx = baseName.indexOf('[');
  if (bracketIdx > 0) {
    result.searchKeyword = baseName.substring(0, bracketIdx).trim();
  }

  // `[...]` 안 → publisher + subject
  const bracketMatch = baseName.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    const bracketContent = bracketMatch[1].trim();
    const spaceIdx = bracketContent.indexOf(' ');
    if (spaceIdx > 0) {
      result.publisher = bracketContent.substring(0, spaceIdx).trim();
      result.subject = bracketContent.substring(spaceIdx + 1).trim();
    } else {
      result.publisher = bracketContent;
    }
  }

  // `]` 뒤 → school_name, year, term, test_type
  const afterBracketIdx = baseName.indexOf(']');
  const afterBracket = afterBracketIdx >= 0 ? baseName.substring(afterBracketIdx + 1).trim() : baseName;

  const mainMatch = afterBracket.match(
    /^(.+?)(\d{2,4})\s*년\s*(\d)\s*학기\s*(중간|기말)/
  );
  if (mainMatch) {
    let parsedSchool = mainMatch[1].trim();
    const gradeInName = parsedSchool.match(/^(.*[가-힣])(\d)$/);
    if (gradeInName) parsedSchool = gradeInName[1].trim();
    if (parsedSchool) result.schoolName = parsedSchool;

    let y = parseInt(mainMatch[2]);
    if (y < 100) y += 2000;
    result.year = String(y);
    result.term = mainMatch[3];
    result.testType = mainMatch[4] === '중간' ? '1' : '2';
  }

  return result;
}

function SplitFileAddContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const metaId = searchParams.get('metaId');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [existingFile, setExistingFile] = useState<{ id: number; fileName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [form, setForm] = useState({
    searchKeyword: '',
    grade: '고1',
    subject: '',
    publisher: '',
    schoolName: '',
    year: String(new Date().getFullYear()),
    term: '1',
    testType: '1',
  });

  // 수정 모드: 기존 데이터 불러오기
  useEffect(() => {
    if (!metaId) return;
    setFetching(true);
    fetch(`/api/admin/split-file?metaId=${metaId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.meta) {
          setForm({
            searchKeyword: data.meta.searchKeyword || '',
            grade: data.meta.grade || '고1',
            subject: data.meta.subject || '',
            publisher: data.meta.publisher || '',
            schoolName: data.meta.schoolName || '',
            year: String(data.meta.year || new Date().getFullYear()),
            term: String(data.meta.term || '1'),
            testType: String(data.meta.testType || '1'),
          });
        }
        if (data.file) setExistingFile(data.file);
      })
      .catch(() => alert('데이터 조회 중 오류가 발생했습니다.'))
      .finally(() => setFetching(false));
  }, [metaId]);

  // 파일 선택 시 파일명 자동 파싱
  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    const parsed = parseFileName(selectedFile.name);
    setForm((prev) => ({
      ...prev,
      ...(parsed.searchKeyword !== undefined && { searchKeyword: parsed.searchKeyword }),
      ...(parsed.publisher !== undefined && { publisher: parsed.publisher }),
      ...(parsed.subject !== undefined && { subject: parsed.subject }),
      ...(parsed.schoolName !== undefined && { schoolName: parsed.schoolName }),
      ...(parsed.year !== undefined && { year: parsed.year }),
      ...(parsed.term !== undefined && { term: parsed.term }),
      ...(parsed.testType !== undefined && { testType: parsed.testType }),
    }));
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 저장
  const handleSubmit = async () => {
    if (!file && !metaId) {
      alert('파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('search_keyword', form.searchKeyword);
      formData.append('grade', form.grade);
      formData.append('subject', form.subject);
      formData.append('publisher', form.publisher);
      formData.append('school_name', form.schoolName);
      formData.append('year', form.year);
      formData.append('term', form.term);
      formData.append('test_type', form.testType);

      let fileType = 'HWP';
      if (file) {
        if (file.name.toLowerCase().endsWith('.pdf')) fileType = 'PDF';
        formData.append('formFile', file);
      }
      formData.append('fileType', fileType);

      const res = await fetch('/api/admin/split-file', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        alert(`저장 실패: ${data.error}`);
      } else {
        alert('저장되었습니다.');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (!metaId) {
          setForm({
            searchKeyword: '',
            grade: '고1',
            subject: '',
            publisher: '',
            schoolName: '',
            year: String(new Date().getFullYear()),
            term: '1',
            testType: '1',
          });
        } else {
          router.refresh();
        }
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2010 + 1 },
    (_, i) => currentYear - i
  );

  if (fetching) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-3">
        {metaId ? '쪼개기 파일 관리' : '쪼개기 파일 추가'}
      </h4>

      {/* 파일 첨부 (드래그 앤 드롭) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#007bff' : '#ced4da'}`,
          borderRadius: '8px',
          padding: file ? '20px' : '40px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? '#e7f1ff' : file ? '#f8f9fa' : '#fff',
          transition: 'border-color 0.2s, background-color 0.2s',
          marginBottom: '20px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          accept=".hwp,.hwpx,.hwt,.pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
        />

        {file ? (
          <div>
            <div className="font-weight-bold" style={{ fontSize: '16px' }}>
              {file.name}
            </div>
            <div className="text-muted small mb-2">
              {(file.size / 1024).toFixed(1)} KB
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleFileRemove();
              }}
            >
              파일 제거
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: '32px',
                color: isDragging ? '#007bff' : '#adb5bd',
                marginBottom: '8px',
                lineHeight: 1,
              }}
            >
              +
            </div>
            <div className="text-muted">
              파일을 드래그하여 놓거나 클릭하여 선택하세요
            </div>
            <div className="text-muted small mt-1">HWP, PDF 파일 지원</div>
          </div>
        )}
      </div>

      {/* 기존 파일 (수정 모드) */}
      {existingFile && (
        <div className="alert alert-info">
          기존 파일: <a href={`/api/admin/split-file/download?id=${metaId}`} target="_blank" rel="noopener noreferrer">{existingFile.fileName}</a>
        </div>
      )}

      {/* 정보 입력 */}
      <div className="card mb-3">
        <div className="card-body">
          {/* 검색키워드 */}
          <div className="form-group">
            <label className="font-weight-bold">검색키워드 (작품명/문법영역/독서주제)</label>
            <input
              type="text"
              className="form-control"
              name="searchKeyword"
              value={form.searchKeyword}
              onChange={handleInputChange}
              placeholder="작품명, 문법영역, 독서주제 등"
            />
            <small className="text-muted">파일명에서 자동 추출됩니다. 필요시 수정하세요.</small>
          </div>

          {/* 학년 / 과목 */}
          <div className="row">
            <div className="col-md-6 form-group">
              <label className="font-weight-bold">학년</label>
              <select
                className="form-control"
                name="grade"
                value={form.grade}
                onChange={handleInputChange}
              >
                <option value="고1">고1</option>
                <option value="고2">고2</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div className="col-md-6 form-group">
              <label className="font-weight-bold">과목</label>
              <input
                type="text"
                className="form-control"
                name="subject"
                value={form.subject}
                onChange={handleInputChange}
                placeholder="과목"
                list="subject-list"
              />
              <datalist id="subject-list">
                <option value="국어" />
                <option value="문학" />
                <option value="독서" />
                <option value="언매" />
                <option value="화작" />
                <option value="문법" />
                <option value="심화국어" />
              </datalist>
            </div>
          </div>

          {/* 출판사 / 학교명 */}
          <div className="row">
            <div className="col-md-6 form-group">
              <label className="font-weight-bold">출판사</label>
              <input
                type="text"
                className="form-control"
                name="publisher"
                value={form.publisher}
                onChange={handleInputChange}
                placeholder="출판사"
                list="publisher-list"
              />
              <datalist id="publisher-list">
                <option value="미래엔" />
                <option value="비상" />
                <option value="금성" />
                <option value="동아" />
                <option value="신사고" />
                <option value="지학사" />
                <option value="창비" />
                <option value="천재" />
                <option value="천재박" />
                <option value="해냄" />
                <option value="수특" />
              </datalist>
            </div>
            <div className="col-md-6 form-group">
              <label className="font-weight-bold">학교명</label>
              <input
                type="text"
                className="form-control"
                name="schoolName"
                value={form.schoolName}
                onChange={handleInputChange}
                placeholder="학교명"
              />
            </div>
          </div>

          {/* 년도 / 학기 / 시험유형 */}
          <div className="row">
            <div className="col-md-4 form-group">
              <label className="font-weight-bold">년도</label>
              <select
                className="form-control"
                name="year"
                value={form.year}
                onChange={handleInputChange}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 form-group">
              <label className="font-weight-bold">학기</label>
              <div>
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${form.term === '1' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setForm((prev) => ({ ...prev, term: '1' }))}
                  >
                    1학기
                  </button>
                  <button
                    type="button"
                    className={`btn ${form.term === '2' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setForm((prev) => ({ ...prev, term: '2' }))}
                  >
                    2학기
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-4 form-group">
              <label className="font-weight-bold">시험유형</label>
              <div>
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${form.testType === '1' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setForm((prev) => ({ ...prev, testType: '1' }))}
                  >
                    중간고사
                  </button>
                  <button
                    type="button"
                    className={`btn ${form.testType === '2' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setForm((prev) => ({ ...prev, testType: '2' }))}
                  >
                    기말고사
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="mt-3">
        <button
          type="button"
          className="btn btn-primary btn-lg mr-2"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '저장 중...' : metaId ? '수정' : '추가'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={() => router.push('/admin/split-file-search')}
        >
          목록으로
        </button>
      </div>
    </div>
  );
}

export default function SplitFileAddPage() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <SplitFileAddContent />
    </Suspense>
  );
}
