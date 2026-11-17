/* Everything the pages show comes from here: Keystatic's files in src/content/, read at build time
   and shaped into what the components need. */
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';
import { type Lang, ptDate } from './i18n';

const reader = createReader(process.cwd(), keystaticConfig);

/* the language a session is taught in, written in the page's own language */
const LANGUAGE: Record<string, Record<Lang, string>> = {
  en: { en: 'English', pt: 'Inglês' },
  pt: { en: 'Portuguese', pt: 'Português' },
  'en-pt': { en: 'English and Portuguese', pt: 'Inglês e português' },
};

export type Note = { icon: string; text: string };
export type Practical = { label: string; title: string; note: string; items: Note[] };
export type Mentor = {
  slug: string; name: string; role: string; initials: string; photo: string | null;
  short: string; bio: string[]; listed: boolean; order: number;
};
export type Session = {
  slug: string; title: string; format: 'workshop' | 'talk'; typeLabel: 'Workshop' | 'Talk' | 'Palestra'; formatLabel: string;
  discipline: string; mentor: Mentor | null;
  dateISO: string | null; date: string; time: string; duration: string; location: string; level: string; language: string;
  price: string; priceNote: string; status: 'open' | 'interest' | 'soldout'; soldOut: boolean; bookUrl: string | null;
  image: { src: string; alt: string; focus: string } | null;
  summary: string; about: string[]; forWho: string; levelNote: string;
  explore: { title: string; text: string }[]; outcomeLabel: string; outcome: string[];
  practical: Practical | null; metaDescription: string; online: boolean;
};

export const TBA_TEXT: Record<Lang, string> = { en: 'To be announced', pt: 'A anunciar' };
/* "2026-10-06" → "Tue 6 Oct 2026" (Portuguese: "ter. 6 out. 2026") */
export function displayDate(iso: string | null, lang: Lang = 'en') {
  if (!iso) return TBA_TEXT[lang];
  if (lang === 'pt') return ptDate(iso);
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(iso + 'T12:00:00Z')).replace(/,/g, '');
}

type Content = { sessions: Session[]; mentors: Mentor[]; upcoming: string | null; pinned: string[]; mentorsPage: boolean; standard: Practical | null };
const cache: Partial<Record<Lang, Promise<Content>>> = {};

/* Portuguese: each entry's "Portuguese version" fields (Keystatic), falling back to the English text where one is empty */
const or = (pt: string | null | undefined, en: string) => (pt && pt.trim() ? pt : en);
const orList = <T,>(pt: readonly T[] | undefined, en: T[]) => (pt && pt.length ? [...pt] : en);
/* a few values that are the same everywhere get translated automatically when their Portuguese field is empty */
const PT_WORDS: Record<string, string> = {
  'To be announced': 'A anunciar', 'Free': 'Gratuito', 'Online': 'Online', 'All levels': 'Todos os níveis',
  'registration required': 'inscrição obrigatória', 'Workshop': 'Workshop', 'Hands-on workshop': 'Workshop prático',
};
const auto = (pt: string | null | undefined, en: string) => or(pt, PT_WORDS[en.trim()] ?? en);

