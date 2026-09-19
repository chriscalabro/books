// Given a page URL (e.g. a publisher's product page), try to find the cover
// image. Uses microlink.io, a free hosted metadata service, to read the page's
// Open Graph image without needing our own server — so it works in local dev and
// in production alike. Free tier is rate-limited (~50/day), which is plenty for
// adding books by hand.
export async function fetchCoverFromUrl(pageUrl: string): Promise<string | null> {
  const clean = pageUrl.trim();
  if (!clean) return null;
  const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(clean)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("Couldn't read that page");
  const img = json.data?.image?.url as string | undefined;
  return img ?? null;
}
