/** @type {import('tailwindcss').Config} */
// プロトタイプ配布版（prototype/index.html）のCSSを生成するための設定。
// CRA本体は public/index.html の Tailwind CDN で描画しているため、
// この設定は `npm run build:prototype` からのみ使用する。
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
