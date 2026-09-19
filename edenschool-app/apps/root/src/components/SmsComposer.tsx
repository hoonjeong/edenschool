'use client';

import { useState, useEffect, useRef } from 'react';
import { compressImageForMms, formatBytes } from '@/lib/image-compress';
import { SENDER_PARTS, DEFAULT_SENDER_PART, findAcaPart, acaPartLabel } from '@/lib/aca-parts';
import { parseRecipientText, normalizeRecipientPhone, type ParsedRecipient } from '@/lib/sms-recipients';
// 발송 규칙(바이트 계산·종류 판정·MMS 제약)은 교육원 화면과 공유한다.
// 여기서 따로 정의하면 한쪽만 고쳐져 두 화면이 어긋난다.
import {
  MMS_MAX_IMAGES,
  SMS_MAX_BYTES as MMS_MAX_BYTES,
  SMS_SINGLE_MAX_BYTES,
  smsByteLength,
  detectSmsType,
  isSenderNotRegistered,
  SENDER_NOT_REGISTERED_HINT,
} from '@edenschool/common/sms-rules';

/* ── types ── */
interface ClassInfo {
  id: number;
  name: string;
  grade: string;
  year: number;
  day?: string;
  hour?: number;
  minute?: number;
  live_count?: number;
}

interface StudentPhone {
  className: string;
  studentName: string;
  sphone: string;
  pphone: string;
}

interface Template {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface SendLog {
  phone: string;
  message: string;
  type: string;
  result_message: string;
  send_time: string;
}

/** 발송 대상을 어디서 가져오는지 — 반 선택(기본) / 번호 붙여넣기 / 엑셀 업로드 */
export type RecipientSource = 'class' | 'manual' | 'excel';

interface Props {
  mode: 'admin' | 'teacher';
  recipients?: RecipientSource;
}

/** 서버가 한 요청에 받는 최대 건수(/api/admin/sms). 넘으면 나눠 보낸다. */
const SEND_CHUNK_SIZE = 100;

/** 엑셀 파싱 API 응답 */
interface ExcelParseResult {
  valid: ParsedRecipient[];
  invalid: ParsedRecipient[];
  duplicates: number;
  sheet: string;
  scanned: number;
}

/** 고른 발신번호를 이 브라우저에 기억해 두는 키 */
const SENDER_PART_STORAGE_KEY = 'edenschool.sms.senderPart';

/** 발송 이력 한 건이 실제로 발송 성공했는지 (알리고 result_code > 0) */
function isLogSuccess(log: SendLog): boolean {
  if (!log.result_message) return false;
  try {
    return Number(JSON.parse(log.result_message).result_code) > 0;
  } catch {
    return false;
  }
}

/** MMS 첨부 이미지 (압축 완료본) */
interface AttachedImage {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export default function SmsComposer({ mode, recipients = 'class' }: Props) {
  /* ─── Card 1: 반 선택 ─── */
  const [sendType, setSendType] = useState<'HIGH' | 'MIDDLE'>('HIGH');
  const [classList, setClassList] = useState<ClassInfo[]>([]);
  const [checkedClassIds, setCheckedClassIds] = useState<number[]>([]);
  const [fetchingClasses, setFetchingClasses] = useState(false);

  /* ─── Card 2: 인원 선택 ─── */
  const [studentList, setStudentList] = useState<StudentPhone[]>([]);
  const [checkedPhones, setCheckedPhones] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchingStudents, setFetchingStudents] = useState(false);

  /* ─── 번호로 발송: 붙여넣은 번호 텍스트 ─── */
  const [manualText, setManualText] = useState('');

  /* ─── 엑셀로 발송: 업로드·파싱 결과 ─── */
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelResult, setExcelResult] = useState<ExcelParseResult | null>(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  /* ─── Card 3: 내용 작성 ─── */
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  // 발송 이력에서 클릭한 문자(전체 내용 보기용)
  const [detailLog, setDetailLog] = useState<SendLog | null>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  // 문자 종류: 일반(SMS/LMS 자동) / 이미지(MMS)
  const [msgKind, setMsgKind] = useState<'TEXT' | 'IMAGE'>('TEXT');
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Card 4: 전송 ─── */
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  // 발신번호(관) — 운영진(admin)만 직접 고른다.
  // 초기값은 본관으로 두고 마운트 후 localStorage 값으로 덮어쓴다. 처음부터
  // localStorage 를 읽으면 서버 렌더 결과와 달라져 hydration 오류가 난다.
  const [senderPart, setSenderPart] = useState<number>(DEFAULT_SENDER_PART);
  // 선생님(teacher) 화면은 고르지 않고 본인 근무 관(aca_part)에서 자동으로 가져온다.
  const [teacherSender, setTeacherSender] = useState<{ part: number | null; phone: string; assigned: boolean } | null>(null);
  // 결과 배너 색상. 문자열에 '실패'가 들어있는지로 판정하면 "실패 0건"도 빨갛게 되어 따로 둔다.
  const [resultTone, setResultTone] = useState<'success' | 'danger'>('success');
  const [allHistory, setAllHistory] = useState<SendLog[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [numberHistory, setNumberHistory] = useState<SendLog[]>([]);

  const byteLength = smsByteLength(message);
  const smsType = detectSmsType(message, msgKind === 'IMAGE');
  const overByteLimit = byteLength > MMS_MAX_BYTES;
  const overSingleSms = msgKind === 'TEXT' && byteLength > SMS_SINGLE_MAX_BYTES;

  /* ─── 초기 데이터 로드 ─── */
  useEffect(() => {
    const url =
      mode === 'teacher'
        ? '/api/admin/sms/classes?teacherOnly=true'
        : '/api/admin/sms/classes';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (mode === 'teacher' && data.classes) {
          setClassList(data.classes);
        } else if (Array.isArray(data)) {
          setClassList(data);
        }
      })
      .catch(() => alert('반 목록을 불러오지 못했습니다.'));
  }, [mode]);

