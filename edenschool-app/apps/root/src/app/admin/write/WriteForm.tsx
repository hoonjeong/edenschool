'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

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

// Upload a single file to server
async function uploadFileToServer(file: File): Promise<{ id: number; name: string } | null> {
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/admin/file/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.fileId) {
      return { id: data.fileId, name: data.fileName };
    }
  } catch {
    // ignore individual failure
  }
  return null;
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
            contents: data.post.contents || data.post.content || '',
            keyword: data.post.keyword || data.post.meta_keyword || '',
            description: data.post.description || data.post.meta_description || '',
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
              if (result) {
                const range = quill.getSelection(true);
                // 레거시 형식(image-view.html?id=)으로 삽입 → 예전 홈페이지와 호환되고,
                // 새 앱에선 rewrite로 공개 legacy-image 라우트가 서빙(학생/비로그인도 표시).
                quill.insertEmbed(range.index, 'image', `image-view.html?id=${result.id}`);
                quill.setSelection(range.index + 1);
              } else {
                alert('이미지 업로드에 실패했습니다.');
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
    for (const file of files) {
      const result = await uploadFileToServer(file);
      if (result) {
        results.push({ id: result.id, name: result.name });
      }
    }
    if (results.length > 0) {
      setUploadedFiles((prev) => [...prev, ...results]);
    }
    if (results.length < files.length) {
      alert(`${files.length - results.length}개 파일 업로드에 실패했습니다.`);
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
                  <small>여러 파일을 한번에 업로드할 수 있습니다</small>
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
