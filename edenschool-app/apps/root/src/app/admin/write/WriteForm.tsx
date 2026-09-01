'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL, formatFileSize } from '@/lib/upload-limits';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface PostData {
  id?: number;
  code: string;
  category: string;
  subject: string;
  contents: string;
  keyword: string;
  description: string;
}

interface UploadedFile {
  id: number;
  name: string;
  isExisting?: boolean;
}

/** 업로드 결과. 실패하면 이유를 그대로 담아 화면에 보여줄 수 있게 한다. */
type UploadResult =
  | { ok: true; id: number; name: string }
  | { ok: false; error: string };

/**
 * 파일 하나를 서버에 올린다.
 * 실패 사유(용량 초과·형식 불일치·네트워크 오류 등)를 뭉뚱그리지 않고 그대로 돌려준다.
 */
async function uploadFileToServer(file: File): Promise<UploadResult> {
  // 서버까지 보내기 전에 걸러낸다. 큰 파일은 한참 올린 뒤에야 실패해 이유를 알기 어렵다.
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: `${file.name}: 파일 크기가 ${formatFileSize(file.size)}입니다. ${MAX_FILE_SIZE_LABEL} 이하만 올릴 수 있습니다.`,
    };
  }

  const fd = new FormData();
  fd.append('file', file);

  let res: Response;
  try {
    res = await fetch('/api/admin/file/upload', { method: 'POST', body: fd });
  } catch {
    return { ok: false, error: `${file.name}: 서버에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.` };
  }

  // 웹서버(프록시)가 용량 초과로 요청을 끊으면 JSON 이 아닌 응답(413 등)이 온다.
  let data: { fileId?: number; fileName?: string; error?: string };
  try {
    data = await res.json();
  } catch {
    const reason =
      res.status === 413
        ? `파일이 너무 커서 서버가 업로드를 거부했습니다. (${MAX_FILE_SIZE_LABEL} 이하)`
        : `서버 응답을 읽지 못했습니다. (HTTP ${res.status})`;
    return { ok: false, error: `${file.name}: ${reason}` };
  }

  if (!res.ok || !data.fileId) {
    return { ok: false, error: `${file.name}: ${data.error || `업로드에 실패했습니다. (HTTP ${res.status})`}` };
  }
  return { ok: true, id: data.fileId, name: data.fileName || file.name };
}

function WriteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('id');

  const [form, setForm] = useState<PostData>({
    code: 'P',
    category: 'N',
    subject: '',
    contents: '',
    keyword: '',
    description: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!editId) return;
    setFetching(true);
    fetch(`/api/admin/post?id=${editId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.post) {
          setForm({
            id: data.post.id,
            code: data.post.code || 'P',
            category: data.post.category || 'N',
            subject: data.post.subject || '',
            contents: data.post.contents || '',
            // API(selectPostById)는 meta_keyword/meta_description 을
            // metaKeyword/metaDescription 으로 별칭 지어 돌려준다.
            keyword: data.post.metaKeyword || '',
            description: data.post.metaDescription || '',
          });
          if (data.files) {
            setUploadedFiles(
              data.files.map((f: { id: number; filename: string }) => ({
                id: f.id,
                name: f.filename,
                isExisting: true,
              }))
            );
          }
        }
      })
      .catch(() => alert('게시물 조회 중 오류가 발생했습니다.'))
      .finally(() => setFetching(false));
  }, [editId]);

  // Quill modules with custom image handler
  // Using regular function so `this` is bound to the toolbar module by Quill
  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote'],
          ['link', 'image', 'video'],
          ['clean'],
        ],
        handlers: {
          image: function (this: any) {
            const quill = this.quill;
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;

              const result = await uploadFileToServer(file);
              if (result.ok) {
                const range = quill.getSelection(true);
                // 레거시 형식(image-view.html?id=)으로 삽입 → 예전 홈페이지와 호환되고,
                // 새 앱에선 rewrite로 공개 legacy-image 라우트가 서빙(학생/비로그인도 표시).
                quill.insertEmbed(range.index, 'image', `image-view.html?id=${result.id}`);
                quill.setSelection(range.index + 1);
              } else {
                alert(`이미지 업로드에 실패했습니다.\n\n${result.error}`);
              }
            };
          },
        },
      },
    }),
    []
  );

  // Handle multiple file uploads
  const handleFileUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploading(true);
    const results: UploadedFile[] = [];
    const errors: string[] = [];
    for (const file of files) {
      const result = await uploadFileToServer(file);
      if (result.ok) {
        results.push({ id: result.id, name: result.name });
      } else {
        errors.push(result.error);
      }
    }
    if (results.length > 0) {
      setUploadedFiles((prev) => [...prev, ...results]);
    }
    // 어떤 파일이 왜 실패했는지 파일별로 보여준다.
    if (errors.length > 0) {
      alert(`${errors.length}개 파일 업로드에 실패했습니다.\n\n${errors.join('\n')}`);
    }
    setUploading(false);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('첨부파일을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/file/delete?id=${fileId}`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        alert(`삭제 실패: ${data.error}`);
      } else {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch {
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      alert('제목을 입력하세요.');
      return;
    }
    if (!form.contents.trim() || form.contents === '<p><br></p>') {
      alert('내용을 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (editId) formData.append('id', editId);
      formData.append('code', form.code);
      formData.append('category', form.category);
      formData.append('subject', form.subject);
      formData.append('contents', form.contents);
      formData.append('keyword', form.keyword);
      formData.append('description', form.description);

      // Add newly uploaded file IDs (not existing ones)
      for (const file of uploadedFiles) {
        if (!file.isExisting) {
          formData.append('file_id[]', String(file.id));
        }
      }

      const res = await fetch('/api/admin/post', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        alert(`저장 실패: ${data.error}`);
      } else {
        alert(editId ? '수정되었습니다.' : '등록되었습니다.');
        router.push('/admin/post-info');
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4>{editId ? '게시물 수정' : '게시물 작성'}</h4>
      <hr />

      <form onSubmit={handleSubmit}>
        {/* Category */}
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">카테고리</label>
          <div className="col-sm-10">
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="category" value="N"
                checked={form.category === 'N'} onChange={handleChange} />
              <label className="form-check-label">공지사항</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="category" value="S"
                checked={form.category === 'S'} onChange={handleChange} />
              <label className="form-check-label">이든이야기</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="category" value="C"
                checked={form.category === 'C'} onChange={handleChange} />
              <label className="form-check-label">입시정보</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="category" value="D"
                checked={form.category === 'D'} onChange={handleChange} />
              <label className="form-check-label">입시자료</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="category" value="R"
                checked={form.category === 'R'} onChange={handleChange} />
              <label className="form-check-label">수강후기</label>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">제목</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="제목을 입력하세요"
            />
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">내용</label>
          <div className="col-sm-10">
            <div style={{ background: '#fff', minHeight: 400 }}>
              <ReactQuill
                theme="snow"
                value={form.contents}
                onChange={(value: string) => setForm((prev) => ({ ...prev, contents: value }))}
                modules={quillModules}
                placeholder="내용을 입력하세요"
                style={{ height: 350 }}
              />
            </div>
          </div>
        </div>

        {/* Keyword */}
        <div className="form-group row" style={{ marginTop: 50 }}>
          <label className="col-sm-2 col-form-label">키워드</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="keyword"
              value={form.keyword}
              onChange={handleChange}
              placeholder="SEO 키워드 (쉼표로 구분)"
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">설명</label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="SEO 설명 (메타 디스크립션)"
            />
          </div>
        </div>

        {/* File Attachment - Drag & Drop */}
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">파일 첨부</label>
          <div className="col-sm-10">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.onchange = () => {
                  if (input.files) handleFileUpload(input.files);
                };
                input.click();
              }}
              style={{
                border: `2px dashed ${dragOver ? '#007bff' : '#ced4da'}`,
                borderRadius: 8,
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? '#e8f0fe' : '#f8f9fa',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? (
                <div>
                  <div className="spinner-border spinner-border-sm text-primary mr-2" role="status" />
                  업로드 중...
                </div>
              ) : (
                <div style={{ color: '#6c757d' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>+</div>
                  <div>파일을 드래그하여 놓거나 클릭하여 선택하세요</div>
                  <small>여러 파일을 한번에 업로드할 수 있습니다 (파일당 {MAX_FILE_SIZE_LABEL} 이하)</small>
                </div>
              )}
            </div>

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
              <ul className="list-group mt-2">
                {uploadedFiles.map((f) => (
                  <li
                    key={f.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ padding: '8px 12px', fontSize: 14 }}
                  >
                    <span>
                      {f.name}
                      {f.isExisting && <span className="badge badge-secondary ml-2">기존</span>}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteFile(f.id)}
                      style={{ padding: '2px 8px', fontSize: 12 }}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <hr />
        <div className="text-right mb-5">
          <button
            type="button"
            className="btn btn-secondary mr-2"
            onClick={() => router.push('/admin/post-info')}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '저장 중...' : editId ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function WriteForm() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <WriteContent />
    </Suspense>
  );
}
