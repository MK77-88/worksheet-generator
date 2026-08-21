import { TYPE_GUIDE, TYPES, Settings, WorksheetData, TypeId } from './constants';

const BATCH_SIZE = 3;
export const GEMINI_MODEL = 'gemini-2.5-flash'; // 무료 티어로 사용 가능

function buildPrompt(
  typeId: TypeId,
  settings: Settings,
  useWeb: boolean,
  startNo: number,
  endNo: number,
  prevQuestions: string[],
): string {
  const t = TYPES.find((x) => x.id === typeId)!;
  return `당신은 한국 ${settings.level} 교사를 돕는 활동지 출제 전문가입니다. 첨부된 교과서 PDF를 근거로 활동지를 만드세요.

[활동지 유형] ${t.label}
${TYPE_GUIDE[typeId]}

[이번 요청 범위]
- 전체 ${settings.count.replace('문항', '')}문항 중 ${startNo}번부터 ${endNo}번까지 ${endNo - startNo + 1}개 문항만 생성하세요.
${
  prevQuestions.length
    ? `- 이미 만들어진 문항들과 내용이 겹치지 않게 하세요:\n${prevQuestions
        .map((q, i) => `  (${i + 1}) ${q.slice(0, 50)}`)
        .join('\n')}`
    : ''
}

[조건]
- 학교급: ${settings.level}, 난이도: ${settings.diff}
${settings.note ? `- 특이사항: ${settings.note}` : ''}

[절대 규칙 — 할루시네이션 금지]
1. 모든 문항의 사실적 내용은 첨부된 PDF에 실제로 등장하는 내용에 근거해야 합니다.
2. ${useWeb ? '웹 검색으로 보강할 수 있으나, 검색 결과에서 직접 확인한 사실만 사용하고 해당 문항의 source를 "web"으로 표시하며 source_note에 출처명을 적으세요.' : 'PDF 밖의 외부 지식을 추가하지 마세요.'}
3. 확실하지 않은 내용은 문항에서 제외하세요. 추측으로 채우지 마세요.
4. 인명, 연도, 수치는 PDF${useWeb ? ' 또는 검색 결과' : ''}에서 확인된 것만 사용하세요.

[출력 형식 — 매우 중요]
- 아래 JSON만 출력하세요. 마크다운 코드펜스, 인사말, 설명 등 다른 텍스트를 절대 포함하지 마세요.
- JSON 문자열 값 안에서 줄바꿈이 필요하면 반드시 \\n으로 이스케이프하세요. 실제 줄바꿈 문자를 넣지 마세요.
- 각 문항은 간결하게 작성하세요 (question 200자 이내, answer 150자 이내).
{
  "title": "활동지 제목 (단원명 포함)",
  "subject": "추정 교과목 및 단원",
  "items": [
    {
      "no": ${startNo},
      "kind": "choice|fill|short|essay|rubric|misconception",
      "question": "문항 내용 (빈칸은 ____)",
      "choices": ["①...", "②...", "③...", "④..."],
      "answer": "정답 및 간단 해설",
      "source": "pdf|web",
      "source_note": "web일 때 출처명"
    }
  ],
  "sources": [{"title": "출처명", "url": "URL"}]
}
choices는 선택형일 때만 포함. sources는 웹 자료를 사용했을 때만 포함.`;
}

function safeParseJson(raw: string): WorksheetData {
  let s = raw.replace(/```json|```/g, '').trim();
  const a = s.indexOf('{');
  if (a === -1) throw new Error('응답에서 JSON을 찾지 못했어요');
  s = s.slice(a);

  const tryParse = (str: string): WorksheetData | null => {
    try { return JSON.parse(str); } catch { return null; }
  };

  const b = s.lastIndexOf('}');
  if (b !== -1) {
    const direct = tryParse(s.slice(0, b + 1));
    if (direct) return direct;
  }

  let out = '';
  let inStr = false;
  let esc = false;
  const stack: string[] = [];
  for (const ch of s) {
    if (inStr) {
      if (esc) { out += ch; esc = false; }
      else if (ch === '\\') { out += ch; esc = true; }
      else if (ch === '"') { out += ch; inStr = false; }
      else if (ch === '\n' || ch === '\r') { out += '\\n'; }
      else if (ch.charCodeAt(0) < 32) { out += ' '; }
      else { out += ch; }
    } else {
      if (ch === '"') { out += ch; inStr = true; }
      else if (ch === '{' || ch === '[') { out += ch; stack.push(ch); }
      else if (ch === '}' || ch === ']') { out += ch; stack.pop(); }
      else { out += ch; }
    }
  }
  if (esc) out = out.slice(0, -1);
  if (inStr) out += '"';
  out = out.replace(/[,:]\s*$/, '');
  while (stack.length) out += stack.pop() === '{' ? '}' : ']';

  const repaired = tryParse(out);
  if (repaired) return repaired;

  const lastComplete = out.lastIndexOf('},');
  if (lastComplete !== -1) {
    const salvage = tryParse(out.slice(0, lastComplete + 1) + ']}');
    if (salvage) return salvage;
  }
  throw new Error('응답 형식을 복구하지 못했어요');
}

