/* Helpers shared by the build tools: a tiny static server and headless Chrome. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';

export const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain',
};

/* serve a folder on a free localhost port; folders answer with their index.html */
export function serve(root) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ port: server.address().port, close: () => server.close() })));
}

/* run headless Chrome once; resolves when `done(stdout)` says so, or when Chrome exits */
function chrome(args, done, timeoutMs = 45000) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'hx-chrome-'));
  const p = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', `--user-data-dir=${profile}`, ...args], { stdio: ['ignore', 'pipe', 'ignore'] });
  let out = '', settled = false;
  return new Promise((ok, fail) => {
    const finish = (err) => {
      if (settled) return; settled = true;   /* kill() fires 'exit' too: finish only once */
      clearTimeout(timer); clearInterval(poll);
      try { p.kill('SIGKILL'); } catch {}
      fs.rmSync(profile, { recursive: true, force: true });
      err ? fail(err) : ok(out);
    };
    const timer = setTimeout(() => finish(new Error('Chrome timed out: ' + args.at(-1))), timeoutMs);
    const poll = setInterval(() => { if (done(out)) finish(); }, 200);
    p.stdout.on('data', (d) => { out += d; });
    p.on('exit', () => finish());
    p.on('error', finish);
  });
}

/* the page's DOM after its scripts have run (reduced motion: no scroll effects baked in) */
export async function dumpDom(url, { reducedMotion = true, tries = 3 } = {}) {
  for (let i = 1; ; i++) {
    try {
      const html = await chrome([...(reducedMotion ? ['--force-prefers-reduced-motion'] : []),
        '--virtual-time-budget=8000', '--dump-dom', url], (o) => o.includes('</html>'));
      if (!html.includes('</html>')) throw new Error('No page rendered for ' + url);
      return html;
    } catch (e) {
      if (i >= tries) throw e;   /* Chrome occasionally stalls on start; try again */
    }
  }
}

export async function screenshot(url, out, width, height, { reducedMotion = false } = {}) {
  fs.rmSync(out, { force: true });
  let last = -1;
  await chrome([...(reducedMotion ? ['--force-prefers-reduced-motion'] : []),
    `--window-size=${width},${height}`, '--virtual-time-budget=6000', `--screenshot=${out}`, url], () => {
    if (!fs.existsSync(out)) return false;
    const size = fs.statSync(out).size; const stable = size > 0 && size === last; last = size; return stable;
  });
  if (!fs.existsSync(out)) throw new Error('No screenshot for ' + url);
}
