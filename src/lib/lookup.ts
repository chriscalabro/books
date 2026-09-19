// Pull book metadata from a publisher/retailer URL. The user's list is mostly
// FORTHCOMING titles that book databases haven't indexed, so scraping the page is
// essential — but publisher pages vary from clean (Princeton) to broken (MIT
// renders a different book) to hostile (Penguin RandomHouse shows a cookie wall).
// So we combine sources and validate every result against the URL itself.
//
// Order (all client-side, CORS-friendly, no API key):
//   1. ISBN in URL -> Google Books (authoritative; empty for forthcoming books).
//   2. Scrape: Jina Reader renders the page to markdown -> we take the main title
//      + its following-line subtitle, the author (author-page links near the
//      title), and the labeled publication date. microlink -> the cover image.
//   3. Google Books by slug -> rescue when the scrape is junk/mismatched.

export interface BookMeta {
  title?: string;
  author?: string;
  cover_url?: string;
  pub_date?: string; // yyyy-MM-dd
  link: string;
}

// ---------- text utilities --------------------------------------------------
const STOP = new Set(["the", "a", "an", "of", "and", "for", "to", "in", "on", "by"]);
const wordsOf = (s: string) =>
  (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP.has(w));

function isJunkTitle(t?: string): boolean {
  if (!t || t.trim().length < 2) return true;
  return /cookie|consent|privacy|sign ?in|log ?in|\bmenu\b|attention required|just a moment|not found|enable javascript|are you a robot|access denied/i.test(
    t
  );
}

function looksLikePerson(name: string): boolean {
  const n = name.trim();
  if (n.length < 3 || n.length > 60) return false;
  if (/[<>|!\[\]{}@]|image|http/i.test(n)) return false;
  if (/\bauthors?\b/i.test(n)) return false;
  if (/\b(learn more|our|explore|about this|more about|home|books?|contributor|editor)\b/i.test(n))
    return false;
  return /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*){0,4}$/.test(n);
}

function titleMatchesSlug(title: string, query: string | null): boolean {
  if (isJunkTitle(title)) return false;
  if (!query) return true;
  const q = wordsOf(query);
  if (q.length === 0) return true;
  const tw = new Set(wordsOf(title));
  return q.filter((w) => tw.has(w)).length / q.length >= 0.6;
}

