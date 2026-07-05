# isaiahbuchberger — personal site

A Jekyll site styled after a terminal/character-grid aesthetic: ASCII-art hero,
monospace index lists, text-scramble nav. Deployable on GitHub Pages with no
build configuration.

## Structure

| Path | Purpose |
|---|---|
| `_layouts/default.html` | Shared shell: head, nav, footer, scripts |
| `_layouts/post.html` | Blog post layout |
| `_includes/home.html` | Homepage content (used by `/` and `/light.html`) |
| `_data/index.yml` | Entries in the numbered homepage index |
| `_data/documents.yml` | Downloads listed on `/papers/` |
| `_posts/` | Blog posts (`YYYY-MM-DD-title.md`) |
| `assets/css/main.css` | All styles |
| `assets/js/main.js` | ASCII hero, scramble effect, clock |
| `assets/docs/` | CV and paper PDFs |

## Common tasks

**Write a blog post** — add `_posts/2026-07-10-my-title.md`:

```markdown
---
layout: post
title: "My title"
category: Notes
---

Text here. Markdown works: headings, lists, blockquotes, links, code.
```

It appears automatically at `/writing/` and in the RSS feed (`/feed.xml`).

**Add your CV or a paper** — drop the PDF in `assets/docs/`, then add an entry
to `_data/documents.yml`. It appears at `/papers/` as a download link.

**Edit the homepage index** — edit `_data/index.yml`. Numbering is automatic.

**Light version** — `/light.html` is the same homepage forced to light mode.
It shares `_includes/home.html` with `/`, so they can't drift apart.

## Run locally

```sh
bundle install        # first time only
bundle exec jekyll serve
# → http://localhost:4000
```

## Deploy to GitHub Pages

1. Create a repo named `<username>.github.io` (user site, served at the root)
   — or any repo name for a project site served at `/<repo>/`.
2. For a project site, set `baseurl: "/<repo>"` and `url:` in `_config.yml`.
   For a user site leave `baseurl: ""`.
3. Push, then in the repo: Settings → Pages → Source: Deploy from a branch →
   `main` / root.
4. The site builds automatically on every push.
