/* sitemap.xml: every published page (the Mentors page only while it is switched on) */
import type { APIRoute } from 'astro';
import { getContent } from '../lib/content';
import { SITE } from '../lib/seo';

export const GET: APIRoute = async () => {
  const { sessions, mentorsPage } = await getContent();
  const today = new Date().toISOString().slice(0, 10);
  const paths = ['/', '/workshops/', '/about/', ...(mentorsPage ? ['/mentors/'] : []), ...sessions.map((s) => `/workshops/${s.slug}/`), '/privacy/'];
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + paths.map((p) => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
