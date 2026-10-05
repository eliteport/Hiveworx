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

## Edit and publish

Branches: `main` is the live site (protected: changes arrive only through a merged pull request, and
only when the Vercel build passes). `drafts` is where content edits wait.

1. **Edit** at https://www.hiveworx.com/keystatic/branch/drafts (sign in with Keystatic Cloud,
   team `hiveworx-team`; free for up to 3 people). Check the top-left says **drafts** before saving.
2. **Preview** at https://hiveworx-git-drafts-hiveworx.vercel.app, about a minute after a save
   (Vercel login; editors get access through an access request on the preview).
3. **Publish**: open https://github.com/eliteport/Hiveworx/compare/main...drafts, click
   **Create pull request**, wait for the green Vercel check, then **Merge pull request → Confirm merge**.
   Vercel publishes www.hiveworx.com about a minute later. Don't delete the `drafts` branch.
4. **Keep drafts current**: after merging, if a later pull request says the branch is out of date,
   click **Update branch** on it, so the next edits start from what is live.

Code and design changes use their own short-lived branch and pull request in the same way.
Vercel builds the site from GitHub (`vercel.json`: framework Astro, `npm run build`).

## Adding things later

- A field on sessions: add it in `keystatic.config.ts` (schema), map it in `src/lib/content.ts`, show it in a component.
- A new page type (e.g. Events): add a collection in `keystatic.config.ts`, a loader in `content.ts`, pages under `src/pages/events/`.
- Share image: `node tools/make-images.mjs share` (needs Google Chrome); PNG → WebP: `node tools/make-images.mjs webp <file.png>`.
