import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '활동지 생성기',
  description: '교과서 PDF를 올리면 AI가 활동지를 만들어 드립니다',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;800&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
