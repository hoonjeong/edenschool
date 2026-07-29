import type { RowDataPacket } from 'mysql2/promise';
import { query, one, insert } from './db';
import type { SourceKind } from './prompt';

/* ── 템플릿 ────────────────────────────────────── */

export interface TemplateRow extends RowDataPacket {
  id: number;
  name: string;
  title: string;
  html: string;
  css: string;
  skeleton: string;
  guide: string | null;
  has_paper: number;
  byte_size: number;
  admin_name: string;
  created_at: Date;
}

// 목록용(본문 컬럼 제외). RowDataPacket의 브랜드가 Omit으로 사라지므로 따로 선언한다.
export interface TemplateListRow extends RowDataPacket {
  id: number;
  name: string;
  title: string;
  has_paper: number;
  byte_size: number;
  admin_name: string;
  created_at: Date;
}

/** 목록 (html 등 본문은 제외 — 목록 응답이 비대해지지 않도록) */
export function listTemplates() {
  return query<TemplateListRow>(
    `SELECT id, name, title, has_paper, byte_size, admin_name, created_at
       FROM lesson_material_template ORDER BY created_at DESC`
  );
}

export function getTemplate(id: number) {
  return one<TemplateRow>('SELECT * FROM lesson_material_template WHERE id = ?', [id]);
}

export function getTemplateHtml(id: number) {
  return one<RowDataPacket & { html: string }>(
    'SELECT html FROM lesson_material_template WHERE id = ?',
    [id]
  );
}

export function createTemplate(t: {
  name: string;
  title: string;
  html: string;
  css: string;
  skeleton: string;
  guide: string | null;
  hasPaper: boolean;
  byteSize: number;
  adminId: number;
  adminName: string;
}) {
  return insert(
    `INSERT INTO lesson_material_template
       (name, title, html, css, skeleton, guide, has_paper, byte_size, admin_id, admin_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.name, t.title, t.html, t.css, t.skeleton, t.guide, t.hasPaper ? 1 : 0, t.byteSize, t.adminId, t.adminName]
  );
}

export function deleteTemplate(id: number) {
  return query('DELETE FROM lesson_material_template WHERE id = ?', [id]);
}

/* ── 생성 이력 ──────────────────────────────────── */

export function createGeneration(g: {
  templateId: number;
  extraPrompt: string | null;
  adminId: number;
  adminName: string;
}) {
  return insert(
    `INSERT INTO lesson_material_generation
       (template_id, status, extra_prompt, admin_id, admin_name)
     VALUES (?, 'running', ?, ?, ?)`,
    [g.templateId, g.extraPrompt, g.adminId, g.adminName]
  );
}

export function addGenerationSource(s: {
  generationId: number;
  filename: string;
  storedName: string;
  mime: string;
  kind: SourceKind;
  byteSize: number;
}) {
  return insert(
    `INSERT INTO lesson_material_source
       (generation_id, filename, stored_name, mime, kind, byte_size)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [s.generationId, s.filename, s.storedName, s.mime, s.kind, s.byteSize]
  );
}

export function finishGeneration(g: {
  id: number;
  title: string;
  bodyHtml: string;
  fullHtml: string;
  stopReason: string | null;
  inputTokens: number;
  outputTokens: number;
}) {
  return query(
    `UPDATE lesson_material_generation
        SET status='done', title=?, body_html=?, full_html=?, stop_reason=?,
            input_tokens=?, output_tokens=?, finished_at=NOW()
      WHERE id = ?`,
    [g.title, g.bodyHtml, g.fullHtml, g.stopReason, g.inputTokens, g.outputTokens, g.id]
  );
}

export function failGeneration(id: number, message: string) {
  return query(
    `UPDATE lesson_material_generation SET status='error', error=?, finished_at=NOW() WHERE id=?`,
    [message.slice(0, 2000), id]
  );
}

export interface HistoryRow extends RowDataPacket {
  id: number;
  title: string;
  status: 'done' | 'error';
  stop_reason: string | null;
  output_tokens: number;
  admin_name: string;
  created_at: Date;
  template_name: string | null;
  source_count: number;
}

export function listHistory() {
  return query<HistoryRow>(
    `SELECT g.id, g.title, g.status, g.stop_reason, g.output_tokens, g.admin_name, g.created_at,
            t.name AS template_name,
            (SELECT COUNT(*) FROM lesson_material_source s WHERE s.generation_id = g.id) AS source_count
       FROM lesson_material_generation g
       LEFT JOIN lesson_material_template t ON t.id = g.template_id
      WHERE g.status <> 'running'
      ORDER BY g.id DESC
      LIMIT 50`
  );
}

export function getGenerationHtml(id: number) {
  return one<RowDataPacket & { title: string; full_html: string | null }>(
    'SELECT title, full_html FROM lesson_material_generation WHERE id = ?',
    [id]
  );
}

export function listGenerationSourceFiles(generationId: number) {
  return query<RowDataPacket & { stored_name: string }>(
    'SELECT stored_name FROM lesson_material_source WHERE generation_id = ?',
    [generationId]
  );
}

export function deleteGeneration(id: number) {
  return query('DELETE FROM lesson_material_generation WHERE id = ?', [id]);
}
