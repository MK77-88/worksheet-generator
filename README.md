# 활동지 생성기

교과서 PDF를 올리면 AI(Gemini)가 형성평가·개념정리·탐구활동지 등을 자동으로 만들어주는 웹서비스입니다.

## 이번 버전에서 바뀐 점

- **Anthropic → Gemini(무료 티어)** 로 전환했습니다.
- **API 키를 서버가 아니라 각 사용자의 브라우저에 저장**합니다. 즉, 다른 선생님이 이 사이트에 접속하면 자기 Gemini 키(무료)를 직접 입력해서 씁니다 — MK님의 키나 비용과는 무관해요.
- 그래서 **Vercel에 환경변수를 설정할 필요가 없어졌습니다.** 코드만 올리고 배포하면 끝!
- 브라우저에서 구글로 바로 요청을 보내기 때문에, 이전에 있었던 "큰 PDF가 서버 용량 제한에 걸리는 문제"도 사라졌습니다.

## 배포 방법 (Vercel — 무료, 환경변수 없음)

### 1. GitHub에 올리기 (이미 하셨다면 건너뛰기)

압축을 푼 폴더 안의 파일들을 GitHub 저장소에 업로드하세요. (터미널 대신 GitHub 웹사이트의 "uploading an existing file" 로도 가능)

### 2. Vercel에서 배포하기

1. https://vercel.com 접속 → GitHub로 로그인
2. "Add New Project" → 저장소 선택
3. **환경변수 설정 없이 바로 "Deploy" 클릭** (이전 버전과 다른 점!)
4. 1~2분 후 배포 완료 → `https://프로젝트이름.vercel.app` 주소 생성

### 3. 사용하는 사람은 각자 무료 Gemini 키 발급

1. https://aistudio.google.com/apikey 접속 (Google 계정으로 로그인)
2. "Create API Key" 클릭 → 키 복사
3. 배포된 사이트의 "0. Gemini API 키" 칸에 붙여넣기 → 그 브라우저에 자동 저장됨

---

## 로컬 개발

```bash
npm install
npm run dev
# http://localhost:3000 접속 후 화면에서 직접 API 키 입력
```

## 비용 안내

- Vercel 호스팅: 무료
- Gemini API: `gemini-2.5-flash` 무료 티어 사용 (사용량 제한 있음, 개인 사용엔 충분)
- 도메인 연결: Vercel 설정에서 커스텀 도메인 무료 추가 가능

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **AI**: Google Gemini API (`gemini-2.5-flash`), 사용자별 API 키
- **배포**: Vercel
