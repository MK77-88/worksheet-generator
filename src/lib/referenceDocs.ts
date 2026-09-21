/** 사이트에 내장된 2022 개정 교육과정 참고자료 목록.
 * /curriculum-pdfs/ 폴더(저장소 루트, public 밖)에 실제 PDF 41개가 들어있고,
 * Vercel이 서빙하는 정적 파일에는 포함되지 않도록(Hobby 플랜 정적 파일 100MB 제한 회피)
 * 브라우저에서 GitHub raw 콘텐츠를 직접 fetch해서 가져옵니다.
 * 선생님이 활동지를 만들 때 "교육과정 자료 함께 사용" 옵션을 켜면
 * 이 목록을 각자의 Gemini 계정에 자동 업로드해서 근거자료로 사용합니다. */
export interface ReferenceDoc {
  file: string;   // curriculum-pdfs/ 안의 파일명
  label: string;  // 화면에 보여줄 이름
}

// 저장소: https://github.com/MK77-88/worksheet-generator
const GITHUB_OWNER = 'MK77-88';
const GITHUB_REPO = 'worksheet-generator';
const GITHUB_BRANCH = 'main';

export function referenceDocUrl(file: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/curriculum-pdfs/${encodeURIComponent(file)}`;
}

export const REFERENCE_DOCS: ReferenceDoc[] = [
  { file: 'book01-chongron.pdf', label: '별책1 총론' },
  { file: 'book03-jung.pdf', label: '별책3 중학교 교육과정' },
  { file: 'book05-gugeo.pdf', label: '별책5 국어과' },
  { file: 'book06-domok.pdf', label: '별책6 도덕과' },
  { file: 'book07-sahoe.pdf', label: '별책7 사회과' },
  { file: 'book08-suhak.pdf', label: '별책8 수학과' },
  { file: 'book09-gwahak.pdf', label: '별책9 과학과' },
  { file: 'book10a-silgwa.pdf', label: '별책10 실과·기술가정·정보 (2022-33호)' },
  { file: 'book10b-silgwa.pdf', label: '별책10 실과·기술가정·정보' },
  { file: 'book11-cheyuk.pdf', label: '별책11 체육과' },
  { file: 'book12-eumak.pdf', label: '별책12 음악과' },
  { file: 'book13-misul.pdf', label: '별책13 미술과' },
  { file: 'book14-yeongeo.pdf', label: '별책14 영어과' },
  { file: 'book16-je2oegugeo.pdf', label: '별책16 제2외국어과' },
  { file: 'book17-hanmun.pdf', label: '별책17 한문과' },
  { file: 'book18-jung-seontaek.pdf', label: '별책18 중학교 선택 교과' },
  { file: 'book19-gyoyang.pdf', label: '별책19 고등학교 교양 교과' },
  { file: 'book20-gwahak-gyeyeol.pdf', label: '별책20 과학 계열 선택 과목' },
  { file: 'book21-cheyuk-gyeyeol.pdf', label: '별책21 체육 계열 선택 과목' },
  { file: 'book22-yesul-gyeyeol.pdf', label: '별책22 예술 계열 선택 과목' },
  { file: 'book23-gyeongyeong-geumyung.pdf', label: '별책23 경영·금융 전문 교과' },
  { file: 'book24-bogeon-bokji.pdf', label: '별책24 보건·복지 전문 교과' },
  { file: 'book25-munhwa-yesul.pdf', label: '별책25 문화·예술·디자인·방송 전문 교과' },
  { file: 'book26-miyong.pdf', label: '별책26 미용 전문 교과' },
  { file: 'book27-gwangwang-leisure.pdf', label: '별책27 관광·레저 전문 교과' },
  { file: 'book28-sikpum-jori.pdf', label: '별책28 식품·조리 전문 교과' },
  { file: 'book29-geonchuk-tomok.pdf', label: '별책29 건축·토목 전문 교과' },
  { file: 'book30-gigye.pdf', label: '별책30 기계 전문 교과' },
  { file: 'book31-jaeryo.pdf', label: '별책31 재료 전문 교과' },
  { file: 'book32-hwahak-gongeop.pdf', label: '별책32 화학공업 전문 교과' },
  { file: 'book33-seomyu-uiryu.pdf', label: '별책33 섬유·의류 전문 교과' },
  { file: 'book34-jeongi-jeonja.pdf', label: '별책34 전기·전자 전문 교과' },
  { file: 'book35-jeongbo-tongsin.pdf', label: '별책35 정보·통신 전문 교과' },
  { file: 'book36-hwangyeong-anjeon.pdf', label: '별책36 환경·안전·소방 전문 교과' },
  { file: 'book37-nongnim-chuksan.pdf', label: '별책37 농림·축산 전문 교과' },
  { file: 'book38-susan-haeun.pdf', label: '별책38 수산·해운 전문 교과' },
  { file: 'book39-yungbokhap.pdf', label: '별책39 융복합·지식재산 전문 교과' },
  { file: 'book40-changuijeok.pdf', label: '별책40 창의적 체험활동' },
  { file: 'book41-hangugeo.pdf', label: '별책41 한국어 교육과정' },
  { file: 'book-hs-total-guide.pdf', label: '총론 해설(고등학교)' },
  { file: 'book-ms-total-guide.pdf', label: '총론 해설(중학교)' },
];
