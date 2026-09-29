# Hiveworx website

Static site (HTML + CSS + vanilla JS, no build step).

```
index.html        page markup (home, about, workshops list, session detail views)
css/styles.css    all styles and design tokens (:root variables)
js/main.js        nav, tabs, hash router, filters, lightbox, counters
sessions.json     workshop/talk data — edit this to add or change sessions
gallery/          gallery photos
```

## Run locally

`sessions.json` is loaded with `fetch`, so open the site through a local server, not `file://`:

    ruby -run -e httpd . -p 8000        (or: python3 -m http.server 8000)

then visit http://localhost:8000.

## Build and deploy

The source is a one-page site (views switch by `#hash`), which is handy for editing and previews but
invisible to search engines. Before publishing, build the real multi-page site:

    node tools/build.mjs

It needs Node and Google Chrome (set `CHROME=/path/to/chrome` if Chrome lives elsewhere) and writes
`dist/`:

```
/                              home
/about/  /workshops/  /mentors/
/workshops/<slug>/             one page per session in sessions.json
/404.html  /sitemap.xml  /robots.txt
```

Every page has its content already in the HTML, plus its own title, description, canonical address,
share preview (Open Graph) and structured data (Event for dated sessions, Course otherwise, breadcrumbs,
the organisation). Old `/#w-<slug>` links forward to the new addresses. The build ends by checking that
every internal link and image resolves.

**Re-run the build after any change** to `index.html`, `css/`, `js/` or `sessions.json`, then upload the
contents of `dist/` to the host (Netlify, Vercel, GitHub Pages, Cloudflare Pages…). The live address is
set at the top of `tools/build.mjs` (`SITE`).

Other tools:

    node tools/make-images.mjs share        # re-render images/og-hiveworx.png (default share image)
    node tools/make-images.mjs webp <png>   # convert a PNG to WebP with Chrome

## Single workshop page (`#w-<slug>`)

Every session in `sessions.json` gets its own page. Sections, top to bottom:
title + hero art with booking sticker → about / price / map + key facts → what's included →
gallery → testimonials → "Secure your seat" band → more workshops.

Per-session fields used by the page (all optional except the basics):

- `summary` – large intro sentence (falls back to the first `about` paragraph)
- `included` – list of `{ "icon", "text" }`; icons: mentor, tools, materials, notes, sound,
  headphones, takehome, coffee, community, type, print, idea
- `gallery` – list of `{ "src", "alt" }`
- `testimonials` – list of `{ "quote", "name", "role", "initials" }`
- `mapQuery` – what "Open in Maps" searches for (defaults to `location`)

Anything missing falls back to `defaults` at the top of `sessions.json`. The default testimonials are
marked `"placeholder": true`, which shows a "placeholder quotes" badge until you replace them.