  useEffect(() => {
    fetch('/api/admin/sms/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }, []);

  // 발신번호 결정: 선생님은 서버에서 자동 조회, 운영진은 이 브라우저에 기억된 값 복원
  useEffect(() => {
    if (mode === 'teacher') {
      fetch('/api/admin/sms?sender=true')
        .then((r) => r.json())
        .then((data) => setTeacherSender(data.sender || null))
        .catch(() => setTeacherSender(null));
      return;
    }
    try {
      const saved = window.localStorage.getItem(SENDER_PART_STORAGE_KEY);
      if (saved && SENDER_PARTS.some((p) => String(p.part) === saved)) {
        setSenderPart(Number(saved));
      }
    } catch {
      // 프라이빗 모드 등으로 localStorage 를 못 읽으면 기본값(본관) 유지
    }
  }, [mode]);

  // 화면에 보여줄 발신번호 (모드 공용)
  const senderInfo: { label: string; phone: string } | null =
    mode === 'teacher'
      ? teacherSender
        ? { label: acaPartLabel(teacherSender.part), phone: teacherSender.phone }
        : null
      : (() => {
          const p = findAcaPart(senderPart);
          return p ? { label: p.label, phone: p.phone } : null;
        })();

  const handleSenderPartChange = (part: number) => {
    setSenderPart(part);
    try {
      window.localStorage.setItem(SENDER_PART_STORAGE_KEY, String(part));
    } catch {
      // 저장에 실패해도 이번 발송에는 선택한 번호가 쓰인다
    }
  };

  const fetchAllHistory = () => {
    fetch('/api/admin/sms?allHistory=true')
      .then((r) => r.json())
      .then((data) => setAllHistory(data.history || []))
      .catch(() => {});
  };

  // 특정 번호의 발송 이력 조회 (선택한 번호 기준)
  const fetchNumberHistory = (phone: string) => {
    if (!phone) return;
    setSelectedNumber(phone);
    fetch(`/api/admin/sms?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data) => setNumberHistory(data.history || []))
      .catch(() => setNumberHistory([]));
  };

  useEffect(() => {
    fetchAllHistory();
  }, []);


  /* ─── 발송 대상 확정 (대상 출처별) ─── */
  // 반 선택은 체크한 번호, 번호 붙여넣기는 텍스트 파싱 결과, 엑셀은 서버 파싱 결과.
  // 이 아래 발송·카운트·버튼 활성화는 전부 targetPhones 만 본다.
  const manualParsed = recipients === 'manual' ? parseRecipientText(manualText) : null;
  const targetPhones: string[] =
    recipients === 'manual'
      ? (manualParsed?.valid ?? []).map((v) => v.phone)
      : recipients === 'excel'
        ? (excelResult?.valid ?? []).map((v) => v.phone)
        : checkedPhones;

  /* ─── Card 1 helpers ─── */
  const highClasses = classList.filter((c) => c.grade === '고');
  const middleClasses = classList.filter((c) => c.grade === '중');

  const groupByYear = (classes: ClassInfo[]) => {
    const groups: Record<number, ClassInfo[]> = {};
    classes.forEach((c) => {
      if (!groups[c.year]) groups[c.year] = [];
      groups[c.year].push(c);
    });
    return groups;
  };

  const currentGroups = mode === 'admin'
    ? (sendType === 'HIGH' ? groupByYear(highClasses) : groupByYear(middleClasses))
    : null;

  const handleTypeChange = (type: 'HIGH' | 'MIDDLE') => {
    setSendType(type);
    setCheckedClassIds([]);
    setStudentList([]);
    setCheckedPhones([]);
  };

  const handleClassToggle = (id: number) => {
    setCheckedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleYearAllToggle = (classes: ClassInfo[], checked: boolean) => {
    const ids = classes.map((c) => c.id);
    if (checked) {
      setCheckedClassIds((prev) => [...new Set([...prev, ...ids])]);
    } else {
      setCheckedClassIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const isYearAllChecked = (classes: ClassInfo[]) =>
    classes.length > 0 && classes.every((c) => checkedClassIds.includes(c.id));

  const fetchStudents = async () => {
    if (checkedClassIds.length === 0) {
      alert('대상 반을 선택해주세요.');
      return;
    }
    setFetchingStudents(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/sms/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: checkedClassIds }),
      });
      const data: StudentPhone[] = await res.json();
      setStudentList(data);
      setCheckedPhones([]);
    } catch {
      alert('학생 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setFetchingStudents(false);
    }
  };

  /* ─── Card 2 helpers ─── */
  const filteredStudents = searchQuery
    ? studentList.filter((s) =>
        s.studentName.includes(searchQuery) || s.className.includes(searchQuery)
      )
    : studentList;

  const handlePhoneToggle = (phone: string) => {
    if (!phone) return;
    const isAdding = !checkedPhones.includes(phone);
    setCheckedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
    if (isAdding) fetchNumberHistory(phone); // 최근 선택한 번호의 이력 표시
  };

  const handleAllStudentToggle = (checked: boolean) => {
    const phones = studentList.map((s) => s.sphone).filter(Boolean);

    if (checked) {
      setCheckedPhones((prev) => [...new Set([...prev, ...phones])]);
      if (phones.length) fetchNumberHistory(phones[phones.length - 1]);
    } else {
      const parentPhones = studentList.map((s) => s.pphone).filter(Boolean);
      setCheckedPhones((prev) => prev.filter((p) => parentPhones.includes(p)));
    }
  };

  const handleAllParentToggle = (checked: boolean) => {
    const phones = studentList.map((s) => s.pphone).filter(Boolean);

    if (checked) {
      setCheckedPhones((prev) => [...new Set([...prev, ...phones])]);
      if (phones.length) fetchNumberHistory(phones[phones.length - 1]);
    } else {
      const studentPhones = studentList.map((s) => s.sphone).filter(Boolean);
      setCheckedPhones((prev) => prev.filter((p) => studentPhones.includes(p)));
    }
  };

  const allStudentsChecked =
    studentList.length > 0 &&
    studentList.every((s) => !s.sphone || checkedPhones.includes(s.sphone));
  const allParentsChecked =
    studentList.length > 0 &&
    studentList.every((s) => !s.pphone || checkedPhones.includes(s.pphone));

  const removePhone = (phone: string) => {
    setCheckedPhones((prev) => prev.filter((p) => p !== phone));
  };

  // Build a map: phone → studentName for chip display
  const phoneNameMap: Record<string, string> = {};
  studentList.forEach((s) => {
    if (s.sphone) phoneNameMap[s.sphone] = s.studentName;
    if (s.pphone) phoneNameMap[s.pphone] = s.studentName + '(학부모)';
  });
  excelResult?.valid.forEach((v) => {
    if (v.name) phoneNameMap[v.phone] = v.name;
  });

  /* ─── 엑셀 업로드 helpers ─── */
  const handleExcelSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (!file) return;
    setExcelLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const res = await fetch('/api/admin/sms/excel-parse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || '엑셀을 읽지 못했습니다.');
        return;
      }
      setExcelFileName(file.name);
      setExcelResult(data as ExcelParseResult);
      if ((data as ExcelParseResult).valid.length === 0) {
        alert('엑셀에서 발송 가능한 휴대폰 번호를 찾지 못했습니다. 샘플 양식을 확인해주세요.');
      }
    } catch {
      alert('엑셀 업로드 중 오류가 발생했습니다.');
    } finally {
      setExcelLoading(false);
    }
  };

  const clearExcel = () => {
    setExcelFileName(null);
    setExcelResult(null);
  };

  // 엑셀·붙여넣기 목록에서 번호 하나 제외 (엑셀은 결과에서, 붙여넣기는 텍스트에서 지운다)
  const removeTargetPhone = (phone: string) => {
    if (recipients === 'excel') {
      setExcelResult((prev) => (prev ? { ...prev, valid: prev.valid.filter((v) => v.phone !== phone) } : prev));
    } else if (recipients === 'manual') {
      // 구분자는 남기고, 그 번호로 정규화되는 토큰만 비운다 (같은 번호가 여러 번 있어도 전부)
      setManualText((prev) =>
        prev
          .split(/([,\n\r;\t]+)/)
          .map((tok) => (normalizeRecipientPhone(tok) === phone ? '' : tok))
          .join('')
      );
    } else {
      removePhone(phone);
    }
  };

  /* ─── Card 3 helpers ─── */
  const handleTemplateSelect = (tpl: Template) => {
    setMessage(tpl.content);
    setShowTemplateModal(false);
  };

  const handleSaveTemplate = async () => {
    const title = newTemplateTitle.trim();
    if (!title) { alert('템플릿 제목을 입력해주세요.'); return; }
    if (!message.trim()) { alert('메시지를 먼저 입력해주세요.'); return; }
    try {
      const res = await fetch('/api/admin/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: message }),
      });
      const data = await res.json();
      if (data.ok) {
        setTemplates((prev) => [{ id: data.id, title, content: message, created_at: '' }, ...prev]);
        setNewTemplateTitle('');
        alert('템플릿이 저장되었습니다.');
      }
    } catch {
      alert('템플릿 저장에 실패했습니다.');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;
    try {
      await fetch('/api/admin/sms/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  /* ─── 이미지 첨부 helpers ─── */
  const revokeAll = (list: AttachedImage[]) => list.forEach((img) => URL.revokeObjectURL(img.previewUrl));

  // 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => revokeAll(images);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKindChange = (kind: 'TEXT' | 'IMAGE') => {
    setMsgKind(kind);
    if (kind === 'TEXT') {
      revokeAll(images);
      setImages([]);
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const remain = MMS_MAX_IMAGES - images.length;
    if (remain <= 0) {
      alert(`이미지는 최대 ${MMS_MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }
    const targets = files.slice(0, remain);
    if (files.length > remain) alert(`이미지는 최대 ${MMS_MAX_IMAGES}장까지 첨부할 수 있어 ${remain}장만 추가합니다.`);

    setCompressing(true);
    const added: AttachedImage[] = [];
    try {
      for (const f of targets) {
        if (!f.type.startsWith('image/')) {
          alert(`${f.name}: 이미지 파일이 아닙니다.`);
          continue;
        }
        try {
          // 모바일용 최적화: 긴 변 1024px, JPEG, 250KB 이하로 압축
          const r = await compressImageForMms(f);
          added.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file: r.file,
            previewUrl: URL.createObjectURL(r.blob),
            originalSize: r.originalSize,
            compressedSize: r.compressedSize,
            width: r.width,
            height: r.height,
          });
        } catch (e) {
          alert(`${f.name}: ${e instanceof Error ? e.message : '이미지 처리에 실패했습니다.'}`);
        }
      }
      if (added.length) setImages((prev) => [...prev, ...added]);
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  /* ─── Card 4 helpers ─── */
  // /api/admin/sms 한 번 호출 (한 묶음). 서버 응답을 그대로 돌려준다.
  const postSend = async (numbers: string[]) => {
    let res: Response;
    if (smsType === 'MMS') {
      // 이미지 첨부는 multipart/form-data로 전송
      const form = new FormData();
      form.append('numbers', JSON.stringify(numbers));
      form.append('message', message);
      form.append('type', 'MMS');
      if (mode === 'admin') form.append('acaPart', String(senderPart));
      images.forEach((img) => form.append('images', img.file, img.file.name));
      res = await fetch('/api/admin/sms', { method: 'POST', body: form });
    } else {
      res = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numbers,
          message,
          type: smsType,
          // 선생님 화면은 보내지 않는다. 서버가 로그인 계정의 aca_part 로 결정한다.
          ...(mode === 'admin' ? { acaPart: senderPart } : {}),
        }),
      });
    }
    return res.json();
  };

