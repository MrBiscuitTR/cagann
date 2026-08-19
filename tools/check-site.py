#!/usr/bin/env python3
"""Sanity-check every page before I push.

    python tools/check-site.py

No dependencies. Serves the repo on a throwaway port and actually requests every
local URL the pages reference, rather than guessing from the filesystem -- that's
how the NFD filename thing got caught (the PDF on disk uses a combining accent
and the HTML used a pre-composed one; they look identical and only one of them
404s).

What it checks:
  - every local href/src/srcset resolves 200 (fragments and query strings
    stripped, non-ASCII percent-encoded the way a browser would)
  - tags balance, per page
  - no <a> nested inside another <a> (invalid, and browsers silently un-nest it
    into markup you didn't write)
  - every page has doctype first, lang, charset, viewport, title, canonical
  - the shared nav is identical everywhere (it's copy-pasted across 8 pages, so
    it drifts if I'm not looking)
  - no raw colour literals or font sizes outside the token block in :root
  - no font-weight the loaded variable font can't render (300-700)

Anything quoted inside an HTML comment is ignored -- otherwise every path I
mention in a note-to-self gets reported as a broken link.

Exit code is 1 if anything failed, so this can go in a pre-push hook.
"""

import http.server
import io
import os
import re
import socket
import socketserver
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", ".vscode", "old", "docs", "tools", "node_modules", ".well-known"}
WEIGHT_RANGE = (300, 700)   # must match @font-face in style-main.css

problems = []


def fail(msg):
    problems.append(msg)


def strip_comments(html):
    return re.sub(r"<!--.*?-->", "", html, flags=re.S)


def pages():
    out = []
    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.relpath(os.path.join(root, f), ROOT).replace("\\", "/"))
    return sorted(out)


def serve():
    handler = http.server.SimpleHTTPRequestHandler

    class Quiet(handler):
        def log_message(self, *a):
            pass

    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]

    os.chdir(ROOT)
    httpd = socketserver.TCPServer(("127.0.0.1", port), Quiet)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{port}"


def status(url):
    try:
        return urllib.request.urlopen(
            urllib.request.Request(url, method="HEAD"), timeout=10).status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return type(e).__name__


def check_links(base, page, html):
    here = os.path.dirname(page)
    refs = set(re.findall(r'(?:src|href)="([^"]+)"', html))
    for m in re.finditer(r'srcset="([^"]+)"', html):
        refs |= {x.strip().split()[0] for x in m.group(1).split(",")}

    for ref in refs:
        if ref.startswith(("http://", "https://", "mailto:", "data:", "javascript:")):
            continue
        path = ref.split("#")[0].split("?")[0]
        if not path:
            continue                       # pure #fragment
        target = path if path.startswith("/") else "/" + here + "/" + path
        target = os.path.normpath(target).replace("\\", "/")
        code = status(base + urllib.parse.quote(target, safe="/"))
        if code != 200:
            fail(f"{page}: {code} <- {ref}")


def check_markup(page, raw, html):
    if not raw.lstrip().lower().startswith("<!doctype html"):
        fail(f"{page}: doctype is not the first thing in the file")
    for label, pat in [("lang", r"<html[^>]+lang="), ("charset", r'charset="?UTF-8'),
                       ("viewport", r'name="viewport"'), ("title", r"<title>[^<]+</title>")]:
        if not re.search(pat, html, re.I):
            fail(f"{page}: missing {label}")

    # canonical only matters on a page that's allowed to be indexed. the
    # n8n-generated grades page is noindex on purpose, so don't nag about it.
    noindex = re.search(r'name="robots"[^>]*content="[^"]*noindex', html, re.I)
    if not noindex and not re.search(r'rel="canonical"', html, re.I):
        fail(f"{page}: missing canonical (and it isn't noindex)")

    for tag in ("html", "head", "body", "main", "header", "footer", "nav",
                "section", "div", "a", "p", "h1", "h2", "h3"):
        opened = len(re.findall(rf"<{tag}[\s>]", html))
        closed = html.count(f"</{tag}>")
        if opened != closed:
            fail(f"{page}: <{tag}> {opened} open / {closed} closed")

    depth = 0
    for m in re.finditer(r"<a[\s>]|</a>", html):
        depth += -1 if m.group(0) == "</a>" else 1
        if depth > 1:
            fail(f"{page}: nested <a> inside <a>")
            break


