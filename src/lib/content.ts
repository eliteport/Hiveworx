/* Everything the pages show comes from here: Keystatic's files in src/content/, read at build time
   and shaped into what the components need. */
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

const reader = createReader(process.cwd(), keystaticConfig);

export type Note = { icon: string; text: string };
export type Practical = { label: string; title: string; note: string; items: Note[] };
export type Mentor = {
  slug: string; name: string; role: string; initials: string; photo: string | null;
  short: string; bio: string[]; listed: boolean; order: number;
};
export type Session = {
  slug: string; title: string; format: 'workshop' | 'talk'; typeLabel: 'Workshop' | 'Talk'; formatLabel: string;
  discipline: string; mentor: Mentor | null;
  dateISO: string | null; date: string; time: string; duration: string; location: string; level: string;
  price: string; priceNote: string; status: 'open' | 'interest' | 'soldout'; soldOut: boolean; bookUrl: string | null;
  image: { src: string; alt: string; focus: string } | null;
  summary: string; about: string[]; forWho: string; levelNote: string;
  explore: { title: string; text: string }[]; outcomeLabel: string; outcome: string[];
  practical: Practical | null; metaDescription: string; online: boolean;
};

const TBA = 'To be announced';
/* "2026-10-06" → "Tue 6 Oct 2026" */
export function displayDate(iso: string | null) {
  if (!iso) return TBA;
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(iso + 'T12:00:00Z')).replace(/,/g, '');
}

let cache: Promise<{ sessions: Session[]; mentors: Mentor[]; upcoming: string | null; pinned: string[]; mentorsPage: boolean; standard: Practical | null }> | null = null;

export function getContent() {
  if (cache) return cache;
  cache = (async () => {
    const [rawMentors, rawSessions, home, site, defaults] = await Promise.all([
      reader.collections.mentors.all(), reader.collections.sessions.all(),
      reader.singletons.home.read(), reader.singletons.site.read(), reader.singletons.defaults.read(),
    ]);
    const mentors: Mentor[] = rawMentors.map(({ slug, entry: m }) => ({
      slug, name: m.name, role: m.role, initials: m.initials, photo: m.photo, short: m.short,
      bio: [...m.bio], listed: m.listed, order: m.order ?? 99,
    }));
    const bySlug = new Map(mentors.map((m) => [m.slug, m]));
    const std: Practical | null = defaults && defaults.items.length
      ? { label: defaults.label, title: defaults.title, note: defaults.note, items: defaults.items.map((i) => ({ ...i })) } : null;

    const sessions: Session[] = rawSessions.map(({ slug, entry: s }) => {
      const practical = s.practical.discriminant === 'none' ? null
        : s.practical.discriminant === 'custom'
          ? { label: s.practical.value.label, title: s.practical.value.title, note: s.practical.value.note, items: s.practical.value.items.map((i) => ({ ...i })) }
          : std;
      return {
        slug, title: s.title, format: s.format, typeLabel: s.format === 'talk' ? 'Talk' : 'Workshop', formatLabel: s.formatLabel,
        discipline: s.discipline, mentor: s.mentor ? bySlug.get(s.mentor) ?? null : null,
        dateISO: s.date, date: displayDate(s.date), time: s.time || TBA, duration: s.duration, location: s.location, level: s.level,
        price: s.price, priceNote: s.priceNote, status: s.status, soldOut: s.status === 'soldout', bookUrl: s.bookUrl,
        image: s.image ? { src: s.image, alt: s.imageAlt, focus: s.imageFocus } : null,
        summary: s.summary, about: [...s.about], forWho: s.forWho, levelNote: s.levelNote,
        explore: s.explore.map((e) => ({ ...e })), outcomeLabel: s.outcomeLabel, outcome: [...s.outcome],
        practical, metaDescription: s.metaDescription, online: /^online$/i.test(s.location.trim()),
      };
    });
    return {
      sessions: sessions.sort(byDate), mentors, upcoming: home?.upcoming ?? null,
      pinned: (home?.pinned ?? []).filter(Boolean) as string[], mentorsPage: site?.mentorsPage ?? false, standard: std,
    };
  })();
  return cache;
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

export const sessionUrl = (s: { slug: string }) => `/workshops/${s.slug}/`;
