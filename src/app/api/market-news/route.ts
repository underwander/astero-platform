type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
};

const cache: Record<string, { items: NewsItem[]; cachedAt: number }> = {};

const CACHE_TTL = 10 * 60 * 1000;

export async function GET(req: Request) {
  const now = Date.now();
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") === "ru" ? "ru" : "en";
  const currentCache = cache[lang] || { items: [], cachedAt: 0 };

  if (currentCache.items.length > 0 && now - currentCache.cachedAt < CACHE_TTL) {
    return Response.json(currentCache.items);
  }

  try {
    const url = lang === "ru"
      ? "https://news.google.com/rss/search?q=%D1%82%D1%80%D0%B5%D0%B9%D0%B4%D0%B8%D0%BD%D0%B3%20%D1%80%D1%8B%D0%BD%D0%BA%D0%B8%20%D1%84%D0%BE%D1%80%D0%B5%D0%BA%D1%81&hl=ru&gl=RU&ceid=RU:ru"
      : "https://www.investing.com/rss/news_25.rss";
    const response = await fetch(url, { cache: "no-store" });
    const xml = await response.text();
    const items = dedupeNews(parseRss(xml, lang)).slice(0, 8);

    cache[lang] = { items, cachedAt: now };

    return Response.json(items);
  } catch (error) {
    console.error(error);
    return Response.json(currentCache.items);
  }
}

function parseRss(xml: string, lang: string): NewsItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  return blocks.map((block) => {
    const title = decodeXml(readTag(block, "title")).replace(/\s+-\s+[^-]+$/, "");
    const link = decodeXml(readTag(block, "link"));
    const publishedAt = readTag(block, "pubDate");
    const source = lang === "ru" ? "Новости рынка" : "Market news";

    return {
      title,
      link,
      source,
      publishedAt,
    };
  }).filter((item) => item.title && item.link);
}

function dedupeNews(items: NewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1]?.trim() || "";
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
