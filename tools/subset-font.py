#!/usr/bin/env python3
"""Regenerate css/fonts/Inter/Inter-Regular-subset.ttf.

The full Inter_18pt-Regular.ttf is 335 KB because it ships Greek and Cyrillic
that this site never renders. Subsetting to Latin + Latin-1 + Latin Extended-A
(which is where the Turkish ğ İ ı ş live) plus the punctuation/symbols used in
CSS `content` gets it to ~56 KB.

    python tools/subset-font.py

Requires: pip install fonttools

Note this produces a TTF, not WOFF2. WOFF2 would be ~45 KB but its compression
*is* brotli, so it needs a working `Brotli` package. Cloudflare gzips the TTF on
the way out anyway, so the difference over the wire is small. If you do install
brotli, add `--flavor=woff2` below and update the @font-face `format()`.
"""

import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "css/fonts/Inter/static/Inter_18pt-Regular.ttf")
DST = os.path.join(ROOT, "css/fonts/Inter/Inter-Regular-subset.ttf")

UNICODES = ",".join([
    "U+0020-007E",   # Basic Latin
    "U+00A0-00FF",   # Latin-1: French accents, ©, ®, °
    "U+0100-017F",   # Latin Extended-A: Turkish ğ İ ı ş, Œ
    "U+018F", "U+0192",
    "U+01FA-01FF",
    "U+2000-206F",   # General punctuation: – — ' ' " " …
    "U+20AC",        # €
    "U+2122",        # ™
    "U+2190-2193",   # arrows
    "U+25B6", "U+25BC",   # ▶ ▼ — the .collapsible / .expanded markers
    "U+2610-2612",
    "U+FB00-FB04",   # ﬁ ﬂ ligatures
])

# Glyphs that must survive, or the site renders mojibake.
MUST_HAVE = "ÇçĞğİıŞşÖöÜüÉéÈèÊêÀàÛûÔô©®–—’…▶▼"


def main() -> int:
    subset.main([
        SRC,
        f"--output-file={DST}",
        f"--unicodes={UNICODES}",
        "--layout-features=kern,liga,calt,ccmp,locl,mark,mkmk",
        "--drop-tables+=DSIG",
        "--no-hinting",
        "--desubroutinize",
    ])

    cmap = TTFont(DST).getBestCmap()
    missing = [c for c in MUST_HAVE if ord(c) not in cmap]
    if missing:
        print(f"FAIL: dropped glyphs {''.join(missing)}", file=sys.stderr)
        return 1

    print(
        f"{os.path.getsize(SRC) / 1024:.1f} KB -> {os.path.getsize(DST) / 1024:.1f} KB"
        f"  ({len(cmap)} glyphs, all required glyphs present)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
