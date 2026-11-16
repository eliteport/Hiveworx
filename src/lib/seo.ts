/* Page titles, descriptions and structured data (schema.org) for Google. */
import type { Session, Mentor } from './content';
import type { Lang } from './i18n';

export const SITE = 'https://www.hiveworx.com';   // Vercel serves the site on www (hiveworx.com forwards here)
export const abs = (p: string) => SITE + '/' + p.replace(/^\.?\//, '');
export const DEFAULT_IMAGE = '/images/og-hiveworx.png';

const TITLES_EN = {
  home: 'Hiveworx · Hands-on design workshops in Lisbon',
  about: 'About Hiveworx · An experience-based design school in Lisbon',
  mentors: 'Mentors · Practitioners who teach at Hiveworx, Lisbon',
  workshops: 'Design workshops & talks in Lisbon · Hiveworx',
  privacy: 'Privacy policy · Hiveworx',
};
const DESCRIPTIONS_EN = {
  home: 'An experience-based design school in Lisbon. Hands-on workshops and talks in design, sound, typography and film, taught by working practitioners, not professors.',
  workshops: 'Hands-on design workshops and talks in Lisbon: sound and visuals, typography, film, art and writing. Taught by practitioners, not professors. Open to anyone.',
  mentors: 'Meet the Hiveworx mentors: designers, artists, musicians and critics in Lisbon who teach through their own work and experience, not theory.',
  about: 'Hiveworx is an experience-based design school in Lisbon. Working practitioners teach hands-on workshops and talks, open to anyone, with no diplomas or entry requirements.',
  privacy: 'How Hiveworx handles personal data: Google Analytics only with your consent, contact form messages, workshop registrations, and your rights under the GDPR.',
};
export const TITLES: Record<Lang, typeof TITLES_EN> = {
  en: TITLES_EN,
  pt: {
    home: 'Hiveworx · Workshops práticos de design em Lisboa',
    about: 'Sobre a Hiveworx · Uma escola de design baseada na experiência, em Lisboa',
    mentors: 'Mentores · Profissionais que ensinam na Hiveworx, Lisboa',
    workshops: 'Workshops e palestras de design em Lisboa · Hiveworx',
    privacy: 'Política de privacidade · Hiveworx',
  },
};
export const DESCRIPTIONS: Record<Lang, typeof DESCRIPTIONS_EN> = {
  en: DESCRIPTIONS_EN,
  pt: {
    home: 'Escola de design baseada na experiência, em Lisboa. Workshops práticos e palestras de design, som, tipografia e cinema, orientados por profissionais no ativo.',
    workshops: 'Workshops práticos e palestras de design em Lisboa: som e imagem, tipografia, cinema, arte e escrita. Orientados por profissionais no ativo. Abertos a todos.',
    mentors: 'Conhece os mentores da Hiveworx: designers, artistas, músicos e críticos que ensinam a partir do seu próprio trabalho e experiência, não da teoria.',
    about: 'Escola de design baseada na experiência, em Lisboa. Profissionais no ativo orientam workshops e palestras abertos a todos, sem diplomas nem requisitos.',
    privacy: 'Como a Hiveworx trata dados pessoais: Google Analytics só com consentimento, mensagens de contacto, inscrições em workshops e os teus direitos (RGPD).',
  },
};

/* "Drawing Letters · Workshop in Lisbon · Hiveworx"; titles that already say workshop/talk just add the city.
   Portuguese: "Desenhar letras · Workshop em Lisboa · Hiveworx" */
export function sessionTitle(s: Session, lang: Lang = 'en') {
  const pt = lang === 'pt';
  if (s.online) return `${s.title} · ${pt ? `${s.typeLabel} online` : `Online ${s.typeLabel.toLowerCase()}`} · Hiveworx`;
  const says = new RegExp(`\\b${s.typeLabel}\\b`, 'i').test(s.title);
  const city = pt ? 'em Lisboa' : 'in Lisbon';
  return `${s.title}${says ? ` ${city}` : ` · ${s.typeLabel} ${city}`} · Hiveworx`;
}

export function clip(text: string, max = 155) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,;:.\s]+$/, '') + '…';
}
export const sessionDescription = (s: Session, max = 155) => clip(s.metaDescription || s.summary || s.about[0] || '', max);

export const ORG = {
  '@type': 'EducationalOrganization', '@id': SITE + '/#org', name: 'Hiveworx', url: SITE + '/', email: 'hello@hiveworx.com',
  logo: SITE + '/images/og-hiveworx.png', description: DESCRIPTIONS.home,
  founder: { '@type': 'Person', name: 'Temo K. Dolidze' },
  address: { '@type': 'PostalAddress', addressLocality: 'Lisbon', addressCountry: 'PT' },
  sameAs: ['https://www.instagram.com/hiveworx/'],
};
export const breadcrumb = (items: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
});

/* Lisbon's UTC offset on a date (+01:00 in summer time, +00:00 in winter) */
function lisbonOffset(dateISO: string) {
  const name = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Lisbon', timeZoneName: 'longOffset' })
    .formatToParts(new Date(dateISO + 'T12:00:00Z')).find((p) => p.type === 'timeZoneName')!.value;
  return name === 'GMT' ? '+00:00' : name.replace('GMT', '');
}

export function sessionLd(s: Session, url: string) {
  const description = sessionDescription(s, 300);
  const image = s.image ? [abs(s.image.src)] : undefined;
  if (!s.dateISO) return { '@type': 'Course', name: s.title, description, url, image, provider: { '@id': ORG['@id'] }, inLanguage: 'en' };
  const tm = s.time.match(/^(\d{1,2}):(\d{2})$/);
  const off = lisbonOffset(s.dateISO);
  const startDate = tm ? `${s.dateISO}T${tm[1].padStart(2, '0')}:${tm[2]}:00${off}` : s.dateISO;
  let endDate: string | undefined;
  const dm = s.duration.match(/(\d+)\s*hours?(?:\s*(\d+)\s*min)?/i);
  if (tm && dm) {
    const mins = +tm[1] * 60 + +tm[2] + +dm[1] * 60 + (+dm[2] || 0);
    if (mins < 24 * 60) endDate = `${s.dateISO}T${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:00${off}`;
  }
  const ev: Record<string, unknown> = {
    '@type': 'Event', name: s.title, description, url, image, startDate, endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: `https://schema.org/${s.online ? 'Online' : 'Offline'}EventAttendanceMode`,
    location: s.online ? { '@type': 'VirtualLocation', url }
      : { '@type': 'Place', name: s.location || 'Hiveworx – Design school', address: { '@type': 'PostalAddress', addressLocality: 'Lisbon', addressCountry: 'PT' } },
    organizer: { '@id': ORG['@id'] },
    performer: s.mentor ? { '@type': 'Person', name: s.mentor.name } : undefined,
    inLanguage: 'en',
  };
  const price = /free/i.test(s.price) ? '0' : ((s.price.match(/\d+(?:[.,]\d+)?/) || [])[0] || '').replace(',', '.');
  if (price) ev.offers = { '@type': 'Offer', price, priceCurrency: 'EUR', availability: `https://schema.org/${s.soldOut ? 'SoldOut' : 'InStock'}`, url: s.bookUrl || url };
  return ev;
}

export function mentorsLd(mentors: Mentor[]) {
  return {
    '@type': 'ItemList',
    itemListElement: mentors.map((m, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: { '@type': 'Person', name: m.name, jobTitle: m.role || undefined, image: m.photo ? abs(m.photo) : undefined, worksFor: { '@id': ORG['@id'] } },
    })),
  };
}
