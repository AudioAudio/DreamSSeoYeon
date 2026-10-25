// index.html + assets/ → dist/kkumkkugo-isseoyeon.html (이미지를 모두 넣은 파일 하나)
// 사용: node tools/build-single-file.mjs
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const assets = join(root, 'assets');
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const data = {};
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (mime[extname(f)]) data[relative(assets, p).split('\\').join('/')] = `data:${mime[extname(f)]};base64,` + readFileSync(p).toString('base64');
  }
})(assets);

const html = readFileSync(join(root, 'index.html'), 'utf8')
  .replace('</head>', `<script>window.ASSET_DATA=${JSON.stringify(data)};</script>\n</head>`);
mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', 'kkumkkugo-isseoyeon.html');
writeFileSync(out, html);
console.log(`${Object.keys(data).length}개 이미지 포함 → ${out} (${Math.round(html.length / 1024)} KB)`);
