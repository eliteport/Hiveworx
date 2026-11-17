/* Two languages: English at /…, Portuguese (Portugal) at /pt/…, with the same page addresses after the prefix.
   A page knows its language from its own address, so components only need Astro.url:
     const lang = langOf(Astro.url);  const T = tr(lang);  T('About', 'Sobre')  */
export type Lang = 'en' | 'pt';
export const LANGS: Lang[] = ['en', 'pt'];
export const HTML_LANG: Record<Lang, string> = { en: 'en', pt: 'pt-PT' };
export const OG_LOCALE: Record<Lang, string> = { en: 'en_GB', pt: 'pt_PT' };

export const langOf = (url: URL | string): Lang => {
  const p = typeof url === 'string' ? url : url.pathname;
  return p === '/pt' || p.startsWith('/pt/') ? 'pt' : 'en';
};

/* "pick the English or the Portuguese text" */
export const tr = (lang: Lang) => <A, B = A>(en: A, pt: B): A | B => (lang === 'pt' ? pt : en);

/* a site address in a language: href('/about/', 'pt') → '/pt/about/'; '/#contact' → '/pt/#contact'.
   Outside links, mailto: and in-page #anchors stay as they are. */
export function href(path: string, lang: Lang) {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const base = stripLang(path);
  return lang === 'pt' ? '/pt' + base : base;
}
/* '/pt/about/' → '/about/' */
export function stripLang(path: string) {
  return path === '/pt' ? '/' : path.startsWith('/pt/') ? path.slice(3) : path;
}

/* "2026-10-06" → "ter. 6 out. 2026" (Intl's own Portuguese short date is all digits) */
const WD = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
const MO = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
export function ptDate(iso: string) {
  const d = new Date(iso + 'T12:00:00Z');
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
