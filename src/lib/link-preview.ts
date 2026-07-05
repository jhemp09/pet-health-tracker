// Best-effort Open Graph scraper used to populate a food link's name/image
// automatically. Retailers that block non-browser user agents (or don't set
// og: tags) simply fall back to no title/image — the raw link still works.

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
];

function isBlockedHost(hostname: string) {
  return BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(hostname));
}

function decodeHtmlEntities(str: string) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function matchMetaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function matchTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

export async function fetchLinkPreview(
  url: string
): Promise<{ title: string | null; imageUrl: string | null }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { title: null, imageUrl: null };
  }
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    isBlockedHost(parsed.hostname)
  ) {
    return { title: null, imageUrl: null };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PetHealthTrackerBot/1.0)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return { title: null, imageUrl: null };
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return { title: null, imageUrl: null };
    }

    const html = (await res.text()).slice(0, 200_000);
    const title =
      matchMetaContent(html, "og:title") ??
      matchMetaContent(html, "twitter:title") ??
      matchTitleTag(html);

    let imageUrl =
      matchMetaContent(html, "og:image") ??
      matchMetaContent(html, "twitter:image");
    if (imageUrl) {
      try {
        imageUrl = new URL(imageUrl, parsed).toString();
      } catch {
        imageUrl = null;
      }
    }

    return { title, imageUrl };
  } catch {
    return { title: null, imageUrl: null };
  }
}
