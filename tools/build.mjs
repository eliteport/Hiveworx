/* Builds the published site into dist/.

   The source (index.html + js/main.js + sessions.json) is a one-page site: views switch by #hash.
   Search engines and link previews need one real address per page, with its content already in the
   HTML. So for every view this script:
     1. opens the one-page site at that view in headless Chrome and saves the finished page,
     2. keeps only that view's markup, points links and images at real addresses,
     3. writes the page's own title, description, canonical address, share tags and structured data.
   Then it adds 404.html, sitemap.xml and robots.txt, and copies the assets the pages use.

   Run:  node tools/build.mjs        (needs Google Chrome; set CHROME=/path/to/chrome elsewhere)
   Re-run after every change to index.html, css, js or sessions.json, then upload dist/. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, dumpDom } from './lib.mjs';

const SITE = 'https://hiveworx.com';                 // the live address, no trailing slash
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DEFAULT_IMAGE = 'images/og-hiveworx.png';       // 1200×630 share image for pages without their own
const TODAY = new Date().toISOString().slice(0, 10);

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'sessions.json'), 'utf8'));
const sessions = data.sessions || [];

/* ---------- small helpers ---------- */
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const abs = (p) => SITE + '/' + p.replace(/^\.?\//, '');
function clip(text, max = 155) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,;:.\s]+$/, '') + '…';
}
const typeLabel = (s) => (s.format === 'talk' ? 'Talk' : 'Workshop');

/* where each view lives */
const PATHS = { 'about-us': 'about/', workshops: 'workshops/', mentors: 'mentors/' };
function pagePath(page) {
  if (page === 'home') return '';
  if (page.startsWith('w-')) return 'workshops/' + page.slice(2) + '/';
  return PATHS[page];
}
/* the same link rules as href() in js/main.js */
function link(r, page, base) {
  if (r.startsWith('w-')) return base + 'workshops/' + r.slice(2) + '/';
  if (PATHS[r]) return base + PATHS[r];
  if (r === 'top') return page === 'home' ? '#top' : base;
  return page === 'home' ? '#' + r : base + '#' + r;
}

/* cut one element out by id, matching nested <div>s */
function removeDiv(html, id) {
  const start = html.indexOf(`<div id="${id}"`);
  if (start < 0) return html;
  const re = /<div\b|<\/div>/g; re.lastIndex = start; let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return html.slice(0, start) + html.slice(re.lastIndex);
  }
  throw new Error('Unbalanced markup around #' + id);
}
const VIEWS = { home: 'view-home', 'about-us': 'view-about', workshops: 'view-workshops', mentors: 'view-mentors', detail: 'view-detail' };

/* ---------- structured data ---------- */
const ORG = { '@type': 'EducationalOrganization', '@id': SITE + '/#org', name: 'Hiveworx', url: SITE + '/', email: 'hello@hiveworx.com',
  logo: SITE + '/images/og-hiveworx.png',
  description: 'An experience-based design school in Lisbon. Hands-on workshops and talks in design, sound, typography and film, taught by working practitioners, not professors.',
  founder: { '@type': 'Person', name: 'Temo K. Dolidze' }, address: { '@type': 'PostalAddress', addressLocality: 'Lisbon', addressCountry: 'PT' } };
function breadcrumb(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) };
}
/* Lisbon's UTC offset on a date (+01:00 in summer time, +00:00 in winter) */
function lisbonOffset(dateISO) {
  const name = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Lisbon', timeZoneName: 'longOffset' })
    .formatToParts(new Date(dateISO + 'T12:00:00Z')).find((p) => p.type === 'timeZoneName').value;
  return name === 'GMT' ? '+00:00' : name.replace('GMT', '');
}
function sessionLd(s, url) {
  const description = clip(s.summary || (s.about || [])[0], 300);
  const image = s.image ? [abs(s.image.src)] : undefined;
  if (!s.dateISO) {
    return { '@type': 'Course', name: s.title, description, url, image, provider: { '@id': ORG['@id'] }, inLanguage: 'en' };
  }
  const tm = String(s.time || '').match(/^(\d{1,2}):(\d{2})$/);
  const off = lisbonOffset(s.dateISO);
  const startDate = tm ? `${s.dateISO}T${tm[1].padStart(2, '0')}:${tm[2]}:00${off}` : s.dateISO;
  let endDate;
  const dm = String(s.duration || '').match(/(\d+)\s*hours?(?:\s*(\d+)\s*min)?/i);
  if (tm && dm) {
    const mins = +tm[1] * 60 + +tm[2] + +dm[1] * 60 + (+dm[2] || 0);
    if (mins < 24 * 60) endDate = `${s.dateISO}T${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:00${off}`;
  }
  const ev = {
    '@type': 'Event', name: s.title, description, url, image, startDate, endDate,
    eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: s.location || 'Hiveworx studio, Lisbon', address: { '@type': 'PostalAddress', addressLocality: 'Lisbon', addressCountry: 'PT' } },
    organizer: { '@id': ORG['@id'] },
    performer: s.mentor && s.mentor.name ? { '@type': 'Person', name: s.mentor.name } : undefined,
    inLanguage: 'en',
  };
  const price = /free/i.test(s.price || '') ? '0' : ((String(s.price || '').match(/\d+(?:[.,]\d+)?/) || [])[0] || '').replace(',', '.');
  if (price) ev.offers = { '@type': 'Offer', price, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: s.bookUrl || url };
  return ev;
}
function mentorsLd() {
  const seen = new Set(), people = [];
  const add = (m) => { if (m && m.name && !seen.has(m.name) && m.listed !== false) { seen.add(m.name); people.push(m); } };
  (data.mentors || []).forEach(add); sessions.forEach((s) => add(s.mentor));
  return { '@type': 'ItemList', itemListElement: people.map((m, i) => ({ '@type': 'ListItem', position: i + 1,
    item: { '@type': 'Person', name: m.name, jobTitle: m.role || undefined, image: m.photo ? abs(m.photo) : undefined, worksFor: { '@id': ORG['@id'] } } })) };
}

