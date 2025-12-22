/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/test6',
  assetPrefix: '/test6/',

  // ✅ บังคับใช้ SWC transforms (กัน Babel เพี้ยน)
  experimental: {
    forceSwcTransforms: true,
  },
}

module.exports = nextConfig
