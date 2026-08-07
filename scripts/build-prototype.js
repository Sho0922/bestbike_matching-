#!/usr/bin/env node
/**
 * クライアント提示用プロトタイプ（prototype/index.html）を生成する。
 *
 * CRAのビルド成果物と、Tailwind CLIで生成したCSSを1ファイルにインライン化し、
 * 外部ネットワークに一切依存しない単体HTMLを作る。
 * ローカルでダブルクリックして開けること、社内共有サーバに置くだけで動くことを狙う。
 *
 * 実行: npm run build:prototype
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, 'build');
const outDir = path.join(root, 'prototype');
const cssPath = path.join(root, 'scripts', '.tailwind.out.css');

function fail(message) {
  console.error(`[build-prototype] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(buildDir)) fail('build/ がありません。先に `npm run build` を実行してください。');
if (!fs.existsSync(cssPath)) fail('Tailwind CSS が未生成です。`npm run build:prototype` から実行してください。');

// --- CRAが出力したJSバンドルを集める（main + チャンク） ---
const jsDir = path.join(buildDir, 'static', 'js');
const jsFiles = fs
  .readdirSync(jsDir)
  .filter((f) => f.endsWith('.js'))
  .sort((a, b) => (a.startsWith('main.') ? 1 : 0) - (b.startsWith('main.') ? 1 : 0)); // main を最後に

if (jsFiles.length === 0) fail('build/static/js にJSバンドルが見つかりません。');

const js = jsFiles.map((f) => fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n;\n');

// --- CSS: Tailwind生成分 + CRAが出力したCSS（あれば） ---
let css = fs.readFileSync(cssPath, 'utf8');
const cssDir = path.join(buildDir, 'static', 'css');
if (fs.existsSync(cssDir)) {
  for (const f of fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'))) {
    css += '\n' + fs.readFileSync(path.join(cssDir, f), 'utf8');
  }
}

// --- インライン化の安全確認 ---
// JS内の "</script" はHTMLパーサに閉じタグと誤認されるため、JS的に等価な "<\/script" へ退避する。
const safeJs = js.replace(/<\/script/gi, '<\\/script');
if (/<\/style/i.test(css)) fail('CSSに "</style" が含まれています。インライン化できません。');

const html = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BestBike × 教習所マッチング — プロトタイプ</title>
    <meta name="description" content="BestBike提携教習所マッチングプラットフォームの動作プロトタイプ（全10画面）" />
    <meta name="robots" content="noindex, nofollow" />
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
${safeJs}
    </script>
  </body>
</html>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

const kb = (n) => `${Math.round(n / 1024)} kB`;
console.log('[build-prototype] prototype/index.html を生成しました');
console.log(`  JS  : ${jsFiles.length} ファイル / ${kb(js.length)}`);
console.log(`  CSS : ${kb(css.length)}`);
console.log(`  合計: ${kb(html.length)}（外部リクエストなし）`);
