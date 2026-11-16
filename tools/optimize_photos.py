"""Resize photos, convert to WebP and strip all metadata (including GPS).

Usage: python3 optimize_photos.py <input file or folder> <output folder> [--width 2000]
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageOps

EXTS = {".jpg", ".jpeg", ".png", ".heic", ".webp", ".tif", ".tiff"}


def convert(src: Path, dst: Path, width: int) -> None:
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)  # keep phone rotation, then drop EXIF
        im = im.convert("RGB")
        im.thumbnail((width, width), Image.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, "WEBP", quality=78, method=6)  # no exif= argument, so no metadata
    print(f"{src.name} -> {dst} ({dst.stat().st_size // 1024} KB)")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=2000)
    args = ap.parse_args()
    src, out = Path(args.src), Path(args.out)
    files = [src] if src.is_file() else sorted(p for p in src.rglob("*") if p.suffix.lower() in EXTS)
    for f in files:
        convert(f, out / (f.stem + ".webp"), args.width)
    return 0


if __name__ == "__main__":
    sys.exit(main())
