# Five Years of Us

A single-page static site. There's no build step: open `index.html` in a browser to preview it.

- `public/index.html`: all text and photo slots
- `public/styles.css`, `public/script.js`: look and behaviour
- `public/photos/`: optimised WebP photos (hero, wedding, years, ahead, letter)
- `public/music/our-song.mp3`: optional. The play button only appears when this file exists.
- `tools/optimize_photos.py`: resizes photos, converts them to WebP and strips metadata, including GPS location

Hosting: Cloudflare Pages connected to this repo. No build command; the site is served from `public/` (Pages output directory `public`, or `npx wrangler deploy` for Workers).