const stripMd = (s: string) =>
  s
    .replace(/^#+\s*/, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();

const cleanTitle = (s?: string) =>
  s ? s.split(/\s+[|·]\s+/)[0].replace(/\s*\bBook by\b.*$/i, "").replace(/\s{2,}/g, " ").trim() : s;

// Is `s` a plausible subtitle line (the line right after the title)?
function goodSubtitle(s: string, base: string): boolean {
  const v = s.trim();
  if (v.length < 4 || v.length > 160) return false;
  if (/^by\b/i.test(v)) return false;
  if (/^!\[|^\[|\$|→/.test(v)) return false;
  if (/\b(table of contents|reading group|about the (book|author)|related|add to|format|hardcover|paperback|ebook|isbn|price)\b/i.test(v))
    return false;
  if (!/[a-z]/i.test(v)) return false;
  if (v.toLowerCase() === base.toLowerCase()) return false;
  const letters = (v.match(/[a-z]/gi) || []).length;
  return letters / v.length > 0.6;
}

// ---------- date parsing ----------------------------------------------------
const MON =
  "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";
const DATE_TOK =
  `(?:(?:${MON})\\.?\\s+\\d{1,2},?\\s+\\d{4}` +
  `|\\d{1,2}\\s+(?:${MON})\\.?\\s+\\d{4}` +
  `|(?:${MON})\\.?\\s+\\d{4}` +
  `|\\d{4}-\\d{2}-\\d{2}` +
  `|\\d{1,2}/\\d{1,2}/\\d{4})`; // numeric M/D/YYYY (e.g. Harvard UP "10/06/2026")
const DATE_LABELS = [
  "Published\\s*\\(US\\)",
  "Publication date",
  "Pub(?:lication)?\\.?\\s*date",
  "On sale(?:\\s*date)?",
  "Release date",
  "Published",
  "Copyright",
];

function parseDate(value?: string): string | undefined {
  if (!value) return undefined;
  const s = value.trim().replace(/(\d{1,2})(st|nd|rd|th)/gi, "$1");
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  const d = new Date(s);
  if (isNaN(+d)) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ---------- URL parsing -----------------------------------------------------
function extractIsbn(url: string): string | null {
  const digits = url.replace(/[-\s]/g, "");
  const m13 = digits.match(/(97[89]\d{10})/);
  if (m13) return m13[1];
  const m10 = digits.match(/\D(\d{9}[\dxX])\b/);
  if (m10) return m10[1];
  return null;
}

function slugParts(url: string): { query: string | null; author: string | null } {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
    const raw = decodeURIComponent(last).replace(/\.(html?|php|aspx?)$/i, "");
    const byMatch = raw.match(/-by-([a-z-]+)$/i);
    const author = byMatch
      ? byMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : null;
    const query = raw
      .replace(/-by-[a-z-]+$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b(books?|product|title|dp|gp|hardcover|paperback|ebook)\b/gi, " ")
      .replace(/\d{6,}/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { query: query.length >= 3 ? query : null, author };
  } catch {
    return { query: null, author: null };
  }
}

// ---------- Jina Reader: title (+subtitle), author, date -------------------
const AUTHOR_LINK =
  /\[([^\]]+)\]\(([^)]*(?:our-authors|\/authors?\/|contributor|\/taxonomy\/term)[^)]*)\)/gi;

function collectAuthors(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(AUTHOR_LINK)) {
    const name = m[1].trim();
    if (looksLikePerson(name) && !found.includes(name)) found.push(name);
    if (found.length >= 3) break;
  }
  return found;
}

// Returns the full title (with subtitle when present) and the line index it was
// anchored at (so authors can be searched nearby).
function assembleTitle(
  lines: string[],
  microTitle: string | undefined,
  query: string | null
): { title?: string; anchor: number } {
  const h1idx: number[] = [];
  lines.forEach((l, i) => {
    if (/^#\s+\S/.test(l)) h1idx.push(i);
  });
  const h1s = h1idx.map((i) => cleanTitle(stripMd(lines[i]))!);
  const headerTitle = cleanTitle(
    lines.find((l) => /^Title:\s*/.test(l))?.replace(/^Title:\s*/, "")
  );
  const candidates = [...h1s, headerTitle, cleanTitle(microTitle)].filter(Boolean) as string[];

  const base =
    candidates.find((t) => titleMatchesSlug(t, query)) ||
    candidates.find((t) => !isJunkTitle(t));
  if (!base) return { title: undefined, anchor: -1 };
  if (base.includes(":")) {
    const anchor = lines.findIndex((l) => /^#\s+/.test(l) && stripMd(l).startsWith(base.split(":")[0]));
    return { title: base, anchor };
  }

  // Look for a subtitle on the line(s) after a matching H1.
  for (const i of h1idx) {
    const h = cleanTitle(stripMd(lines[i]))!;
    if (h.toLowerCase() !== base.toLowerCase() && !h.toLowerCase().startsWith(base.toLowerCase()))
      continue;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const raw = lines[j].trim();
      if (!raw || /^\s*\*\s*\*\s*\*/.test(raw)) continue; // blank or hrule
      const cand = stripMd(raw);
      if (goodSubtitle(cand, base)) return { title: `${base}: ${cand}`, anchor: i };
      if (!/^!\[|^\[/.test(raw)) break; // first real line wasn't a subtitle
    }
    return { title: base, anchor: i };
  }
  return { title: base, anchor: -1 };
}

async function scrapeJina(url: string, query: string | null, microTitle?: string) {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { "X-Return-Format": "markdown" },
  });
  if (!res.ok) throw new Error(`Reader ${res.status}`);
  const md = await res.text();
  const lines = md.split("\n");

  const { title, anchor } = assembleTitle(lines, microTitle, query);

  let authors: string[] = [];
  if (anchor >= 0) {
    const start = lines.slice(0, anchor).join("\n").length;
    authors = collectAuthors(md.slice(start, start + 800));
  }
  if (authors.length === 0) authors = collectAuthors(md);

  // Find a date shortly after a label, tolerating markdown/punctuation between
  // them (e.g. "**Publication date:** October 8, 2026").
  let pub_date: string | undefined;
  const dateRe = new RegExp(DATE_TOK, "i");
  for (const label of DATE_LABELS) {
    const lm = new RegExp(label, "i").exec(md);
    if (!lm) continue;
    const window = md.slice(lm.index + lm[0].length, lm.index + lm[0].length + 40);
    const dm = window.match(dateRe);
    if (dm) {
      pub_date = parseDate(dm[0]);
      if (pub_date) break;
    }
  }

  return { title, author: authors.join(", ") || undefined, pub_date };
}

// ---------- microlink: cover (and cheap fallbacks) -------------------------
async function scrapeMicrolink(url: string): Promise<Partial<BookMeta>> {
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Cover ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("Couldn't read that page");
  const d = json.data ?? {};
  const author = d.author?.trim();
  return {
    title: d.title?.trim() || undefined,
    author: author && looksLikePerson(author) ? author : undefined,
    cover_url: d.image?.url || undefined,
    pub_date: parseDate(d.date),
  };
}

// ---------- Google Books: authoritative / gap-filler -----------------------
async function googleBooks(query: string): Promise<Partial<BookMeta>> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?maxResults=1&q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error(`Google Books ${res.status}`);
  const v = (await res.json()).items?.[0]?.volumeInfo;
  if (!v) return {};
  const cover = (v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail)
    ?.replace(/^http:/, "https:")
    .replace(/zoom=\d/, "zoom=2");
  return {
    title: v.title ? (v.subtitle ? `${v.title}: ${v.subtitle}` : v.title) : undefined,
    author: Array.isArray(v.authors) ? v.authors.join(", ") : undefined,
    cover_url: cover,
    pub_date: parseDate(v.publishedDate),
  };
}

