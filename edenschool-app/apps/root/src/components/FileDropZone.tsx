'use client';

import { useRef, useState, useEffect } from 'react';

interface Props {
  file: File | null;
  onSelect: (f: File) => void;
  onRemove: () => void;
  accept?: string;
}

/** 드래그앤드롭 파일 첨부 영역 (기출/모의고사 추가 폼 공용) */
export default function FileDropZone({ file, onSelect, onRemove, accept = '.hwp,.hwpx,.pdf' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 파일이 비워지면(제거/등록완료) 네이티브 input 값도 초기화
  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = '';
  }, [file]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) onSelect(f); }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragging ? '#007bff' : '#ced4da'}`,
        borderRadius: 8, padding: file ? 20 : '40px 20px', textAlign: 'center',
        cursor: 'pointer', backgroundColor: isDragging ? '#e7f1ff' : file ? '#f8f9fa' : '#fff', marginBottom: 20,
      }}
    >
      <input ref={inputRef} type="file" style={{ display: 'none' }} accept={accept}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }} />
      {file ? (
        <div>
          <div className="font-weight-bold" style={{ fontSize: 16 }}>{file.name}</div>
          <div className="text-muted small mb-2">{(file.size / 1024).toFixed(1)} KB</div>
          <button type="button" className="btn btn-sm btn-outline-danger"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            파일 제거
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 32, color: isDragging ? '#007bff' : '#adb5bd', marginBottom: 8, lineHeight: 1 }}>+</div>
          <div className="text-muted">파일을 드래그하여 놓거나 클릭하여 선택하세요</div>
          <div className="text-muted small mt-1">HWP, PDF 파일 지원</div>
        </div>
      )}
    </div>
  );
}