/* ---------- what to build ---------- */
const HOME_DESC = 'An experience-based design school in Lisbon. Hands-on workshops and talks in design, sound, typography and film, taught by working practitioners, not professors.';
const pages = [
  { page: 'home', desc: HOME_DESC, ld: () => [{ '@type': 'WebSite', '@id': SITE + '/#site', name: 'Hiveworx', url: SITE + '/', publisher: { '@id': ORG['@id'] } }] },
  { page: 'workshops', desc: 'Hands-on design workshops and talks in Lisbon: sound and visuals, typography, film, art and writing. Taught by practitioners, not professors. Open to anyone.',
    ld: () => [breadcrumb([['Home', SITE + '/'], ['Workshops & talks', SITE + '/workshops/']])] },
  { page: 'mentors', desc: 'Meet the Hiveworx mentors: designers, artists, musicians and critics in Lisbon who teach through their own work and experience, not theory.',
    ld: () => [breadcrumb([['Home', SITE + '/'], ['Mentors', SITE + '/mentors/']]), mentorsLd()] },
  { page: 'about-us', desc: 'Hiveworx is an experience-based design school in Lisbon. Working practitioners teach hands-on workshops and talks, open to anyone, with no diplomas or entry requirements.',
    ld: () => [{ '@type': 'AboutPage', url: SITE + '/about/', name: 'About Hiveworx', about: { '@id': ORG['@id'] } }, breadcrumb([['Home', SITE + '/'], ['About', SITE + '/about/']])] },
  ...sessions.map((s) => ({
    page: 'w-' + s.slug, session: s,
    desc: clip(s.summary || (s.about || [])[0]),
    image: s.image && s.image.src,
    ld: (url) => [sessionLd(s, url), breadcrumb([['Home', SITE + '/'], ['Workshops & talks', SITE + '/workshops/'], [s.title, url]])],
  })),
];

/* pages switched off in sessions.json ("hiddenPages": ["mentors"]) are not built or listed */
const hidden = new Set(data.hiddenPages || []);
for (let i = pages.length - 1; i >= 0; i--) if (hidden.has(pages[i].page)) { console.log('  (hidden: /' + pagePath(pages[i].page) + ')'); pages.splice(i, 1); }