export function getContent(lang: Lang = 'en'): Promise<Content> {
  /* build: read once and share; local preview (npm run dev): read fresh so edits show on reload */
  if (cache[lang] && !import.meta.env.DEV) return cache[lang]!;
  const P = lang === 'pt';
  return (cache[lang] = (async () => {
    const [rawMentors, rawSessions, home, site, defaults] = await Promise.all([
      reader.collections.mentors.all(), reader.collections.sessions.all(),
      reader.singletons.home.read(), reader.singletons.site.read(), reader.singletons.defaults.read(),
    ]);
    const mentors: Mentor[] = rawMentors.map(({ slug, entry: m }) => ({
      slug, name: m.name, role: P ? or(m.pt?.role, m.role) : m.role, initials: m.initials, photo: m.photo,
      short: P ? or(m.pt?.short, m.short) : m.short,
      bio: P ? orList(m.pt?.bio, [...m.bio]) : [...m.bio], listed: m.listed, order: m.order ?? 99,
    }));
    const bySlug = new Map(mentors.map((m) => [m.slug, m]));
    const dp = P ? defaults?.pt : undefined;
    const std: Practical | null = defaults && defaults.items.length
      ? { label: or(dp?.label, defaults.label), title: or(dp?.title, defaults.title), note: or(dp?.note, defaults.note),
          items: orList(dp?.items, defaults.items as Note[]).map((i) => ({ ...i })) } : null;

    const sessions: Session[] = rawSessions.map(({ slug, entry: s }) => {
      /* x(english, portuguese): the text for this language */
      const p = P ? s.pt : undefined;
      const x = (en: string, pt?: string | null) => (P ? or(pt, en) : en);
      const xa = (en: string, pt?: string | null) => (P ? auto(pt, en) : en);
      const cv = s.practical.discriminant === 'custom' ? s.practical.value : null;
      const practical = s.practical.discriminant === 'none' ? null
        : cv
          ? { label: x(cv.label, p?.practicalLabel), title: x(cv.title, p?.practicalTitle), note: x(cv.note, p?.practicalNote),
              items: (P ? orList(p?.practicalItems, cv.items as Note[]) : cv.items).map((i) => ({ ...i })) }
          : std;
      return {
        slug, title: x(s.title, p?.title), format: s.format, typeLabel: s.format === 'talk' ? (P ? 'Palestra' : 'Talk') : 'Workshop',
        formatLabel: xa(s.formatLabel, p?.formatLabel),
        discipline: x(s.discipline, p?.discipline), mentor: s.mentor ? bySlug.get(s.mentor) ?? null : null,
        dateISO: s.date, date: displayDate(s.date, lang), time: s.time || TBA_TEXT[lang],
        duration: xa(s.duration, p?.duration), location: xa(s.location, p?.location), level: xa(s.level, p?.level),
        language: LANGUAGE[s.language]?.[lang] ?? LANGUAGE.en[lang],
        price: xa(s.price, null), priceNote: xa(s.priceNote, p?.priceNote), status: s.status, soldOut: s.status === 'soldout', bookUrl: s.bookUrl,
        image: s.image ? { src: s.image, alt: x(s.imageAlt, p?.imageAlt), focus: s.imageFocus } : null,
        summary: x(s.summary, p?.summary), about: P ? orList(p?.about, [...s.about]) : [...s.about],
        forWho: x(s.forWho, p?.forWho), levelNote: x(s.levelNote, p?.levelNote),
        explore: (P ? orList(p?.explore, s.explore as { title: string; text: string }[]) : s.explore).map((e) => ({ ...e })),
        outcomeLabel: x(s.outcomeLabel, p?.outcomeLabel), outcome: P ? orList(p?.outcome, [...s.outcome]) : [...s.outcome],
        practical, metaDescription: x(s.metaDescription, p?.metaDescription), online: /^online$/i.test(s.location.trim()),
      };
    });
    return {
      sessions: sessions.sort(byDate), mentors, upcoming: home?.upcoming ?? null,
      pinned: (home?.pinned ?? []).filter(Boolean) as string[], mentorsPage: site?.mentorsPage ?? false, standard: std,
    };
  })());
}

/* dated sessions first, earliest first; undated after, in their stored order */
export function byDate(a: Session, b: Session) {
  if (!a.dateISO && !b.dateISO) return 0;
  if (!a.dateISO) return 1;
  if (!b.dateISO) return -1;
  return a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0;
}

/* the three home-page cards: next up, then pinned sessions, then the rest; earliest first within each */
export function homeSessions(all: Session[], upcoming: string | null, pinned: string[]) {
  const rank = (s: Session) => (s.slug === upcoming ? 0 : pinned.includes(s.slug) ? 1 : 2);
  return all.slice().sort((a, b) => rank(a) - rank(b) || byDate(a, b)).slice(0, 3);
}

export const sessionUrl = (s: { slug: string }, lang: Lang = 'en') => `${lang === 'pt' ? '/pt' : ''}/workshops/${s.slug}/`;

/* today in Lisbon as "2026-10-07"; a session is past from the day after its date (undated ones never are).
   public/js/site.js repeats this check in the browser, so sessions also drop off between site rebuilds. */
export const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date());
export const isPast = (s: Session, today = todayISO()) => !!s.dateISO && s.dateISO < today;

/* Workshops & talks page: no past sessions, next up first, then by date */
export function listSessions(all: Session[], upcoming: string | null) {
  const today = todayISO();
  return all.filter((s) => !isPast(s, today)).sort((a, b) => Number(b.slug === upcoming) - Number(a.slug === upcoming) || byDate(a, b));
}

/* Workshops & talks page, "Past" section: sessions that already happened, most recent first */
export function pastSessions(all: Session[]) {
  const today = todayISO();
  return all.filter((s) => isPast(s, today)).sort((a, b) => byDate(b, a));
}
