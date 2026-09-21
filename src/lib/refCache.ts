/** 내장 교육과정 자료(41종)를 Gemini에 업로드한 뒤 받은 참조(uri)를
 * 브라우저 localStorage에 저장해두는 캐시.
 *
 * Gemini Files API에 올린 파일은 그 API 키가 속한 구글 프로젝트에
 * 48시간 동안만 보관돼요(구글 쪽 정책). 탭을 닫았다 열면 이전엔
 * 메모리 캐시가 날아가서 매번 다시 올려야 했는데, 이제 참조 주소만
 * localStorage에 저장해뒀다가 48시간 안이면 재사용합니다.
 *
 * API 키가 바뀌면(=다른 구글 프로젝트) 이전 캐시는 무효라서 같이 비웁니다. */

const STORAGE_KEY = 'gemini_ref_doc_cache_v1';
// 실제 만료는 48시간이지만, 경계에서 실패하지 않도록 47시간으로 여유를 둠
const VALID_MS = 47 * 60 * 60 * 1000;

export interface CachedRefEntry {
  uri: string;
  mimeType: string;
  uploadedAt: number; // Date.now()
}

interface StoredCache {
  apiKey: string;
  docs: Record<string, CachedRefEntry>;
}

/** 저장된 캐시 중 지금 apiKey와 일치하고 아직 유효기간(47시간) 안인 것만 반환 */
export function loadRefCache(apiKey: string): Record<string, CachedRefEntry> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: StoredCache = JSON.parse(raw);
    if (!parsed || parsed.apiKey !== apiKey) return {};
    const now = Date.now();
    const valid: Record<string, CachedRefEntry> = {};
    for (const [file, entry] of Object.entries(parsed.docs || {})) {
      if (entry && now - entry.uploadedAt < VALID_MS) valid[file] = entry;
    }
    return valid;
  } catch {
    return {};
  }
}

export function saveRefCache(apiKey: string, docs: Record<string, CachedRefEntry>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, docs }));
  } catch {
    // localStorage 용량 초과 등은 무시 — 캐시 실패해도 매번 재업로드로 정상 동작
  }
}

export function clearRefCache(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