/* ---------- turn one rendered view into a finished page ---------- */
function finish(html, { page, base, url, title, desc, image, ld, noindex }) {
  const view = page.startsWith('w-') ? 'detail' : page;
  for (const [k, id] of Object.entries(VIEWS)) if (k !== view) html = removeDiv(html, id);
  html = html.replace(new RegExp(`(<div id="${VIEWS[view]}")\\s+hidden(="")?`), '$1');

  html = html.replace(/<html\b([^>]*)>/, (m, a) => `<html${a.replace(/\s(data-base|data-page)="[^"]*"/g, '')} data-base="${base}" data-page="${page}">`);
  /* images, styles and scripts sit at the site root */
  html = html.replace(/\b(src|href)="((?:css|js|images|gallery)\/[^"]*|sessions\.json)"/g, (m, a, p) => `${a}="${base}${p}"`);
  /* one-page #links become real addresses (only on <a>: <use href="#logo"> stays) */
  html = html.replace(/<a\b[^>]*?\shref="#([^"]+)"/g, (m, r) => m.replace(`href="#${r}"`, `href="${link(r, page, base)}"`));

  const head = [
    `<title>${escText(title)}</title>`,
    `<meta name="description" content="${escAttr(desc)}">`,
    noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">', '<meta property="og:site_name" content="Hiveworx">',
    `<meta property="og:title" content="${escAttr(title)}">`, `<meta property="og:description" content="${escAttr(desc)}">`,
    `<meta property="og:url" content="${url}">`, `<meta property="og:image" content="${abs(image)}">`,
    '<meta property="og:locale" content="en_GB">', '<meta name="twitter:card" content="summary_large_image">',
  ].join('\n');
  /* drop the source's own tags for these, then write this page's set after the charset/viewport */
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta\s+name="(description|robots|twitter:[^"]+)"[^>]*>\s*/g, '')
    .replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/g, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/g, '');
  html = html.replace(/(<meta name="viewport"[^>]*>)/, `$1\n${head}`);
  if (ld) {
    const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, ...ld] }).replace(/</g, '\\u003c');
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${json}</script>`);
  }
  return /^\s*<!doctype/i.test(html) ? html : '<!doctype html>\n' + html;
}

/* ---------- build ---------- */
const server = await serve(ROOT);
const src = `http://127.0.0.1:${server.port}/index.html`;
/* empty dist/ rather than delete it, so a local server running inside it keeps working */
fs.mkdirSync(DIST, { recursive: true });
for (const e of fs.readdirSync(DIST)) fs.rmSync(path.join(DIST, e), { recursive: true, force: true });
const built = [];
try {
  for (const p of pages) {
    const rel = pagePath(p.page);
    const depth = rel.split('/').filter(Boolean).length;
    const base = depth ? '../'.repeat(depth) : './';
    const url = SITE + '/' + rel;
    const raw = await dumpDom(p.page === 'home' ? src : `${src}#${p.page}`);
    const title = (raw.match(/<title>([\s\S]*?)<\/title>/) || [])[1].replace(/&amp;/g, '&');
    const html = finish(raw, { page: p.page, base, url, title, desc: p.desc, image: p.image || DEFAULT_IMAGE, ld: p.ld ? p.ld(url) : null });
    const out = path.join(DIST, rel, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    built.push({ url, title, desc: p.desc });
    console.log('  ' + ('/' + rel).padEnd(44) + title);
  }

  /* 404: the home page's header and footer around a short message; root-relative, since it is
     served at whatever address was missing */
  let nf = await dumpDom(src);
  nf = removeDiv(nf, 'view-home');
  nf = nf.replace(/(<main\b[^>]*>)/, `$1<section class="page-head"><div class="wrap notfound"><h1>This page doesn’t exist.</h1>` +
    `<p>It may have moved, or the address has a typo. Try the program instead.</p>` +
    `<a class="btn btn-primary" href="#workshops">See all workshops <span class="arr">→</span></a></div></section>`);
  nf = finish(nf, { page: '404', base: '/', url: SITE + '/404.html', title: 'Page not found · Hiveworx', desc: HOME_DESC, image: DEFAULT_IMAGE, ld: null, noindex: true });
  fs.writeFileSync(path.join(DIST, '404.html'), nf);
} finally {
  server.close();
}

/* ---------- assets: everything the pages reference ---------- */
const copy = (rel) => { const to = path.join(DIST, rel); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(ROOT, rel), to); };
['css/styles.css', 'js/main.js', 'js/motion.js', 'sessions.json'].forEach(copy);
const all = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + fs.readFileSync(path.join(ROOT, 'sessions.json'), 'utf8') + DEFAULT_IMAGE;
new Set(all.match(/(?:images|gallery)\/[\w.@-]+\.(?:webp|png|jpe?g|svg|gif|avif)/g)).forEach((rel) => {
  if (fs.existsSync(path.join(ROOT, rel))) copy(rel); else console.warn('  missing asset: ' + rel);
});

/* ---------- sitemap + robots ---------- */
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  built.map((b) => `  <url><loc>${b.url}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

/* ---------- checks: every internal link and image points at a file in dist/ ---------- */
let problems = 0;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  const from = file.endsWith('404.html') ? DIST : path.dirname(file);
  for (const [, ref] of html.matchAll(/\s(?:src|href)="([^"#:]+)(?:#[^"]*)?"/g)) {
    if (!ref || ref.startsWith('//')) continue;
    let target = ref.startsWith('/') ? path.join(DIST, ref) : path.resolve(from, ref);
    if (ref.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) { problems++; console.warn(`  broken: ${path.relative(DIST, file)} → ${ref}`); }
  }
}
console.log(`\nBuilt ${built.length} pages + 404 into dist/. ${problems ? problems + ' broken references.' : 'All internal links and images resolve.'}`);
if (problems) process.exitCode = 1;
