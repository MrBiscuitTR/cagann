#!/usr/bin/env python3
"""Rebuild the two trimmed fonts I ship.

    python tools/subset-font.py

Needs `pip install fonttools`.

WHY THIS EXISTS (the bug that started it):
The CSS used to ask for font-weight 300 twenty-two times, plus 500, 600 and
bold -- but @font-face only ever declared weight 400 and loaded a single static
Regular file. Browsers do NOT synthesise lighter weights, so every one of those
300s silently rendered as 400, and the 500/600/bold ones came out as faux-bold
smear. All the typographic hierarchy on the site was fake. That's most of why
the whole thing looked flat.

So: ship the VARIABLE Inter instead, with a real 300-700 range. Measured, on the
lean charset below, gzipped:

    variable, wght 300-700   46.6 KB   <- shipping this, every weight in between
    static Regular+SemiBold  50.4 KB      MORE bytes, only two weights
    static x3                75.4 KB
    old static Regular only  30.5 KB      but every weight above 400 was a lie

The variable file costs fewer bytes than two statics and gives the whole range
continuously. Easy call.

THE RULE, and the whole point of this file: never declare a font-weight the
loaded font can't actually produce. If I add a weight in the CSS it has to sit
inside WGHT_RANGE below.

Also builds a tiny Courier Prime cut for the "01 / ABOUT" section labels.
Courier Prime was already in the repo, unreferenced and OFL-licensed, so it cost
nothing. To swap in a different mono later, point MONO_SRC at it and rerun.

Not producing WOFF2 on purpose: WOFF2 compression *is* brotli, so fontTools
needs a working Brotli package and mine is broken (brotli.py present, native
_brotli missing). Cloudflare gzips the TTF anyway, so the delta is small.
"""

import os
import re
import sys
import unicodedata
from html.parser import HTMLParser

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- body font -------------------------------------------------------------
INTER_SRC = os.path.join(ROOT, "css/fonts/Inter/Inter-VariableFont_opsz,wght.ttf")
INTER_DST = os.path.join(ROOT, "css/fonts/Inter/Inter-var-subset.ttf")
WGHT_RANGE = (300, 700)   # must match `font-weight: 300 700` in style-main.css
OPSZ_PIN = 16             # pinning the optical-size axis saves ~12 KB gzipped

# --- mono, only for the small uppercase section labels ---------------------
MONO_SRC = os.path.join(ROOT, "css/fonts/Courier_Prime/CourierPrime-Regular.ttf")
MONO_DST = os.path.join(ROOT, "css/fonts/Courier_Prime/CourierPrime-labels-subset.ttf")
# space, dollar, plus, hyphen, dot, slash, digits, colon, A-Z, brackets, underscore
# the dollar is the prompt on .timeline-cta
# the brackets and plus are for the timeline's [+] / [-] expand markers
MONO_CHARS = "U+0020,U+0024,U+002B,U+002D-002F,U+0030-0039,U+003A,U+0041-005A,U+005B-005F"

# Latin + Latin-1 (French accents, the tremas, (c) (r)) + Latin Ext-A (Turkish
# g-breve, dotted/dotless i, s-cedilla) + only the punctuation and symbols I'd
# actually type. Whole symbol BLOCKS were costing ~10 KB gzipped for glyphs I'll
# never use, so this is picked character by character now. Extend it one
# character at a time rather than re-adding a block.
RANGES = [
    "U+0020-007E",                                 # basic latin
    "U+00A0-00FF",                                 # latin-1
    "U+0100-017F",                                 # latin ext-A: Turkish lives here
    "U+2010-2015", "U+2018-201A", "U+201C-201E",   # dashes, curly quotes
    "U+2020-2022", "U+2026", "U+2030",             # dagger, bullet, ellipsis, per-mille
    "U+2039", "U+203A",                            # single angle quotes
    "U+20AC", "U+20BA",                            # euro, lira
    "U+2116", "U+2122",                            # numero, trademark
    "U+2190", "U+2192",                            # left/right arrow
    "U+25B6", "U+25BC",                            # the .collapsible / .expanded markers
    "U+2713", "U+2717",                            # check, ballot X
    "U+26A0",                                      # warning sign
]

