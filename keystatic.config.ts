/* Keystatic: the editing screen at /keystatic.
   Locally (npm run dev) edits save straight into src/content/. On the live site, editors sign in
   through Keystatic Cloud (free for up to 3 people) and each save becomes a commit on GitHub. */
import { config, collection, singleton, fields } from '@keystatic/core';

const ICONS = ['mentor', 'tools', 'materials', 'notes', 'sound', 'headphones', 'takehome', 'coffee', 'community',
  'type', 'print', 'idea', 'laptop', 'clock', 'phone', 'quiet', 'steps', 'calm'];
const iconField = fields.select({ label: 'Icon', options: ICONS.map((v) => ({ label: v, value: v })), defaultValue: 'idea' });
const noteList = (label: string) => fields.array(
  fields.object({ icon: iconField, text: fields.text({ label: 'Text', multiline: true }) }),
  { label, itemLabel: (p) => p.fields.text.value || 'New note' },
);
const paragraphs = (label: string, description?: string) => fields.array(
  fields.text({ label: 'Paragraph', multiline: true }),
  { label, description, itemLabel: (p) => (p.value || 'New paragraph').slice(0, 60) },
);

export default config({
  storage: import.meta.env.PROD ? { kind: 'cloud' } : { kind: 'local' },
  cloud: { project: 'hiveworx-team/hiveworx' },
  ui: {
    brand: { name: 'Hiveworx' },
    navigation: {
      'Workshops & talks': ['sessions', 'home'],
      People: ['mentors'],
      Settings: ['site', 'defaults'],
    },
  },

  collections: {
    sessions: collection({
      label: 'Workshops & talks',
      slugField: 'title',
      path: 'src/content/sessions/*',
      format: { data: 'json' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: { label: 'Web address', description: 'Used in the page address: /workshops/<this>/. Changing it changes the link.' },
        }),
        format: fields.select({ label: 'Format', options: [{ label: 'Workshop', value: 'workshop' }, { label: 'Talk', value: 'talk' }], defaultValue: 'workshop' }),
        formatLabel: fields.text({ label: 'Format label', description: 'Shown on the page, e.g. "Hands-on workshop", "3-session workshop", "Online talk".' }),
        discipline: fields.text({ label: 'Discipline', description: 'e.g. Typography, Sound + Visual, Image + Word. Sessions with the same discipline share a filter.' }),
        mentor: fields.relationship({ label: 'Mentor', collection: 'mentors' }),

        date: fields.date({ label: 'Date', description: 'Leave empty while it is not set: the site shows "To be announced".' }),
        time: fields.text({ label: 'Start time', description: 'e.g. 16:00. Empty shows "To be announced".' }),
        duration: fields.text({ label: 'Duration', description: 'e.g. 2 hours 30 minutes' }),
        location: fields.text({ label: 'Location', description: 'e.g. Hiveworx – Design school, or Online' }),
        level: fields.text({ label: 'Level', description: 'e.g. All levels, Absolute beginner' }),
        price: fields.text({ label: 'Price', description: 'e.g. Free, or €40. Empty shows "TBD" on cards.' }),
        priceNote: fields.text({ label: 'Price note', description: 'e.g. registration required' }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Registration open', value: 'open' },
            { label: 'Registration of interest', value: 'interest' },
            { label: 'Sold out', value: 'soldout' },
          ],
          defaultValue: 'interest',
        }),
        bookUrl: fields.url({ label: 'Registration link', description: 'e.g. the Luma page. With a date, card buttons go straight here.' }),

        image: fields.image({ label: 'Image', directory: 'public/images/sessions', publicPath: '/images/sessions/' }),
        imageAlt: fields.text({ label: 'Image description', description: 'What the image shows, for people using screen readers and for Google.' }),
        imageFocus: fields.text({ label: 'Image crop point', description: 'Which part stays in view when cropped, e.g. "50% 50%" (centre) or "50% 20%" (near the top). Empty = near the top.' }),

        summary: fields.text({ label: 'Intro', multiline: true, description: 'Opening paragraph. Optional: without it the first paragraph below is used.' }),
        about: paragraphs('About this session'),
        forWho: fields.text({ label: 'Who it’s for', multiline: true }),
        levelNote: fields.text({ label: 'Level note', multiline: true }),
        explore: fields.array(
          fields.object({ title: fields.text({ label: 'Topic' }), text: fields.text({ label: 'Description (optional)', multiline: true }) }),
          { label: 'What you’ll explore', itemLabel: (p) => p.fields.title.value || 'New topic' },
        ),
        outcomeLabel: fields.text({ label: 'Outcome heading', description: 'Default: "End of day outcome". e.g. "What you’ll take away".' }),
        outcome: paragraphs('Outcome'),
        practical: fields.conditional(
          fields.select({
            label: 'Practical notes section',
            options: [
              { label: 'Use the standard notes (Settings → Practical notes)', value: 'default' },
              { label: 'Custom notes for this session', value: 'custom' },
              { label: 'Don’t show the section', value: 'none' },
            ],
            defaultValue: 'default',
          }),
          {
            default: fields.empty(),
            none: fields.empty(),
            custom: fields.object({
              label: fields.text({ label: 'Small heading', description: 'e.g. Good to know' }),
              title: fields.text({ label: 'Title', description: 'Can include <span class="v">…</span> for the violet part.' }),
              note: fields.text({ label: 'Handwritten closing note' }),
              items: noteList('Notes'),
            }),
          },
        ),
        metaDescription: fields.text({ label: 'Google description', multiline: true, description: 'Optional, about 150 characters. Without it the intro is used.' }),
      },
    }),

    mentors: collection({
      label: 'Mentors',
      slugField: 'name',
      path: 'src/content/mentors/*',
      format: { data: 'json' },
      columns: ['name', 'role'],
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        role: fields.text({ label: 'Role', description: 'e.g. Film critic, journalist and lecturer' }),
        initials: fields.text({ label: 'Initials' }),
        photo: fields.image({ label: 'Portrait', directory: 'public/images/mentors', publicPath: '/images/mentors/' }),
        short: fields.text({ label: 'Short bio (mentor card)', multiline: true }),
        bio: paragraphs('Full bio (session pages)'),
        listed: fields.checkbox({ label: 'Show on the Mentors page', defaultValue: true }),
        order: fields.integer({ label: 'Order on the Mentors page', defaultValue: 99, description: '1 comes first.' }),
      },
    }),
  },

  singletons: {
    home: singleton({
      label: 'Home page: next up & pinned',
      path: 'src/content/home',
      format: { data: 'json' },
      schema: {
        upcoming: fields.relationship({ label: 'Next up', collection: 'sessions', description: 'The big card under "Upcoming" on the home page.' }),
        pinned: fields.array(fields.relationship({ label: 'Session', collection: 'sessions' }), {
          label: 'Also on the home page',
          description: 'The home page shows 3 cards: next up first, then these (earliest date first).',
          itemLabel: (p) => p.value || 'Pick a session',
        }),
      },
    }),
    site: singleton({
      label: 'Site settings',
      path: 'src/content/site',
      format: { data: 'json' },
      schema: { mentorsPage: fields.checkbox({ label: 'Show the Mentors page', description: 'Off: the menu shows "Mentors" with a "soon" note and the page is not published.', defaultValue: false }) },
    }),
    defaults: singleton({
      label: 'Practical notes (standard)',
      path: 'src/content/defaults',
      format: { data: 'json' },
      schema: {
        label: fields.text({ label: 'Small heading' }),
        title: fields.text({ label: 'Title', description: 'Can include <span class="v">…</span> for the violet part.' }),
        note: fields.text({ label: 'Handwritten closing note' }),
        items: noteList('Notes'),
      },
    }),
  },
});