export async function fetchBookFromUrl(pageUrl: string): Promise<BookMeta> {
  const link = pageUrl.trim();
  if (!link) throw new Error("Enter a URL first");

  const isbn = extractIsbn(link);
  const { query, author: slugAuthor } = slugParts(link);
  const meta: BookMeta = { link };

  // 1. Authoritative lookup for indexed (usually backlist) books.
  if (isbn) {
    try {
      const g = await googleBooks(`isbn:${isbn}`);
      Object.assign(meta, {
        title: g.title,
        author: g.author,
        cover_url: g.cover_url,
        pub_date: g.pub_date,
      });
    } catch {
      /* forthcoming/unavailable — scrape next */
    }
  }

  // 2. Scrape (fills whatever Google didn't — the common forthcoming case).
  if (!meta.title || !meta.author || !meta.pub_date || !meta.cover_url) {
    const ml = await scrapeMicrolink(link).catch(() => ({} as Partial<BookMeta>));
    const j = await scrapeJina(link, query, ml.title).catch(() => ({} as Partial<BookMeta>));

    if (!meta.title) meta.title = j.title || cleanTitle(ml.title);
    if (!meta.author) meta.author = j.author || ml.author || slugAuthor || undefined;
    if (!meta.pub_date) meta.pub_date = j.pub_date || ml.pub_date;
    if (!meta.cover_url) meta.cover_url = ml.cover_url;
  }

  // 3. Rescue: title junk/missing -> Google Books by slug.
  if ((!meta.title || isJunkTitle(meta.title)) && query) {
    try {
      const g = await googleBooks(query);
      if (g.title) {
        meta.title = g.title;
        meta.author ||= g.author;
        meta.pub_date ||= g.pub_date;
        meta.cover_url ||= g.cover_url;
      }
    } catch {
      /* ignore */
    }
  }

  if (!meta.title || isJunkTitle(meta.title)) {
    throw new Error("Couldn't find the book on that page — try a different link");
  }
  return meta;
}