# Deliberately NOT included: combining diacritics (U+0300-036F). ~11 KB gzipped
# for a case I never hit, since I always type pre-composed (NFC). If some NFD
# text ever sneaks in, the check at the bottom flags it and the browser falls
# back gracefully -- it looks slightly off, it doesn't break.

SKIP_DIRS = {".git", ".vscode", "old", "tools", "docs", "node_modules"}

LAYOUT = ["--layout-features=kern,liga,calt,ccmp,locl,mark,mkmk",
          "--drop-tables+=DSIG", "--no-hinting"]


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
                for m in re.finditer(r'(?:alt|title|aria-label|content)="([^"]*)"', text):
                    for ch in m.group(1):
                        note(ch, rel)

            elif name.endswith(".css"):
                for m in re.finditer(r'content\s*:\s*(["\'])(.*?)\1', text):
                    for ch in m.group(2):
                        note(ch, rel)
                for m in re.finditer(r"\\([0-9a-fA-F]{2,6})", text):
                    try:
                        note(chr(int(m.group(1), 16)), rel)
                    except ValueError:
                        pass

            elif name.endswith(".js"):
                # strip // and \* *\ first. Without this the scan reads
                # comments as if they were rendered output, and a note-to-self that
                # merely NAMES a character it deliberately avoids (the block cursor
                # glyph in caret.js) gets reported as a missing glyph.
                code = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
                code = re.sub(r"^\s*//.*$", "", code, flags=re.M)
                for m in re.finditer(r'(["\'`])(.*?)\1', code, re.S):
                    for ch in m.group(2):
                        note(ch, rel)

    return found


def build_inter():
    """Instance the variable font down to one axis, then cut the charset."""
    font = instancer.instantiateVariableFont(
        TTFont(INTER_SRC), {"wght": WGHT_RANGE, "opsz": OPSZ_PIN},
        updateFontNames=False,
    )
    tmp = INTER_DST + ".building"
    font.save(tmp)
    subset.main([tmp, f"--output-file={INTER_DST}",
                 f"--unicodes={','.join(RANGES)}"] + LAYOUT)
    os.remove(tmp)

    out = TTFont(INTER_DST)
    axes = {a.axisTag: (a.minValue, a.maxValue) for a in out["fvar"].axes}
    print(f"Inter  {os.path.getsize(INTER_SRC)/1024:7.1f} KB -> "
          f"{os.path.getsize(INTER_DST)/1024:6.1f} KB   "
          f"{len(out.getBestCmap())} glyphs, axes {axes}")
    assert "wght" in axes, "weight axis got dropped -- that's the entire point"
    return out.getBestCmap()


def build_mono():
    subset.main([MONO_SRC, f"--output-file={MONO_DST}",
                 f"--unicodes={MONO_CHARS}"] + LAYOUT)
    cmap = TTFont(MONO_DST).getBestCmap()
    print(f"Mono   {os.path.getsize(MONO_SRC)/1024:7.1f} KB -> "
          f"{os.path.getsize(MONO_DST)/1024:6.1f} KB   {len(cmap)} glyphs")
    return cmap


def main() -> int:
    inter_cmap = build_inter()
    mono_cmap = build_mono()

    # the mono is only ever used for the uppercase section labels
    missing_mono = [c for c in "0123456789/ ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                    if ord(c) not in mono_cmap]
    if missing_mono:
        print(f"FAIL: mono subset is missing {missing_mono}", file=sys.stderr)
        return 1

    gaps = {c: s for c, s in rendered_chars().items() if ord(c) not in inter_cmap}
    if not gaps:
        print("every character rendered anywhere on the site is covered.")
        return 0

    print("\nthese will fall back to a system font:", file=sys.stderr)
    for ch in sorted(gaps):
        name = unicodedata.name(ch, "<unnamed>")
        where = ", ".join(sorted(gaps[ch])[:3])
        print(f"  U+{ord(ch):04X}  {ch}  {name}  --  {where}", file=sys.stderr)
    print("\nfix: add the character to RANGES above and re-run, or (if it's a "
          "stray combining accent) normalise the source text to NFC.",
          file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
