/* One-off image jobs, done with headless Chrome so nothing else needs installing:
     node tools/make-images.mjs share   → images/og-hiveworx.png (1200×630 link-preview image)
     node tools/make-images.mjs webp <file.png> [quality]  → the same image as .webp beside it
   Re-run "share" if the headline or the brand changes. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, dumpDom, screenshot } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [job, arg, q] = process.argv.slice(2);
const server = await serve(ROOT);
const at = (p) => `http://127.0.0.1:${server.port}/${p}`;

try {
  if (job === 'share') {
    const logo = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<symbol id="logo"[\s\S]*?<\/symbol>/)[0];
    const page = fs.readFileSync(path.join(ROOT, 'tools/share-image.html'), 'utf8').replace('<!--LOGO-->', logo);
    fs.writeFileSync(path.join(ROOT, 'tools/.share-render.html'), page);
    const out = path.join(ROOT, 'images/og-hiveworx.png');
    await screenshot(at('tools/.share-render.html'), out, 1200, 630);
    fs.rmSync(path.join(ROOT, 'tools/.share-render.html'));
    console.log('wrote images/og-hiveworx.png', fs.statSync(out).size, 'bytes');
  } else if (job === 'webp') {
    const quality = +(q || 0.86);
    const page = `<!doctype html><body><pre id="out"></pre><script>
      const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
      c.getContext('2d').drawImage(im,0,0);document.getElementById('out').textContent=c.toDataURL('image/webp',${quality})};
      im.src=${JSON.stringify('/' + arg)};</script>`;
    fs.writeFileSync(path.join(ROOT, 'tools/.webp.html'), page);
    const html = await dumpDom(at('tools/.webp.html'));
    fs.rmSync(path.join(ROOT, 'tools/.webp.html'));
    const b64 = (html.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/) || [])[1];
    if (!b64) throw new Error('Chrome did not produce a WebP');
    const out = path.join(ROOT, arg.replace(/\.png$/i, '.webp'));
    fs.writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log(`wrote ${path.relative(ROOT, out)}: ${fs.statSync(out).size} bytes (was ${fs.statSync(path.join(ROOT, arg)).size})`);
  } else {
    console.log('usage: node tools/make-images.mjs share | webp <file.png> [quality 0-1]');
  }
} finally {
  server.close();
}
