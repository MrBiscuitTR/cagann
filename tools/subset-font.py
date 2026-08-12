#!/usr/bin/env python3
"""Rebuild the trimmed Inter I actually ship.

Why: the full Inter_18pt-Regular.ttf is 335 KB because it carries Greek and
Cyrillic I never type. Cutting it down to the Latin bits + the symbols I might
plausibly use gets it to ~62 KB (~30 KB over the wire once Cloudflare gzips it).

    python tools/subset-font.py

Needs `pip install fonttools`.

Run this again if I ever add a language or a symbol that isn't in the ranges
below. It doesn't just build the file -- it also reads every page in the repo,
pulls out the text that actually gets rendered, and tells me if anything in it
would fall back to a system font. So if I paste in some exotic character later,
this will say so instead of me finding out from a screenshot.

Not producing WOFF2 on purpose: WOFF2 compression *is* brotli, so fontTools
needs a working Brotli package, and mine is broken (brotli.py present, native
_brotli missing). Cloudflare gzips the TTF anyway so the delta is a few KB.
If I ever fix that install: add --flavor=woff2 and update the @font-face
format() in style-main.css to 'woff2'.
"""

import os
import re
import sys
import unicodedata
from html.parser import HTMLParser

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "css/fonts/Inter/static/Inter_18pt-Regular.ttf")
DST = os.path.join(ROOT, "css/fonts/Inter/Inter-Regular-subset.ttf")

RANGES = [
    "U+0020-007E",   # basic latin
    "U+00A0-00FF",   # latin-1: French accents, the tremas (ä ë ï ö ü ÿ), © ® °
    "U+0100-017F",   # latin extended-A: this is where Turkish ğ İ ı ş live
    "U+2000-206F",   # punctuation: – — ' ' " " …
    "U+20A0-20BF",   # currency symbols
    "U+2116", "U+2122",          # № ™
    "U+2190-2199",               # arrows
    "U+25A0-25CF", "U+25B6", "U+25BC",   # shapes; ▶ ▼ are the collapsible markers
    "U+2713-2718",               # ✓ ✔ ✗ ✘
    "U+26A0-26A1",               # ⚠ ⚡
    "U+FB00-FB04",               # ﬁ ﬂ ligatures
]

# Deliberately NOT included: combining diacritics (U+0300-036F). They'd add
# ~11 KB gzipped and I only ever write text pre-composed (NFC). If some NFD text
# sneaks in, the check below flags it and the browser falls back gracefully --
# it looks slightly off, it doesn't break.

SKIP_DIRS = {".git", ".vscode", "old", "tools", "docs", "node_modules"}


class VisibleText(HTMLParser):
    """Just the text a visitor actually sees -- no tags, no attributes."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.chunks = []
        self._muted = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._muted = True

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._muted = False

    def handle_data(self, data):
        if not self._muted:
            self.chunks.append(data)


def rendered_chars():
    """Every character that ends up on screen, mapped to where it came from."""
    found = {}

    def note(ch, src):
        if ord(ch) > 127:
            found.setdefault(ch, set()).add(src)

    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            path = os.path.join(root, name)
            rel = os.path.relpath(path, ROOT)
            try:
                text = open(path, encoding="utf-8").read()
            except (UnicodeDecodeError, OSError):
                continue

            if name.endswith(".html"):
                parser = VisibleText()
                parser.feed(text)
                for chunk in parser.chunks:
                    for ch in chunk:
                        note(ch, rel)
                # alt/title/aria-label get read out or shown on hover
                for m in re.finditer(r'(?:alt|title|aria-label|content)="([^"]*)"', text):
                    for ch in m.group(1):
                        note(ch, rel)

            elif name.endswith(".css"):
                # only `content:` strings render; the rest is comments/selectors
                for m in re.finditer(r'content\s*:\s*(["\'])(.*?)\1', text):
                    for ch in m.group(2):
                        note(ch, rel)
                for m in re.finditer(r"\\([0-9a-fA-F]{2,6})", text):
                    try:
                        note(chr(int(m.group(1), 16)), rel)
                    except ValueError:
                        pass

            elif name.endswith(".js"):
                for m in re.finditer(r'(["\'`])(.*?)\1', text, re.S):
                    for ch in m.group(2):
                        note(ch, rel)

    return found


def main() -> int:
    subset.main([
        SRC,
        f"--output-file={DST}",
        f"--unicodes={','.join(RANGES)}",
        "--layout-features=kern,liga,calt,ccmp,locl,mark,mkmk",
        "--drop-tables+=DSIG",
        "--no-hinting",
        "--desubroutinize",
    ])

    cmap = TTFont(DST).getBestCmap()
    print(
        f"{os.path.getsize(SRC) / 1024:.1f} KB -> {os.path.getsize(DST) / 1024:.1f} KB"
        f"  ({len(cmap)} glyphs)"
    )

    gaps = {c: s for c, s in rendered_chars().items() if ord(c) not in cmap}
    if not gaps:
        print("every character rendered anywhere on the site is covered.")
        return 0

    print("\nthese will fall back to a system font:", file=sys.stderr)
    for ch in sorted(gaps):
        name = unicodedata.name(ch, "<unnamed>")
        where = ", ".join(sorted(gaps[ch])[:3])
        print(f"  U+{ord(ch):04X}  {ch}  {name}  --  {where}", file=sys.stderr)
    print(
        "\nfix: either add the range to RANGES above and re-run, or (if it's a "
        "stray combining accent) normalise the source text to NFC.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
