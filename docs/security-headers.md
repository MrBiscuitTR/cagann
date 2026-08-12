# Response headers & caching (Cloudflare)

The site is served by GitHub Pages behind Cloudflare. **GitHub Pages cannot send
custom response headers** — no `_headers` file, no `.htaccess`, nothing in the
repo will do it. Everything below has to be configured in the Cloudflare
dashboard for the `cagancalidag.com` zone.

`index.html` carries a `<meta http-equiv="Content-Security-Policy">` as a
stopgap, but that only covers that one page and `frame-ancestors` / HSTS are
**ignored** in meta form. The rules below are the real fix.

---

## 1. Security headers

Lighthouse currently reports all five of these as High severity:

| Audit | Header |
| --- | --- |
| CSP not effective against XSS | `Content-Security-Policy` |
| No strong HSTS policy | `Strict-Transport-Security` |
| No origin isolation | `Cross-Origin-Opener-Policy` |
| No clickjacking mitigation | `X-Frame-Options` / `frame-ancestors` |
| No Trusted Types | `require-trusted-types-for` |

### HSTS — the easy one

**SSL/TLS → Edge Certificates → HTTP Strict Transport Security → Enable.**

Roll it out in stages; `max-age` is not easily undone once browsers have cached it.

1. Start at `max-age=86400` (1 day), no `includeSubDomains`.
2. After a week with nothing broken, go to `max-age=31536000` (1 year).
3. Only then add `includeSubDomains` — and only once **every** subdomain
   (`blogs.`, `games.`, `twoplace.`, `consulted.`, `bedroc.`, `metaclass.`,
   `amcilar.`) is confirmed HTTPS-only. This is the step that bites people.
4. `preload` last, if you want it, via <https://hstspreload.org>.

### The rest — Transform Rule

**Rules → Transform Rules → Modify Response Header → Create rule.**
Set it to match all incoming requests, then add these static headers:

```http
Content-Security-Policy
  default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none';
  frame-ancestors 'none';
  script-src 'self' 'sha256-WZRJfWvsnNCPcxzZwvyhovnZGqhZaC+8gPGPRbx6wTk=' https://static.cloudflareinsights.com https://kit.fontawesome.com;
  style-src 'self' 'unsafe-inline' https://ka-f.fontawesome.com;
  img-src 'self' data: https:;
  font-src 'self' https://ka-f.fontawesome.com;
  connect-src 'self' https://cloudflareinsights.com https://ka-f.fontawesome.com;
  upgrade-insecure-requests

X-Frame-Options            DENY
Cross-Origin-Opener-Policy same-origin
X-Content-Type-Options     nosniff
Referrer-Policy            strict-origin-when-cross-origin
Permissions-Policy         camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

Notes on that CSP:

- It is **wider than the one in `index.html`** on purpose. The home page no
  longer loads Font Awesome, but `pages/contact.html`, `pages/cv.html` and
  several project pages still do — hence the `kit.fontawesome.com` and
  `ka-f.fontawesome.com` entries. Drop them once those pages are converted to
  inline SVG too, and this collapses to the same policy as the meta tag.
- The `sha256-` hash covers the one-line inline script in `index.html`
  (`document.documentElement.classList.add("js");`). If you ever edit that
  line — even the whitespace — regenerate it:

  ```bash
  printf '%s' 'document.documentElement.classList.add("js");' \
    | openssl dgst -sha256 -binary | openssl base64
  ```

  Other pages have their own inline scripts that this hash does **not** cover.
  Roll the header out as `Content-Security-Policy-Report-Only` first, click
  through every page, and check the browser console before enforcing.
- `img-src` is deliberately broad (`https:`). Several project icons are
  hotlinked from subdomains so they stay current; an enumerated allowlist would
  break silently every time one is added.

Two Cloudflare features inject scripts and will fight a CSP. Check both under
**Speed → Optimization** and **Scrape Shield** before enforcing:

- **Rocket Loader** rewrites your `<script>` tags and adds an inline loader.
  It will break `script-src` unless you add `'unsafe-inline'`, which defeats
  the point. Leave it **off**.
- **Email Obfuscation** injects an inline decoder on any page containing a
  `mailto:`. `index.html` has none, but `pages/contact.html` may — either turn
  the feature off or add `https://cagancalidag.com/cdn-cgi/scripts/` to
  `script-src`.

### Trusted Types

Adding `require-trusted-types-for 'script'` is the last audit. Don't enable it
yet — `coolbg.js` and `main.js` are fine, but it will need a pass over the other
pages' scripts first. Low priority for a static portfolio.

---

## 2. Cache lifetimes — worth ~2 MB on repeat visits

Lighthouse: *"Use efficient cache lifetimes — Est savings of 2,082 KiB"*. Every
asset comes back with a **2 hour** TTL, which is Cloudflare's default for an
origin that sends no `Cache-Control`. GitHub Pages sends none.

**Caching → Cache Rules → Create rule:**

**Static assets** — URI path matches this regex:

```regex
\.(webp|png|jpe?g|svg|ico|ttf|woff2?|css|js)$
```

Edge TTL 1 month, Browser TTL 1 year.

**HTML** — URI path matches `\.html$` or ends with `/`.
Edge TTL 1 hour, Browser TTL "no-cache (revalidate)".

Long browser TTLs on assets are safe here because the filenames are
content-specific (`welcomeimage-880.webp`, `Inter-Regular-subset.ttf`). If you
edit an asset **in place**, bump the name or add a `?v=` query — that's the
convention already used for `metaclass/favicon-96x96.png?v=20260331`.

Keep the HTML TTL short so content changes go live without a purge.

---

## 3. Verifying

```bash
curl -sI https://cagancalidag.com/ | grep -iE 'content-security|strict-transport|x-frame|cross-origin|cache-control'
```

Or run the page through <https://securityheaders.com>.
