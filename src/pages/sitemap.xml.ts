/* sitemap.xml: every published page in English and Portuguese (the Mentors page only while it is switched on),
   each with its other-language twin so Google can match them */
import type { APIRoute } from 'astro';
import { getContent } from '../lib/content';
import { SITE } from '../lib/seo';

export const GET: APIRoute = async () => {
  const { sessions, mentorsPage } = await getContent();
  const today = new Date().toISOString().slice(0, 10);
  const paths = ['/', '/workshops/', '/about/', ...(mentorsPage ? ['/mentors/'] : []), ...sessions.filter((s) => !s.hidden).map((s) => `/workshops/${s.slug}/`), '/privacy/'];
  const links = (p: string) =>
    `<xhtml:link rel="alternate" hreflang="en" href="${SITE}${p}"/><xhtml:link rel="alternate" hreflang="pt-PT" href="${SITE}/pt${p}"/>`;
  const urls = paths.flatMap((p) => [p, '/pt' + p]).map((loc) => {
    const base = loc.startsWith('/pt/') ? loc.slice(3) : loc;
    return `  <url><loc>${SITE}${loc}</loc><lastmod>${today}</lastmod>${links(base)}</url>`;
  });
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + urls.join('\n') + '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
