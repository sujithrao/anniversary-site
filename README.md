# Five Years of Us

A single-page static site. There's no build step: open `index.html` in a browser to preview it.

- `index.html`: all text and photo slots
- `styles.css`, `script.js`: look and behaviour
- `photos/`: optimised WebP photos (hero, wedding, years, ahead, letter)
- `music/our-song.mp3`: optional. The play button only appears when this file exists.
- `tools/optimize_photos.py`: resizes photos, converts them to WebP and strips metadata, including GPS location

Hosting: Cloudflare Pages connected to this repo. There's no build command, and the output directory is `/`.
