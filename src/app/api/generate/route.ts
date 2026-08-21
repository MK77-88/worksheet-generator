import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * 브라우저에서 Gemini API로 직접 호출이 실패했을 때(네트워크/CORS 문제)만 쓰는
 * 대체 경로입니다. 요청에 담겨 온 API 키를 그대로 구글로 전달할 뿐,
 * 서버에 저장하거나 로그로 남기지 않습니다. 환경변수도 사용하지 않습니다 —
 * 각 사용자가 자기 브라우저에 입력한 키만 사용됩니다.
 */
export async function POST(req: NextRequest) {
  let body: { apiKey?: string; model?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { message: '요청 형식이 올바르지 않습니다.' } }, { status: 400 });
  }

  const { apiKey, model, payload } = body;
  if (!apiKey) {
    return NextResponse.json({ error: { message: 'API 키가 없습니다.' } }, { status: 400 });
  }
  if (!model || !payload) {
    return NextResponse.json({ error: { message: '요청 내용이 올바르지 않습니다.' } }, { status: 400 });
  }

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