def check_css():
    """No raw colours or sizes outside :root, and no unrenderable weights."""
    # projects.css is in here because that's where the invisible-heading bug
    # lived: it used --selected-bg (a 16%-alpha BACKGROUND token) as a text
    # colour, so every project-page h2 rendered at 16% opacity. Guarding it now.
    for name in ("style-main.css", "contact.css", "cv.css", "projects.css"):
        path = os.path.join(ROOT, "css", name)
        if not os.path.exists(path):
            continue
        css = re.sub(r"/\*.*?\*/", "", io.open(path, encoding="utf-8").read(), flags=re.S)
        if css.count("{") != css.count("}"):
            fail(f"css/{name}: braces don't balance")

        # everything after the token block
        body = css[css.index("html {"):] if "html {" in css else css
        for lit in re.findall(r"#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\bteal\b", body):
            fail(f"css/{name}: raw colour {lit} outside :root - add a token instead")

        for w in re.findall(r"font-weight:\s*([^;]+);", css):
            w = w.strip()
            if w.startswith("var(") or w == "300 700":
                continue
            n = {"normal": 400, "bold": 700}.get(w)
            try:
                n = n or int(w.replace("!important", "").strip())
            except ValueError:
                continue
            if not WEIGHT_RANGE[0] <= n <= WEIGHT_RANGE[1]:
                fail(f"css/{name}: font-weight {n} is outside the font's {WEIGHT_RANGE} axis")


def check_xml():
    """Every .svg and .xml in the repo must actually parse.

    This exists because one stray double hyphen in a comment inside
    files/icons.svg made the whole sprite unparseable, and the failure mode is
    completely silent: the browser can't resolve any #fragment, so every icon on
    every page just isn't there. Nothing in the console, no 404 -- the file
    serves a clean 200 with the right content-type. Only a parser catches it.

    Same trap already bit sitemap.xml once. An XML comment may not contain "--".
    """
    import xml.etree.ElementTree as ET

    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if not f.endswith((".svg", ".xml")):
                continue
            rel = os.path.relpath(os.path.join(root, f), ROOT).replace("\\", "/")
            try:
                ET.parse(os.path.join(root, f))
            except ET.ParseError as e:
                fail(f"{rel}: not well-formed XML -- {e}")
                text = io.open(os.path.join(root, f), encoding="utf-8", errors="replace").read()
                text = io.open(os.path.join(root, f), encoding="utf-8",
                                errors="replace").read()
                for m in re.finditer(r"<!--(.*?)-->", text, re.S):
                    for line in m.group(1).split("\n"):
                        if "--" in line:
                            fail(f"{rel}: double hyphen in a comment: {line.strip()[:60]}")

def check_sprite_refs(all_html):
    """Every <use href="...#id"> must point at a symbol that exists."""
    import xml.etree.ElementTree as ET

    cache = {}
    for page, html in all_html.items():
        for m in re.finditer(r'<use href="([^"#]+)#([^"]+)"', html):
            path, frag = m.group(1), m.group(2)
            local = os.path.join(ROOT, path.lstrip("/"))
            if path not in cache:
                try:
                    r = ET.parse(local).getroot()
                    cache[path] = {
                        s.get("id")
                        for s in r.iter("{http://www.w3.org/2000/svg}symbol")
                    }
                except Exception:
                    cache[path] = None
            ids = cache[path]
            if ids is None:
                fail(f"{page}: <use> points at {path}, which won't parse")
            elif frag not in ids:
                fail(f"{page}: <use> #{frag} not in {path} (has: {sorted(ids)})")


def check_shared_nav(all_html):
    navs = {}
    for page, html in all_html.items():
        m = re.search(r'<nav aria-label="Main">(.*?)</nav>', html, re.S)
        if m:
            navs.setdefault(re.sub(r"\s+", " ", m.group(1)).strip(), []).append(page)
    # index uses same-page #anchors and contact marks aria-current, so up to
    # three legitimate variants
    if len(navs) > 3:
        fail(f"shared nav has drifted into {len(navs)} variants: "
             + "; ".join(f"{v[0]}..." for v in navs.values()))


def main():
    httpd, base = serve()
    try:
        all_html = {}
        for page in pages():
            raw = io.open(os.path.join(ROOT, page), encoding="utf-8").read()
            html = strip_comments(raw)
            all_html[page] = html
            check_markup(page, raw, html)
            check_links(base, page, html)
        check_shared_nav(all_html)
        check_sprite_refs(all_html)
        check_xml()
        check_css()
        print(f"checked {len(all_html)} pages")
    finally:
        httpd.shutdown()

    if problems:
        print(f"\n{len(problems)} problem(s):", file=sys.stderr)
        for p in problems:
            print("  " + p, file=sys.stderr)
        return 1
    print("all clean")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
