/** @type {import('next').NextConfig} */
const nextConfig = {
  // PDF는 최대 20MB까지 허용 (Vercel 기본 4.5MB → 늘려줌)
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

module.exports = nextConfig;
