export const COLORS = {
  paper: '#FAFAF6',
  sheet: '#FFFFFF',
  ink: '#1E222B',
  sub: '#6B7080',
  line: '#E4E3DC',
  red: '#D8402C',
  redSoft: '#FBEBE8',
  blue: '#2C4E86',
  blueSoft: '#EDF2FA',
  green: '#2E6B4F',
} as const;

export const TYPES = [
  { id: 'formative',     label: '형성평가 문제지', desc: '선택형·단답형 문항' },
  { id: 'concept',       label: '개념 정리 활동지', desc: '빈칸 채우기·요약' },
  { id: 'inquiry',       label: '탐구 활동지',      desc: '서술형·탐구 과제' },
  { id: 'rubric',        label: '수행평가 루브릭',   desc: '채점 기준표' },
  { id: 'misconception', label: '오개념 클리닉',     desc: '흔한 오개념 교정' },
] as const;

export type TypeId = typeof TYPES[number]['id'];

export const LEVELS  = ['초등학교', '중학교', '고등학교'] as const;
export const COUNTS  = ['3문항', '5문항', '8문항', '10문항'] as const;
export const DIFFS   = ['기본 위주', '기본+심화', '심화 위주'] as const;

export const TYPE_GUIDE: Record<TypeId, string> = {
  formative:
    '형성평가 문제지: 선택형(4지선다)과 단답형을 섞어 출제. 각 문항에 정답과 간단한 해설 포함.',
  concept:
    '개념 정리 활동지: 핵심 개념의 빈칸 채우기, 용어-정의 연결, 한 문장 요약 활동으로 구성. 빈칸은 ____로 표시.',
  inquiry:
    '탐구 활동지: 자료 해석, 사고 실험, 서술형 탐구 질문으로 구성. 모범 답안의 핵심 요소를 answer에 기술.',
  rubric:
    "수행평가 루브릭: 평가 요소별로 '상/중/하' 성취 수준 기준을 표 형태로 기술. question에 평가 요소, answer에 상/중/하 기준을 줄바꿈으로 구분해 기술.",
  misconception:
    '오개념 클리닉: 학생들이 흔히 갖는 오개념을 제시하고(question), 왜 틀렸는지와 올바른 개념(answer)을 설명하는 문항으로 구성.',
};

export interface Settings {
  level: string;
  count: string;
  diff: string;
  note: string;
}

export interface WorksheetItem {
  no: number;
  kind: string;
  question: string;
  choices?: string[];
  answer?: string;
  source?: string;
  source_note?: string;
}

export interface WorksheetData {
  title: string;
  subject?: string;
  items: WorksheetItem[];
  sources?: { title: string; url?: string }[];
}

export interface ResultEntry {
  typeId: TypeId;
  data: WorksheetData;
}
