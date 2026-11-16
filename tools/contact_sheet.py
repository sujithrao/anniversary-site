"""Number every photo in a folder, group by the date it was taken, and draw contact sheets.

Usage: python3 contact_sheet.py <photos folder> <output folder>
Writes <output>/index.csv (number, date, file) and one sheet JPG per year.
"""
import csv
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

try:  # iPhone HEIC photos
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

EXTS = {".jpg", ".jpeg", ".png", ".heic", ".webp", ".tif", ".tiff"}
THUMB, COLS, PAD = 300, 6, 12


def taken(path: Path, im: Image.Image) -> datetime:
    exif = im.getexif()
    raw = exif.get_ifd(0x8769).get(36867) or exif.get(306)  # DateTimeOriginal, then DateTime
    try:
        return datetime.strptime(str(raw), "%Y:%m:%d %H:%M:%S")
    except ValueError:
        return datetime.fromtimestamp(path.stat().st_mtime)


def main() -> int:
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    photos = []
    for p in sorted(src.rglob("*")):
        if p.suffix.lower() not in EXTS:
            continue
        with Image.open(p) as im:
            when = taken(p, im)
            th = ImageOps.exif_transpose(im).convert("RGB")
            th.thumbnail((THUMB, THUMB))
        photos.append((when, p, th))
    photos.sort(key=lambda x: x[0])

    font = ImageFont.load_default(size=28)
    groups = defaultdict(list)
    with open(out / "index.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["number", "taken", "file"])
        for n, (when, p, th) in enumerate(photos, 1):
            w.writerow([n, when.isoformat(sep=" "), p.relative_to(src)])
            groups[when.year].append((n, when, th))

    for year, items in sorted(groups.items()):
        rows = (len(items) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * (THUMB + PAD) + PAD, rows * (THUMB + PAD) + PAD), "white")
        draw = ImageDraw.Draw(sheet)
        for i, (n, when, th) in enumerate(items):
            x = PAD + (i % COLS) * (THUMB + PAD)
            y = PAD + (i // COLS) * (THUMB + PAD)
            sheet.paste(th, (x + (THUMB - th.width) // 2, y + (THUMB - th.height) // 2))
            label = f"{n}  {when:%d %b}"
            draw.rectangle([x, y, x + 150, y + 36], fill="black")
            draw.text((x + 6, y + 3), label, fill="white", font=font)
        sheet.save(out / f"sheet-{year}.jpg", quality=80)
        print(f"{year}: {len(items)} photos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
