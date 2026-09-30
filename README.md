# Hiveworx website

Astro site with a Keystatic editing screen. Pages are built as static HTML; only the editing screen
(`/keystatic`) runs on the server.

```
src/content/            everything editors change (written by Keystatic, plain JSON)
  sessions/<slug>.json    one workshop or talk each → its card and /workshops/<slug>/
  mentors/<slug>.json     one mentor each
  home.json               "next up" + sessions pinned to the home page
  site.json               switches (e.g. show the Mentors page)
  defaults.json           standard practical notes for session pages
keystatic.config.ts     the editing forms (fields, labels, help texts)
src/pages/              pages: /, /about/, /workshops/, /workshops/<slug>/, /mentors/, 404, sitemap.xml
src/components/         cards, "next up", menu; static/ holds the hand-written page sections
src/lib/                content loading (content.ts), titles + Google data (seo.ts), icons
public/                 css, js (site.js, motion.js), images, robots.txt
```

## Work locally

    npm install
    npm run dev          # http://localhost:4321  ·  editing screen: http://localhost:4321/keystatic

Locally, Keystatic saves straight into `src/content/`. Check the result on localhost, then commit.

## Publish

Vercel builds the site from GitHub (framework preset: Astro; build command `astro build`).
On the live site, editors sign in to `/keystatic` through Keystatic Cloud (free for up to 3 people);
each save becomes a commit on GitHub, which Vercel then publishes.

## Adding things later

- A field on sessions: add it in `keystatic.config.ts` (schema), map it in `src/lib/content.ts`, show it in a component.
- A new page type (e.g. Events): add a collection in `keystatic.config.ts`, a loader in `content.ts`, pages under `src/pages/events/`.
- Share image: `node tools/make-images.mjs share` (needs Google Chrome); PNG → WebP: `node tools/make-images.mjs webp <file.png>`.
