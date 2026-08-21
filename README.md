# 활동지 생성기

교과서 PDF를 올리면 AI가 형성평가·개념정리·탐구활동지 등을 자동으로 만들어주는 웹서비스입니다.

## 배포 방법 (Vercel — 무료)

### 1. GitHub에 올리기

```bash
# 이 폴더에서 실행
git init
git add .
git commit -m "first commit"

# GitHub에서 새 Repository 만들고 (worksheet-generator 등)
git remote add origin https://github.com/[내ID]/[레포이름].git
git push -u origin main
```

### 2. Vercel에서 배포하기

1. https://vercel.com 접속 → GitHub 로그인
2. "Add New Project" → 방금 만든 repository 선택
3. **Environment Variables** 탭에서:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...` (Anthropic Console에서 발급)
4. "Deploy" 클릭 → 1~2분 후 배포 완료

### 3. Anthropic API 키 발급

https://console.anthropic.com → API Keys → Create Key

---

## 로컬 개발

```bash
# 의존성 설치
npm install

# .env.local 파일 만들기
cp .env.example .env.local
# .env.local 을 열어서 실제 API 키 입력

# 개발 서버 실행
npm run dev
# http://localhost:3000 접속
```

## 비용 안내

- Vercel 호스팅: 무료 (Hobby 플랜)
- Anthropic API: PDF 1개 + 5문항 기준 약 2~5원 수준 (claude-sonnet-4-6)
- 도메인 연결: Vercel 설정에서 커스텀 도메인 무료 추가 가능

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **AI**: Anthropic claude-sonnet-4-6
- **배포**: Vercel
