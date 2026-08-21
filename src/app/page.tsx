'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { COLORS, TYPES, LEVELS, COUNTS, DIFFS, Settings, ResultEntry, TypeId } from '@/lib/constants';
import { generateWorksheet } from '@/lib/generate';
import { buildPrintableHtml, buildPlainText } from '@/lib/printHtml';

/* ── 작은 UI 조각들 ── */
const StepBadge = ({ n }: { n: string | number }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: '50%',
    border: `1.5px solid ${COLORS.ink}`, color: COLORS.ink,
    fontSize: 13, fontWeight: 700,
    fontFamily: "'Noto Serif KR', serif", flexShrink: 0,
  }}>{n}</span>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'block' }}>
    <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.sub, marginBottom: 6, letterSpacing: '0.02em' }}>
      {label}
    </span>
    {children}
  </label>
);

const sel: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${COLORS.line}`, background: '#fff',
  fontSize: 14, color: COLORS.ink, outline: 'none',
};

const kindLabel: Record<string, string> = {
  choice: '선택형', fill: '빈칸', short: '단답형',
  essay: '서술형', rubric: '루브릭', misconception: '오개념',
};

/* ── 메인 컴포넌트 ── */
export default function Home() {
  const [apiKey, setApiKey]     = useState('');
  const [keyReady, setKeyReady] = useState(false); // localStorage 읽기 완료 여부 (SSR 깜빡임 방지)
  const [file, setFile]         = useState<File | null>(null);
  const [pdfB64, setPdfB64]     = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<TypeId[]>(['formative', 'concept']);
  const [settings, setSettings] = useState<Settings>({ level: '고등학교', count: '5문항', diff: '기본 위주', note: '' });
  const [useWeb, setUseWeb]     = useState(true);
  const [busy, setBusy]         = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults]   = useState<ResultEntry[]>([]);
  const [error, setError]       = useState('');
  const [showAnswers, setShowAnswers] = useState(true);
  const [copied, setCopied]     = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── API 키: 브라우저(localStorage)에만 저장, 서버로는 절대 안 감 ── */
  useEffect(() => {
    const saved = window.localStorage.getItem('gemini_api_key');
    if (saved) setApiKey(saved);
    setKeyReady(true);
  }, []);

  const updateApiKey = (v: string) => {
    setApiKey(v);
    if (v) window.localStorage.setItem('gemini_api_key', v);
    else window.localStorage.removeItem('gemini_api_key');
  };

  /* ── 파일 처리 ── */
  const onFile = useCallback((f: File | null | undefined) => {
    setError('');
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('PDF 파일만 업로드할 수 있어요.'); return; }
    if (f.size > 30 * 1024 * 1024) { setError('파일이 30MB를 넘어요. 필요한 단원만 잘라서 올려주세요.'); return; }
    setFile(f);
    const r = new FileReader();
    r.onload = () => setPdfB64(String(r.result).split(',')[1]);
    r.onerror = () => setError('파일을 읽지 못했어요. 다시 시도해 주세요.');
    r.readAsDataURL(f);
  }, []);

  const toggleType = (id: TypeId) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  /* ── 생성 ── */
  const generate = async () => {
    if (!apiKey) { setError('먼저 Gemini API 키를 입력해 주세요.'); return; }
    if (!pdfB64) { setError('먼저 교과서 PDF를 올려주세요.'); return; }
    if (selected.length === 0) { setError('활동지 유형을 하나 이상 선택해 주세요.'); return; }
    setBusy(true); setError(''); setResults([]);
    const out: ResultEntry[] = [];
    try {
      for (let i = 0; i < selected.length; i++) {
        const t = TYPES.find((x) => x.id === selected[i])!;
        const data = await generateWorksheet(
          apiKey,
          selected[i],
          settings,
          useWeb,
          pdfB64,
          (s, e, total) =>
            setProgress(`${t.label} (${i + 1}/${selected.length}) — ${s}~${e}번 문항 생성 중 (전체 ${total}문항)`),
        );
        out.push({ typeId: selected[i], data });
        setResults([...out]);
      }
      setProgress('');
    } catch (e) {
      setError(`생성 중 문제가 발생했어요: ${(e as Error).message}`);
      setProgress('');
    } finally {
      setBusy(false);
    }
  };

  /* ── 내보내기 ── */
  const plainText = () => buildPlainText(results, showAnswers);

  const tryCopy = async (text: string): Promise<boolean> => {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) return true;
    } catch {}
    return false;
  };

  const copyAll = async () => {
    setError('');
    if (await tryCopy(plainText())) {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } else {
      setExportOpen(true);
    }
  };

  const openGoogleDocs = async () => {
    setError('');
    const ok = await tryCopy(plainText());
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2500); }
    setExportOpen(true);
  };

  const downloadHtml = () => {
    try {
      const html = buildPrintableHtml(results, settings, showAnswers);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url,
        download: `활동지_${showAnswers ? '교사용' : '학생용'}_${new Date().toISOString().slice(0, 10)}.html`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setError("파일 저장에 실패했어요. '전체 복사'로 내용을 옮겨 주세요.");
    }
  };

  const handlePrint = () => window.print();

  /* ── JSX ── */
  return (
    <div style={{ minHeight: '100vh', background: COLORS.paper, color: COLORS.ink, fontFamily: "'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif" }}>

      {/* 상단 헤더 */}
      <header className="no-print" style={{ borderBottom: `1px solid ${COLORS.line}`, background: '#fff', padding: '18px 28px', display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <h1 style={{ margin: 0, fontFamily: "'Noto Serif KR',serif", fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em' }}>
          활동지 생성기
        </h1>
        <span style={{ fontSize: 13, color: COLORS.sub }}>교과서 PDF 한 권이면, 수업 자료가 인쇄실에서 나옵니다</span>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 60px' }}>
        <div className="ws-grid">

          {/* ── 왼쪽: 설정 패널 ── */}
          <section className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* 0. API 키 */}
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <StepBadge n="0" /><strong style={{ fontSize: 15 }}>Gemini API 키</strong>
                <span style={{ fontSize: 12, color: COLORS.sub }}>무료 · 내 브라우저에만 저장됨</span>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="password"
                  autoComplete="off"
                  placeholder="AIza... 로 시작하는 키를 붙여넣으세요"
                  value={apiKey}
                  onChange={(e) => updateApiKey(e.target.value)}
                  style={sel}
                />
                <div style={{ fontSize: 12, color: COLORS.sub, lineHeight: 1.6 }}>
                  이 키는 서버에 저장되지 않고 <b>이 브라우저에만</b> 남아요. 다른 선생님이 접속하면 각자 자기 키를 넣어서 쓰면 됩니다.{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: COLORS.blue, fontWeight: 600 }}>
                    무료 키 발급받기 ↗
                  </a>
                </div>
              </div>
            </div>

            {/* 1. 업로드 */}
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <StepBadge n="1" /><strong style={{ fontSize: 15 }}>교과서 PDF 업로드</strong>
              </div>
              <div className="drop" role="button" tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]); }}
                style={{ border: `1.5px dashed ${dragOver ? COLORS.red : '#C9C8C0'}`, background: dragOver ? COLORS.redSoft : '#fff', borderRadius: 12, padding: '26px 18px', textAlign: 'center', cursor: 'pointer' }}
              >
                <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} />
                {file ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>📄 {file.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.sub, marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(1)}MB · 클릭해서 다른 파일로 교체</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>⤒</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>PDF를 끌어다 놓거나 클릭해서 선택</div>
                    <div style={{ fontSize: 12, color: COLORS.sub, marginTop: 4 }}>최대 30MB · 필요한 단원만 올리면 더 정확해요</div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. 유형 */}
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <StepBadge n="2" /><strong style={{ fontSize: 15 }}>활동지 유형</strong>
                <span style={{ fontSize: 12, color: COLORS.sub }}>복수 선택</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TYPES.map((t) => {
                  const on = selected.includes(t.id);
                  return (
                    <button key={t.id} className="chip" onClick={() => toggleType(t.id)} aria-pressed={on}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${on ? COLORS.ink : COLORS.line}`, background: on ? COLORS.ink : '#fff', color: on ? '#fff' : COLORS.ink, fontSize: 14, textAlign: 'left' }}>
                      <span style={{ fontWeight: 600 }}>{t.label}</span>
                      <span style={{ fontSize: 12, color: on ? '#C9CDD6' : COLORS.sub }}>{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 세부 설정 */}
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <StepBadge n="3" /><strong style={{ fontSize: 15 }}>세부 설정</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#fff', border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                <Field label="학교급">
                  <select style={sel} value={settings.level} onChange={(e) => setSettings({ ...settings, level: e.target.value })}>
                    {LEVELS.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="유형당 문항 수">
                  <select style={sel} value={settings.count} onChange={(e) => setSettings({ ...settings, count: e.target.value })}>
                    {COUNTS.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="난이도">
                  <select style={sel} value={settings.diff} onChange={(e) => setSettings({ ...settings, diff: e.target.value })}>
                    {DIFFS.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="특이사항 (선택)">
                  <input style={sel} placeholder="예) 수능 대비, 실생활 연계" value={settings.note} onChange={(e) => setSettings({ ...settings, note: e.target.value })} />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', padding: '8px 10px', background: useWeb ? COLORS.blueSoft : '#F6F6F3', borderRadius: 8 }}>
                    <input type="checkbox" checked={useWeb} onChange={(e) => setUseWeb(e.target.checked)} />
                    <span><strong style={{ color: COLORS.blue }}>웹 자료로 보강</strong> — PDF에 없는 내용은 검색으로 확인된 것만 넣고, 출처를 문항에 표시합니다</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 생성 버튼 */}
            <button className="btn" onClick={generate} disabled={busy}
              style={{ padding: '15px', borderRadius: 12, border: 'none', background: busy ? '#B9BCC4' : COLORS.red, color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.01em' }}>
              {busy ? '생성 중…' : '활동지 만들기'}
            </button>
            {progress && (
              <div className="pulse" style={{ fontSize: 13, color: COLORS.sub, marginTop: -12 }}>
                ✎ {progress} — 문항마다 PDF 근거를 확인하고 있어요
              </div>
            )}
            {error && (
              <div role="alert" style={{ background: COLORS.redSoft, border: `1px solid #F0C4BC`, color: '#8C2A1C', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginTop: -10 }}>
                {error}
              </div>
            )}
          </section>

          {/* ── 오른쪽: 시험지 미리보기 ── */}
          <section>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 13, color: COLORS.sub }}>
                {results.length > 0 ? '미리보기 — 인쇄하면 이 모습 그대로 나와요' : '생성하면 여기에 시험지가 나타나요'}
              </div>
              {results.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={() => setShowAnswers((v) => !v)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${COLORS.line}`, background: '#fff', fontSize: 13, fontWeight: 600 }}>
                    {showAnswers ? '학생용 보기 (정답 숨김)' : '교사용 보기 (정답 표시)'}
                  </button>
                  <button className="btn" onClick={openGoogleDocs}
                    style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${COLORS.blue}`, background: COLORS.blueSoft, color: COLORS.blue, fontSize: 13, fontWeight: 600 }}>
                    구글독스로 내보내기 ↗
                  </button>
                  <button className="btn" onClick={copyAll}
                    style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${COLORS.line}`, background: '#fff', fontSize: 13, fontWeight: 600 }}>
                    {copied ? '복사됨 ✓' : '전체 복사'}
                  </button>
                  <button className="btn" onClick={downloadHtml}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: COLORS.ink, color: '#fff', fontSize: 13, fontWeight: 600 }}
                    title="다운로드한 파일을 열고 Ctrl+P를 누르면 PDF로 저장할 수 있어요">
                    인쇄용 파일 받기
                  </button>
                  <button className="btn" onClick={handlePrint}
                    style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${COLORS.line}`, background: '#fff', fontSize: 13, fontWeight: 600 }}>
                    🖨 인쇄
                  </button>
                </div>
              )}
            </div>

            {/* 시험지 본체 */}
            <div id="sheet-area" style={{ background: COLORS.sheet, borderRadius: 4, boxShadow: '0 2px 6px rgba(30,34,43,.08), 0 14px 34px rgba(30,34,43,.07)', position: 'relative', minHeight: 560, paddingLeft: 58, overflow: 'hidden' }}>
              {/* 채점 여백선 */}
              <div style={{ position: 'absolute', left: 44, top: 0, bottom: 0, width: 1.5, background: COLORS.red, opacity: 0.55 }} />

              {results.length === 0 ? (
                <div style={{ padding: '80px 40px', textAlign: 'center', color: '#B4B7C0' }}>
                  <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 20, fontWeight: 600, color: '#9CA0AB', marginBottom: 8 }}>( 빈 시험지 )</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>왼쪽에서 PDF를 올리고 유형을 고른 뒤<br /><b style={{ color: COLORS.red }}>활동지 만들기</b>를 누르세요</div>
                </div>
              ) : (
                <div style={{ padding: '34px 36px 40px 20px' }}>
                  {results.map(({ typeId, data }, ri) => {
                    const t = TYPES.find((x) => x.id === typeId)!;
                    return (
                      <article key={typeId} style={{ marginBottom: 44, paddingTop: ri > 0 ? 34 : 0, borderTop: ri > 0 ? `1px dashed ${COLORS.line}` : 'none' }}>
                        {/* 시험지 머리 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', borderBottom: `2.5px solid ${COLORS.ink}`, paddingBottom: 12, marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 11, letterSpacing: '0.14em', color: COLORS.red, fontWeight: 700, marginBottom: 4 }}>{t.label.toUpperCase()}</div>
                            <h2 style={{ margin: 0, fontFamily: "'Noto Serif KR',serif", fontWeight: 800, fontSize: 21, lineHeight: 1.35 }}>{data.title}</h2>
                            {data.subject && <div style={{ fontSize: 12.5, color: COLORS.sub, marginTop: 4 }}>{data.subject} · {settings.level} · {settings.diff}</div>}
                          </div>
                          <table style={{ borderCollapse: 'collapse', fontSize: 11.5, color: COLORS.sub }}>
                            <tbody>
                              <tr>{['학번', '이름', '점수'].map((h) => <td key={h} style={{ border: `1px solid ${COLORS.line}`, padding: '4px 10px', textAlign: 'center' }}>{h}</td>)}</tr>
                              <tr>{[0, 1, 2].map((i) => <td key={i} style={{ border: `1px solid ${COLORS.line}`, height: 26, minWidth: 64 }} />)}</tr>
                            </tbody>
                          </table>
                        </div>

                        {/* 문항 */}
                        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {(data.items || []).map((it) => (
                            <li key={it.no} style={{ padding: '18px 0', borderBottom: `1px solid #F0EFE9` }}>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <span style={{ fontFamily: "'Noto Serif KR',serif", fontWeight: 800, fontSize: 16, minWidth: 24 }}>{it.no}.</span>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{it.question}</p>
                                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                    {kindLabel[it.kind] && (
                                      <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 20, background: '#F3F3EF', color: COLORS.sub }}>{kindLabel[it.kind]}</span>
                                    )}
                                    {it.source === 'web' && (
                                      <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 20, background: COLORS.blueSoft, color: COLORS.blue }} title={it.source_note ?? ''}>
                                        웹 출처{it.source_note ? ` · ${it.source_note}` : ''}
                                      </span>
                                    )}
                                  </div>
                                  {(it.choices?.length ?? 0) > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 18px', marginTop: 10, fontSize: 14 }}>
                                      {it.choices!.map((c, i) => <div key={i} style={{ lineHeight: 1.6 }}>{c}</div>)}
                                    </div>
                                  )}
                                  {showAnswers && it.answer && (
                                    <div style={{ marginTop: 12, padding: '9px 12px', background: '#FCF7F0', borderLeft: `3px solid ${COLORS.red}`, borderRadius: '0 8px 8px 0', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                      <b style={{ color: COLORS.red }}>정답·해설</b> {it.answer}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>

                        {/* 출처 */}
                        {(data.sources?.length ?? 0) > 0 && (
                          <div style={{ marginTop: 18, fontSize: 12, color: COLORS.sub, lineHeight: 1.8 }}>
                            <b>참고 자료</b>
                            {data.sources!.map((s, i) => (
                              <div key={i}>· {s.url ? <a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.blue }}>{s.title}</a> : s.title}</div>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#B4B7C0', letterSpacing: '0.1em', marginTop: 8 }}>
                    — 문항은 업로드한 교과서 내용을 근거로 생성되었습니다 · 배부 전 검토해 주세요 —
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* 내보내기 도우미 모달 */}
      {exportOpen && (
        <div role="dialog" aria-modal="true" onClick={() => setExportOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 14, width: 'min(680px, 100%)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 20, gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>구글독스로 옮기기</strong>
              <button className="btn" onClick={() => setExportOpen(false)} aria-label="닫기"
                style={{ border: 'none', background: 'transparent', fontSize: 20, lineHeight: 1 }}>✕</button>
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.8, color: COLORS.sub }}>
              <li>{copied ? <span>내용이 <b style={{ color: COLORS.green }}>클립보드에 복사됐어요</b> — 바로 2번으로!</span> : <span>아래 <b>전체 선택 후 복사</b> 버튼을 누르세요</span>}</li>
              <li><a href="https://docs.new" target="_blank" rel="noreferrer" style={{ color: COLORS.blue, fontWeight: 700 }}>새 구글 문서 열기 ↗</a>를 누른 뒤</li>
              <li>빈 문서에 붙여넣기 (Ctrl+V) 하면 끝!</li>
            </ol>
            <textarea readOnly value={plainText()} onFocus={(e) => e.currentTarget.select()}
              style={{ flex: 1, minHeight: 200, width: '100%', border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 12, fontSize: 12.5, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', color: COLORS.ink }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={async () => { if (await tryCopy(plainText())) { setCopied(true); setTimeout(() => setCopied(false), 2500); } }}
                style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: COLORS.ink, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                {copied ? '복사됨 ✓' : '전체 선택 후 복사'}
              </button>
              <a href="https://docs.new" target="_blank" rel="noreferrer" className="btn"
                style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${COLORS.blue}`, background: COLORS.blueSoft, color: COLORS.blue, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                새 구글 문서 열기 ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