interface GeminiPart { text?: string; inline_data?: { mime_type: string; data: string } }

function buildGeminiBody(prompt: string, useWeb: boolean, pdfB64: string) {
  const parts: GeminiPart[] = [
    { inline_data: { mime_type: 'application/pdf', data: pdfB64 } },
    { text: prompt },
  ];
  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
  };
  // google_search 도구와 강제 JSON 응답 모드는 함께 쓰기 까다로워서
  // 프롬프트로 JSON을 요청하고 safeParseJson으로 복구하는 방식을 유지
  if (useWeb) body.tools = [{ google_search: {} }];
  return body;
}

async function callGeminiDirect(apiKey: string, body: unknown): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API 오류');
  const cand = data.candidates?.[0];
  if (!cand) throw new Error('응답이 비어 있어요 (안전 필터에 걸렸을 수 있어요)');
  return (cand.content?.parts || [])
    .map((p: GeminiPart) => p.text || '')
    .join('\n');
}

async function callGeminiViaProxy(apiKey: string, body: unknown): Promise<string> {
  // 브라우저에서 구글로 직접 호출이 막힌 네트워크 환경을 위한 대체 경로.
  // 우리 서버는 키를 저장하지 않고 그대로 전달만 함.
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, model: GEMINI_MODEL, payload: body }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API 오류');
  const cand = data.candidates?.[0];
  if (!cand) throw new Error('응답이 비어 있어요 (안전 필터에 걸렸을 수 있어요)');
  return (cand.content?.parts || [])
    .map((p: GeminiPart) => p.text || '')
    .join('\n');
}

async function callApi(apiKey: string, prompt: string, useWeb: boolean, pdfB64: string): Promise<string> {
  const body = buildGeminiBody(prompt, useWeb, pdfB64);
  try {
    return await callGeminiDirect(apiKey, body);
  } catch (e) {
    // 네트워크/CORS 문제로 직접 호출이 실패한 경우에만 프록시로 재시도
    if (e instanceof TypeError) {
      return await callGeminiViaProxy(apiKey, body);
    }
    throw e;
  }
}

export async function generateWorksheet(
  apiKey: string,
  typeId: TypeId,
  settings: Settings,
  useWeb: boolean,
  pdfB64: string,
  onBatch?: (start: number, end: number, total: number) => void,
): Promise<WorksheetData> {
  if (!apiKey) throw new Error('Gemini API 키를 먼저 입력해 주세요');
  const total = parseInt(settings.count, 10) || 5;
  const merged: WorksheetData = { title: '', subject: '', items: [], sources: [] };
  const prevQuestions: string[] = [];

  for (let start = 1; start <= total; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, total);
    onBatch?.(start, end, total);
    const prompt = buildPrompt(typeId, settings, useWeb, start, end, prevQuestions);

    let parsed: WorksheetData | null = null;
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await callApi(apiKey, prompt, useWeb, pdfB64);
        parsed = safeParseJson(text);
        break;
      } catch (e) { lastErr = e as Error; }
    }
    if (!parsed) throw lastErr ?? new Error('생성 실패');

    if (!merged.title && parsed.title) merged.title = parsed.title;
    if (!merged.subject && parsed.subject) merged.subject = parsed.subject;
    (parsed.items || [])
      .filter((it) => it?.question)
      .forEach((it) => {
        it.no = merged.items.length + 1;
        merged.items.push(it);
        prevQuestions.push(String(it.question));
      });
    (parsed.sources || []).forEach((src) => {
      if (src?.title && !merged.sources!.some((x) => x.title === src.title))
        merged.sources!.push(src);
    });
  }
  if (merged.items.length === 0) throw new Error('문항이 생성되지 않았어요');
  return merged;
}