  const handleSend = async () => {
    if (targetPhones.length === 0) {
      alert(
        recipients === 'manual'
          ? '발송할 번호를 입력해주세요.'
          : recipients === 'excel'
            ? '엑셀 파일을 첨부해 발송 대상을 불러와주세요.'
            : '발송 대상을 선택해주세요.'
      );
      return;
    }
    if (!message.trim()) {
      alert('메세지를 입력해주세요.');
      return;
    }
    if (overByteLimit) {
      alert(`메시지가 너무 깁니다. (최대 ${MMS_MAX_BYTES} byte)`);
      return;
    }
    if (smsType === 'MMS' && images.length === 0) {
      alert('이미지 문자는 이미지를 1장 이상 첨부해야 합니다.');
      return;
    }
    const kindLabel = smsType === 'MMS' ? `이미지 문자(MMS, 이미지 ${images.length}장)` : smsType;
    const sender = findAcaPart(senderPart);
    if (
      !confirm(
        `발신번호: ${sender ? `${sender.label} ${sender.phone}` : '기본'}\n총 ${targetPhones.length}건의 ${kindLabel}를 발송하시겠습니까?`
      )
    ) {
      return;
    }

    setLoading(true);
    setResult(null);
    setResultTone('success');
    try {
      // 서버는 한 요청에 100건까지만 받는다. 엑셀·붙여넣기는 그보다 클 수 있어
      // 100건씩 순서대로 보내고 결과를 합산한다. 중간에 서버 오류가 나면 거기서 멈추고
      // 그때까지의 결과와 함께 알린다(같은 번호로 다시 보내지 않도록).
      const chunks: string[][] = [];
      for (let i = 0; i < targetPhones.length; i += SEND_CHUNK_SIZE) {
        chunks.push(targetPhones.slice(i, i + SEND_CHUNK_SIZE));
      }
      let total = 0;
      let sent = 0;
      let failed = 0;
      let failReason: string | undefined;
      let callNum: string | undefined;
      let serverError: string | undefined;
      for (const chunk of chunks) {
        const data = await postSend(chunk);
        if (data.error) {
          serverError = String(data.error);
          break;
        }
        const chunkTotal: number = data.count ?? chunk.length;
        const chunkFailed: number = data.failed ?? 0;
        total += chunkTotal;
        failed += chunkFailed;
        sent += data.sent ?? chunkTotal - chunkFailed;
        if (!failReason && data.failReason) failReason = data.failReason;
        if (!callNum && data.callNum) callNum = data.callNum;
      }

      if (serverError) {
        setResultTone('danger');
        setResult(
          `발송 실패: ${serverError}` +
            (total > 0 ? `\n(오류 전까지 ${sent}건 발송됨 / 총 대상 ${targetPhones.length}건)` : '')
        );
        if (total > 0) fetchAllHistory();
      } else {
        const data = { failReason, callNum };

        if (failed > 0) {
          // 알리고가 거절한 건은 문자가 실제로 가지 않는다. 반드시 눈에 띄게 알린다.
          setResultTone('danger');
          setResult(
            `⚠ 발송 실패 ${failed}건 (성공 ${sent}건 / 총 ${total}건)` +
              (data.failReason ? ` — 사유: ${data.failReason}` : '') +
              (data.callNum ? ` / 발신번호: ${data.callNum}` : '') +
              (data.failReason && /발신번호|1521|-101/.test(String(data.failReason))
                ? '\n※ 알리고에 등록되지 않은 발신번호로 보입니다. 발신번호 등록 여부를 확인해주세요.'
                : '')
          );
        } else {
          setResultTone('success');
          setResult(`발송 완료: 총 ${sent}건${data.callNum ? ` (발신번호 ${data.callNum})` : ''}`);
        }
        fetchAllHistory();
        if (selectedNumber) fetchNumberHistory(selectedNumber);
      }
    } catch {
      setResultTone('danger');
      setResult('발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCheckedClassIds([]);
    setStudentList([]);
    setCheckedPhones([]);
    setManualText('');
    clearExcel();
    setMessage('');
    setResult(null);
    setResultTone('success');
    setSearchQuery('');
    setSelectedNumber(null);
    setNumberHistory([]);
    revokeAll(images);
    setImages([]);
    setMsgKind('TEXT');
  };

  // 발송 이력 테이블 렌더 (개별/전체 공용)
  const renderHistory = (list: SendLog[], emptyText: string) =>
    list.length > 0 ? (
      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
        <table className="table table-sm" style={{ marginBottom: 0, fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>상태</th>
              <th style={{ padding: '6px 10px' }}>수신번호</th>
              <th style={{ padding: '6px 10px' }}>내용</th>
              <th style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>발송시간</th>
            </tr>
          </thead>
          <tbody>
            {list.map((h, i) => {
              const ok = isLogSuccess(h);
              return (
              <tr
                key={i}
                onClick={() => setDetailLog(h)}
                style={{ cursor: 'pointer', background: ok ? undefined : '#fef2f2' }}
                title="클릭하면 전체 내용을 볼 수 있습니다"
              >
                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                  <span
                    className={`badge ${ok ? 'badge-success' : 'badge-danger'}`}
                    style={{ fontSize: '11px' }}
                  >
                    {ok ? '성공' : '실패'}
                  </span>
                </td>
                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>{h.phone}</td>
                <td style={{ padding: '4px 10px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.message}
                </td>
                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap', color: '#64748b' }}>{h.send_time}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '16px 0' }}>
        {emptyText}
      </div>
    );

  /* ─── Render ─── */
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* ═══ 반으로 발송(기본): Card 1 반 선택 + Card 2 인원 선택 ═══ */}
        {recipients === 'class' && (
          <>
          {/* ═══ Card 1: 반 선택 ═══ */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>1. 반 선택</span>
              {checkedClassIds.length > 0 && (
                <span className="badge badge-primary" style={{ fontSize: '12px' }}>
                  {checkedClassIds.length}개 선택
                </span>
              )}
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {mode === 'admin' && (
                <div style={{ marginBottom: '12px', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1, paddingBottom: '8px' }}>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      className={`btn ${sendType === 'HIGH' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleTypeChange('HIGH')}
                    >
                      고등부
                    </button>
                    <button
                      className={`btn ${sendType === 'MIDDLE' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleTypeChange('MIDDLE')}
                    >
                      중등부
                    </button>
                  </div>
                </div>
              )}

              {mode === 'admin' && currentGroups && (
                <div>
                  {Object.entries(currentGroups)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([year, classes]) => (
                      <div key={year} style={{ marginBottom: '10px' }}>
                        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
                          <label style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                            <input
                              type="checkbox"
                              checked={isYearAllChecked(classes)}
                              onChange={(e) => handleYearAllToggle(classes, e.target.checked)}
                              style={{ marginRight: '6px' }}
                            />
                            {year}학년 전체
                          </label>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', paddingLeft: '4px' }}>
                          {classes.map((cls) => (
                            <label key={cls.id} style={{ cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              <input
                                type="checkbox"
                                checked={checkedClassIds.includes(cls.id)}
                                onChange={() => handleClassToggle(cls.id)}
                                style={{ marginRight: '4px' }}
                              />
                              {cls.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {mode === 'teacher' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {classList.map((cls) => (
                    <label key={cls.id} style={{ cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={checkedClassIds.includes(cls.id)}
                        onChange={() => handleClassToggle(cls.id)}
                        style={{ marginRight: '6px' }}
                      />
                      {cls.name}
                    </label>
                  ))}
                  {classList.length === 0 && (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>담당 반이 없습니다.</span>
                  )}
                </div>
              )}

            </div>

            {/* 스크롤 밖 고정 영역 — 목록이 길어도 버튼이 항상 보이게 한다 */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={fetchStudents}
                disabled={fetchingStudents || checkedClassIds.length === 0}
              >
                {fetchingStudents ? '불러오는 중...' : '선택반 불러오기'}
              </button>
            </div>
          </div>

          {/* ═══ Card 2: 인원 선택 ═══ */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>2. 인원 선택</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                선택: <strong style={{ color: '#3b82f6' }}>{checkedPhones.length}명</strong>
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {studentList.length > 0 ? (
                <>
                  {/* Toggle buttons + search */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className={`btn btn-sm ${allStudentsChecked ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleAllStudentToggle(!allStudentsChecked)}
                    >
                      학생 전체 ({studentList.filter((s) => s.sphone).length})
                    </button>
                    <button
                      className={`btn btn-sm ${allParentsChecked ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleAllParentToggle(!allParentsChecked)}
                    >
                      학부모 전체 ({studentList.filter((s) => s.pphone).length})
                    </button>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="이름 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '140px', marginLeft: 'auto' }}
                    />
                  </div>

                  {/* Student table */}
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    <table className="table table-sm" style={{ marginBottom: 0, fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '6px 10px' }}>반 / 이름</th>
                          <th style={{ padding: '6px 10px', width: '80px', textAlign: 'center' }}>학생</th>
                          <th style={{ padding: '6px 10px', width: '80px', textAlign: 'center' }}>학부모</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '4px 10px' }}>{s.className} {s.studentName}</td>
                            <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                              {s.sphone ? (
                                <input
                                  type="checkbox"
                                  checked={checkedPhones.includes(s.sphone)}
                                  onChange={() => handlePhoneToggle(s.sphone)}
                                />
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                              {s.pphone ? (
                                <input
                                  type="checkbox"
                                  checked={checkedPhones.includes(s.pphone)}
                                  onChange={() => handlePhoneToggle(s.pphone)}
                                />
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Selected chips */}
                  {checkedPhones.length > 0 && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                      {checkedPhones.map((phone) => {
                        const active = phone === selectedNumber;
                        return (
                          <span
                            key={phone}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              backgroundColor: active ? '#2563eb' : '#eff6ff',
                              border: `1px solid ${active ? '#2563eb' : '#bfdbfe'}`,
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: active ? '#fff' : '#1e40af',
                            }}
                          >
                            <span
                              onClick={() => fetchNumberHistory(phone)}
                              style={{ cursor: 'pointer' }}
                              title="이 번호의 발송 이력 보기"
                            >
                              {phoneNameMap[phone] || phone}
                            </span>
                            <span
                              onClick={() => removePhone(phone)}
                              style={{ cursor: 'pointer', fontWeight: 'bold', marginLeft: '2px', color: active ? '#dbeafe' : '#6b7280' }}
                            >
                              ×
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  반을 선택하고 &quot;선택반 불러오기&quot;를 클릭해주세요.
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* ═══ 번호로 발송: Card 1 번호 입력 ═══ */}
        {recipients === 'manual' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>1. 번호 입력</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>쉼표(,) 또는 줄바꿈으로 구분</span>
            </div>
            <div className="card-body">
              <textarea
                className="form-control"
                rows={14}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="번호를 입력하거나 붙여넣으세요"
                disabled={loading}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                하이픈은 있어도 없어도 됩니다. 같은 번호는 한 번만 발송됩니다.
              </div>
            </div>
          </div>
        )}

        {/* ═══ 엑셀로 발송: Card 1 엑셀 업로드 ═══ */}
        {recipients === 'excel' && (
          <div className="card">
            <div className="card-header">1. 엑셀 업로드</div>
            <div className="card-body">
              <ol style={{ paddingLeft: '18px', fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: 1.8 }}>
                <li>샘플 양식을 내려받아 <strong>휴대폰번호</strong> 열에 번호를 입력합니다. (이름은 선택)</li>
                <li>저장한 파일을 첨부하면 발송 대상이 오른쪽에 표시됩니다.</li>
                <li>메시지를 작성하고 발송합니다.</li>
              </ol>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a className="btn btn-sm btn-outline-success" href="/api/admin/sms/excel-template">
                  <i className="fas fa-file-excel" style={{ marginRight: 4 }}></i>샘플 엑셀 다운로드
                </a>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  style={{ display: 'none' }}
                  onChange={(e) => handleExcelSelected(e.target.files)}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => excelInputRef.current?.click()}
                  disabled={excelLoading || loading}
                >
                  {excelLoading ? (
                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: 4 }}></i>읽는 중...</>
                  ) : (
                    <><i className="fas fa-paperclip" style={{ marginRight: 4 }}></i>엑셀 파일 첨부</>
                  )}
                </button>
              </div>

              {excelFileName && excelResult && (
                <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <i className="fas fa-file-excel" style={{ color: '#16a34a', marginRight: 4 }}></i>
                      {excelFileName}
                      <span style={{ color: '#94a3b8', marginLeft: 6 }}>({excelResult.sheet} 시트)</span>
                    </span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={clearExcel} disabled={loading}>
                      제거
                    </button>
                  </div>
                  <div style={{ marginTop: '6px', color: '#475569' }}>
                    읽은 행 {excelResult.scanned}개 → 발송 대상 <strong style={{ color: '#2563eb' }}>{excelResult.valid.length}건</strong>
                    {excelResult.duplicates > 0 && ` · 중복 제외 ${excelResult.duplicates}건`}
                    {excelResult.invalid.length > 0 && (
                      <span style={{ color: '#dc2626' }}> · 번호 형식 오류 {excelResult.invalid.length}건</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ 번호로/엑셀로 발송: Card 2 발송 대상 확인 ═══ */}
        {recipients !== 'class' && (() => {
          const parsed = recipients === 'manual' ? manualParsed : excelResult;
          const valid = parsed?.valid ?? [];
          const invalid = parsed?.invalid ?? [];
          const duplicates = parsed?.duplicates ?? 0;
          return (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>2. 발송 대상 확인</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  대상: <strong style={{ color: '#3b82f6' }}>{valid.length}건</strong>
                  {duplicates > 0 && <span style={{ marginLeft: 6, color: '#94a3b8' }}>중복 {duplicates}건 제외</span>}
                </span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {valid.length === 0 && invalid.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    {recipients === 'manual'
                      ? '왼쪽에 번호를 입력하면 여기에 발송 대상이 표시됩니다.'
                      : '엑셀 파일을 첨부하면 여기에 발송 대상이 표시됩니다.'}
                  </div>
                ) : (
                  <>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="table table-sm" style={{ marginBottom: 0, fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '6px 10px', width: '50px' }}>#</th>
                            {recipients === 'excel' && <th style={{ padding: '6px 10px' }}>이름</th>}
                            <th style={{ padding: '6px 10px' }}>수신번호</th>
                            <th style={{ padding: '6px 10px', width: '60px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {valid.map((v, idx) => {
                            const active = v.phone === selectedNumber;
                            return (
                              <tr key={v.phone} style={{ background: active ? '#eff6ff' : undefined }}>
                                <td style={{ padding: '4px 10px', color: '#94a3b8' }}>{v.row ?? idx + 1}</td>
                                {recipients === 'excel' && <td style={{ padding: '4px 10px' }}>{v.name || <span style={{ color: '#cbd5e1' }}>-</span>}</td>}
                                <td style={{ padding: '4px 10px' }}>
                                  <span
                                    onClick={() => fetchNumberHistory(v.phone)}
                                    style={{ cursor: 'pointer', color: active ? '#2563eb' : undefined }}
                                    title="이 번호의 발송 이력 보기"
                                  >
                                    {v.phone}
                                  </span>
                                </td>
                                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                                  <span
                                    onClick={() => removeTargetPhone(v.phone)}
                                    style={{ cursor: 'pointer', color: '#6b7280', fontWeight: 'bold' }}
                                    title="대상에서 제외"
                                  >
                                    ×
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {invalid.length > 0 && (
                      <div style={{ padding: '8px 12px', borderTop: '1px solid #fecaca', background: '#fef2f2', fontSize: '12px', color: '#b91c1c', maxHeight: '110px', overflowY: 'auto' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          <i className="fas fa-exclamation-triangle" style={{ marginRight: 4 }}></i>
                          번호 형식이 아니어서 제외된 항목 {invalid.length}건
                        </div>
                        {invalid.map((v, i) => (
                          <div key={i}>
                            {v.row ? `${v.row}행: ` : ''}
                            {v.name ? `${v.name} · ` : ''}
                            {v.source}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}



        {/* ═══ Card 3: 내용 작성 및 발송 ═══ */}
        <div className="card">
          <div className="card-header">3. 내용 작성 및 발송</div>
          <div className="card-body">
            {/* 문자 종류 선택 */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  className={`btn ${msgKind === 'TEXT' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleKindChange('TEXT')}
                  disabled={loading}
                >
                  <i className="fas fa-comment" style={{ marginRight: 4 }}></i>일반 문자
                </button>
                <button
                  className={`btn ${msgKind === 'IMAGE' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleKindChange('IMAGE')}
                  disabled={loading}
                >
                  <i className="fas fa-image" style={{ marginRight: 4 }}></i>이미지 문자 (MMS)
                </button>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {msgKind === 'TEXT' ? '90byte 이하 SMS, 초과 시 LMS로 자동 발송' : '이미지 첨부 시 MMS로 발송 (최대 3장)'}
              </span>
            </div>

            {/* 이미지 첨부 영역 (MMS) */}
            {msgKind === 'IMAGE' && (
              <div style={{ marginBottom: '10px', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing || loading || images.length >= MMS_MAX_IMAGES}
                  >
                    {compressing ? (
                      <><i className="fas fa-spinner fa-spin" style={{ marginRight: 4 }}></i>압축 중...</>
                    ) : (
                      <><i className="fas fa-paperclip" style={{ marginRight: 4 }}></i>이미지 첨부 ({images.length}/{MMS_MAX_IMAGES})</>
                    )}
                  </button>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    첨부 시 모바일용으로 자동 최적화됩니다 (긴 변 1024px · JPG · 250KB 이하)
                  </span>
                </div>

                {images.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {images.map((img) => (
                      <div
                        key={img.id}
                        style={{ width: '120px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', overflow: 'hidden', position: 'relative' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.previewUrl}
                          alt=""
                          style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          title="삭제"
                          style={{
                            position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                            border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '12px',
                            lineHeight: '20px', padding: 0, cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                        <div style={{ padding: '4px 6px', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                          <div>{img.width}×{img.height}</div>
                          <div>
                            <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{formatBytes(img.originalSize)}</span>
                            {' → '}
                            <strong style={{ color: '#16a34a' }}>{formatBytes(img.compressedSize)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Template area */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="form-control form-control-sm"
                style={{ width: 'auto', maxWidth: '200px' }}
                onChange={(e) => {
                  const tpl = templates.find((t) => t.id === Number(e.target.value));
                  if (tpl) setMessage(tpl.content);
                }}
                defaultValue=""
              >
                <option value="" disabled>템플릿 선택...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowTemplateModal(true)}
              >
                템플릿 관리
              </button>
            </div>

            {/* Save as template */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="템플릿 제목"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                style={{ width: '160px' }}
              />
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleSaveTemplate}
                disabled={!message.trim() || !newTemplateTitle.trim()}
              >
                현재 메시지 저장
              </button>
            </div>

            <textarea
              className="form-control"
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="메세지를 입력하세요..."
              style={{ resize: 'vertical' }}
            />

            {/* Type info */}
            <div style={{ marginTop: '8px', fontSize: '13px', color: overByteLimit || overSingleSms ? '#dc2626' : '#64748b' }}>
              {byteLength} byte{overByteLimit && ` (최대 ${MMS_MAX_BYTES})`} · {smsType}
              {smsType === 'MMS' && ` · 이미지 ${images.length}장`} · 대상 {targetPhones.length}명
            </div>

            {/* 발신번호 선택 — 고른 값은 이 브라우저에 기억된다 */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <label style={{ margin: 0, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                발신번호
              </label>
              {mode === 'teacher' ? (
                /* 선생님 화면: 본인 근무 관(aca_part)에서 자동 결정 — 고를 수 없다 */
                <>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>
                    {senderInfo ? `${senderInfo.label} ${senderInfo.phone}` : '불러오는 중...'}
                  </span>
                  {teacherSender && !teacherSender.assigned && (
                    <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                      본관 기본값
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {teacherSender && !teacherSender.assigned
                      ? '근무 관이 지정되지 않아 본관 번호로 지정되었습니다. (관리자에게 관 지정을 요청하세요)'
                      : '담당 관에 따라 자동 설정됩니다.'}
                  </span>
                </>
              ) : (
                /* 운영진 화면: 직접 선택 */
                <>
                  <select
                    className="form-control form-control-sm"
                    style={{ width: 'auto' }}
                    value={senderPart}
                    onChange={(e) => handleSenderPartChange(Number(e.target.value))}
                    disabled={loading}
                  >
                    {SENDER_PARTS.map((p) => (
                      <option key={p.part} value={p.part}>
                        {p.label} ({p.phone})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    선택한 번호는 이 브라우저에 기억됩니다.
                  </span>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                className="btn btn-danger"
                onClick={handleSend}
                disabled={loading || compressing || targetPhones.length === 0 || !message.trim() || overByteLimit || (smsType === 'MMS' && images.length === 0)}
                style={{ flex: 1 }}
              >
                {loading ? '발송 중...' : smsType === 'MMS' ? '이미지 문자 발송하기' : '발송하기'}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                리셋
              </button>
            </div>

            {/* Result */}
            {result && (
              <div
                className={`alert ${resultTone === 'danger' ? 'alert-danger' : 'alert-success'}`}
                style={{ marginTop: '12px', marginBottom: 0, fontSize: '13px', whiteSpace: 'pre-line' }}
              >
                {result}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Card 4: 발송 이력 (개별 / 전체 구분) ═══ */}
        <div className="card">
          <div className="card-header">
            4. 발송 이력
            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>
              문자를 클릭하면 전체 내용이 표시됩니다
            </span>
          </div>
          <div className="card-body">
            {/* 개별 발송 이력 (선택한 번호) */}
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              <i className="fas fa-user" style={{ marginRight: 4, color: '#2563eb' }}></i>
              개별 발송 이력
              {selectedNumber && (
                <span style={{ color: '#2563eb', marginLeft: 6, fontWeight: 500 }}>
                  · {phoneNameMap[selectedNumber] || selectedNumber} ({selectedNumber})
                </span>
              )}
            </div>
            {selectedNumber
              ? renderHistory(numberHistory, '이 번호로 발송된 이력이 없습니다.')
              : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '16px 0' }}>
                  수신번호를 선택(또는 아래 칩 클릭)하면 해당 번호의 발송 이력이 표시됩니다.
                </div>
              )}

            <hr style={{ margin: '14px 0' }} />

            {/* 전체 발송 이력 (발송자 구분 없이 최근 전체) */}
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              <i className="fas fa-list" style={{ marginRight: 4, color: '#64748b' }}></i>
              전체 발송 이력 <span style={{ color: '#94a3b8', fontWeight: 400 }}>(최근 발송분)</span>
            </div>
            {renderHistory(allHistory, '발송 이력이 없습니다.')}
          </div>
        </div>
      </div>

      {/* ═══ Template Management Modal ═══ */}
      {showTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90vw',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>템플릿 관리</span>
              <span onClick={() => setShowTemplateModal(false)} style={{ cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>저장된 템플릿이 없습니다.</div>
              ) : (
                templates.map((tpl) => (
                  <div key={tpl.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{tpl.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'pre-wrap', overflow: 'hidden', maxHeight: '40px' }}>
                        {tpl.content}
                      </div>
                      {tpl.created_at && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{tpl.created_at}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleTemplateSelect(tpl)}>
                        불러오기
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTemplate(tpl.id)}>
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 발송 문자 전체 내용 Modal ═══ */}
      {detailLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setDetailLog(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '520px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>발송 문자 내용</span>
              <span onClick={() => setDetailLog(null)} style={{ cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', rowGap: '6px', fontSize: '13px', marginBottom: '14px' }}>
                <div style={{ color: '#64748b' }}>수신번호</div>
                <div>{detailLog.phone}</div>
                <div style={{ color: '#64748b' }}>발송시간</div>
                <div>{detailLog.send_time}</div>
                {detailLog.type && (
                  <>
                    <div style={{ color: '#64748b' }}>구분</div>
                    <div>{detailLog.type}</div>
                  </>
                )}
                {detailLog.result_message && (
                  <>
                    <div style={{ color: '#64748b' }}>발송결과</div>
                    <div>{detailLog.result_message}</div>
                  </>
                )}
              </div>
              <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '6px' }}>
                내용 <span style={{ color: '#94a3b8' }}>({detailLog.message?.length ?? 0}자)</span>
              </div>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}
              >
                {detailLog.message}
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  setMessage(detailLog.message);
                  setDetailLog(null);
                }}
              >
                이 내용으로 다시 작성
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setDetailLog(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
