'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface Block {
  id: string;
  type: 'image' | 'text';
  fileId?: number;
  content?: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

function ImageBlock({
  block,
  index,
  total,
  onMove,
  onRemove,
  onChangeImage,
}: {
  block: Block;
  index: number;
  total: number;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (index: number) => void;
  onChangeImage: (index: number) => void;
}) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#64748b' }}>이미지</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => onMove(index, -1)} disabled={index === 0} title="위로">↑</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => onMove(index, 1)} disabled={index === total - 1} title="아래로">↓</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(index)} title="삭제">✕</button>
        </div>
      </div>
      {block.fileId ? (
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img
            src={`/api/file/image/${block.fileId}`}
            alt=""
            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, background: '#f8fafc', borderRadius: 4, color: '#94a3b8', marginBottom: 8 }}>
          이미지를 선택해주세요
        </div>
      )}
      <button className="btn btn-sm btn-outline-primary" onClick={() => onChangeImage(index)}>
        {block.fileId ? '이미지 변경' : '이미지 선택'}
      </button>
    </div>
  );
}

function TextBlock({
  block,
  index,
  total,
  onMove,
  onRemove,
  onContentChange,
}: {
  block: Block;
  index: number;
  total: number;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (index: number) => void;
  onContentChange: (index: number, content: string) => void;
}) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#64748b' }}>텍스트</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => onMove(index, -1)} disabled={index === 0} title="위로">↑</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => onMove(index, 1)} disabled={index === total - 1} title="아래로">↓</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(index)} title="삭제">✕</button>
        </div>
      </div>
      <ReactQuill
        theme="snow"
        value={block.content || ''}
        onChange={(val: string) => onContentChange(index, val)}
        modules={quillModules}
      />
    </div>
  );
}

export default function SiteDesignPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetIndex = useRef<number>(-1);

  useEffect(() => {
    fetch('/api/admin/site/page?key=main')
      .then((r) => r.json())
      .then((data) => {
        if (data.page?.gjsdata) {
          try {
            const parsed = JSON.parse(data.page.gjsdata);
            if (Array.isArray(parsed)) {
              setBlocks(parsed);
            }
          } catch {
            // invalid JSON
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await fetch('/api/admin/site/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_key: 'main', blocks: JSON.stringify(blocks) }),
      });
      setMsg('저장되었습니다.');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('저장에 실패했습니다.');
    }
    setSaving(false);
  };

  const addBlock = (type: 'image' | 'text') => {
    const newBlock: Block = { id: genId(), type };
    if (type === 'text') newBlock.content = '';
    setBlocks((prev) => [...prev, newBlock]);
  };

  const removeBlock = (index: number) => {
    if (!confirm('이 블록을 삭제하시겠습니까?')) return;
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleContentChange = useCallback((index: number, content: string) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, content } : b)));
  }, []);

  const handleChangeImage = (index: number) => {
    uploadTargetIndex.current = index;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/file/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.fileId) {
        const idx = uploadTargetIndex.current;
        setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, fileId: data.fileId } : b)));
      }
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    }
    // reset input
    e.target.value = '';
  };

  if (loading) return <div className="admin-content"><p>로딩 중...</p></div>;

  return (
    <div className="admin-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>메인 디자인 관리</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <span style={{ color: '#22c55e', fontWeight: 500, fontSize: 14 }}>{msg}</span>}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {blocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
          아래 버튼을 눌러 블록을 추가하세요
        </div>
      )}

      {blocks.map((block, index) =>
        block.type === 'image' ? (
          <ImageBlock
            key={block.id}
            block={block}
            index={index}
            total={blocks.length}
            onMove={moveBlock}
            onRemove={removeBlock}
            onChangeImage={handleChangeImage}
          />
        ) : (
          <TextBlock
            key={block.id}
            block={block}
            index={index}
            total={blocks.length}
            onMove={moveBlock}
            onRemove={removeBlock}
            onContentChange={handleContentChange}
          />
        )
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-outline-primary" onClick={() => addBlock('image')}>+ 이미지 추가</button>
        <button className="btn btn-outline-primary" onClick={() => addBlock('text')}>+ 텍스트 추가</button>
      </div>
    </div>
  );
}
