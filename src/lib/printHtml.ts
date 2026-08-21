import { COLORS, TYPES, ResultEntry, Settings } from './constants';

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function buildPrintableHtml(
  results: ResultEntry[],
  settings: Settings,
  showAnswers: boolean,
): string {
  let body = '';
  results.forEach(({ typeId, data }, ri) => {
    const t = TYPES.find((x) => x.id === typeId)!;
    body += `<article style="${ri > 0 ? 'page-break-before:always;' : ''}margin-bottom:44px">
<div style="border-bottom:2.5px solid ${COLORS.ink};padding-bottom:12px;margin-bottom:6px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">
  <div>
    <div style="font-size:11px;letter-spacing:.14em;color:${COLORS.red};font-weight:700;margin-bottom:4px">${esc(t.label)}</div>
    <h2 style="margin:0;font-family:'Noto Serif KR',serif;font-weight:800;font-size:21px;line-height:1.35">${esc(data.title)}</h2>
    ${data.subject ? `<div style="font-size:12.5px;color:${COLORS.sub};margin-top:4px">${esc(data.subject)} · ${esc(settings.level)} · ${esc(settings.diff)}</div>` : ''}
  </div>
  <table style="border-collapse:collapse;font-size:11.5px;color:${COLORS.sub}"><tbody>
    <tr><td style="border:1px solid ${COLORS.line};padding:4px 10px;text-align:center">학번</td><td style="border:1px solid ${COLORS.line};padding:4px 10px;text-align:center">이름</td><td style="border:1px solid ${COLORS.line};padding:4px 10px;text-align:center">점수</td></tr>
    <tr><td style="border:1px solid ${COLORS.line};height:26px;min-width:64px"></td><td style="border:1px solid ${COLORS.line}"></td><td style="border:1px solid ${COLORS.line}"></td></tr>
  </tbody></table>
</div>
<ol style="list-style:none;padding:0;margin:0">`;
    (data.items || []).forEach((it) => {
      body += `<li style="padding:18px 0;border-bottom:1px solid #F0EFE9">
<div style="display:flex;gap:10px">
  <span style="font-family:'Noto Serif KR',serif;font-weight:800;font-size:16px;min-width:24px">${it.no}.</span>
  <div style="flex:1">
    <p style="margin:0;font-size:14.5px;line-height:1.75;white-space:pre-wrap">${esc(it.question)}</p>
    ${it.choices?.length ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin-top:10px;font-size:14px">${it.choices.map((c) => `<div style="line-height:1.6">${esc(c)}</div>`).join('')}</div>` : ''}
    ${it.source === 'web' && it.source_note ? `<div style="font-size:10.5px;color:${COLORS.blue};margin-top:6px">※ 웹 출처: ${esc(it.source_note)}</div>` : ''}
    ${showAnswers && it.answer ? `<div style="margin-top:12px;padding:9px 12px;background:#FCF7F0;border-left:3px solid ${COLORS.red};font-size:13px;line-height:1.7;white-space:pre-wrap"><b style="color:${COLORS.red}">정답·해설</b> ${esc(it.answer)}</div>` : ''}
  </div>
</div></li>`;
    });
    body += `</ol>`;
    if (data.sources?.length) {
      body += `<div style="margin-top:18px;font-size:12px;color:${COLORS.sub};line-height:1.8"><b>참고 자료</b>${data.sources.map((s) => `<div>· ${esc(s.title)} ${s.url ? esc(s.url) : ''}</div>`).join('')}</div>`;
    }
    body += `</article>`;
  });

  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<title>활동지</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;800&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#EEE;font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:${COLORS.ink}}
  .sheet{max-width:800px;margin:24px auto;background:#fff;position:relative;padding:34px 40px 40px 74px;box-shadow:0 2px 12px rgba(0,0,0,.12)}
  .sheet::before{content:"";position:absolute;left:52px;top:0;bottom:0;width:1.5px;background:${COLORS.red};opacity:.55}
  .hint{max-width:800px;margin:16px auto 0;font-size:13px;color:#666;text-align:center}
  @media print{body{background:#fff}.sheet{margin:0;max-width:none;box-shadow:none;padding:10mm 10mm 10mm 20mm}.hint{display:none}}
</style></head>
<body>
<div class="hint">이 파일을 연 상태에서 <b>Ctrl+P (Mac: ⌘+P)</b> → 대상 "PDF로 저장"을 누르면 PDF가 됩니다</div>
<div class="sheet">${body}
<div style="text-align:center;font-size:11px;color:#B4B7C0;letter-spacing:.1em;margin-top:20px">— 문항은 업로드한 교과서 내용을 근거로 생성되었습니다 · 배부 전 검토해 주세요 —</div>
</div></body></html>`;
}

export function buildPlainText(
  results: ResultEntry[],
  showAnswers: boolean,
): string {
  let s = '';
  results.forEach(({ typeId, data }) => {
    const t = TYPES.find((x) => x.id === typeId)!;
    s += `【${t.label}】 ${data.title}\n${data.subject ?? ''}\n\n`;
    (data.items || []).forEach((it) => {
      s += `${it.no}. ${it.question}\n`;
      (it.choices || []).forEach((c) => (s += `   ${c}\n`));
      if (showAnswers && it.answer) s += `   ▶ 정답/해설: ${it.answer}\n`;
      if (it.source === 'web' && it.source_note) s += `   ※ 출처: ${it.source_note}\n`;
      s += '\n';
    });
    if (data.sources?.length) {
      s += '참고 자료\n';
      data.sources.forEach((src) => (s += `- ${src.title} ${src.url ?? ''}\n`));
    }
    s += '\n────────────\n\n';
  });
  return s;
}
