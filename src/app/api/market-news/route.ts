type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
};

const cache = {
  items: [] as NewsItem[],
  cachedAt: 0,
};

const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (cache.items.length > 0 && now - cache.cachedAt < CACHE_TTL) {
    return Response.json(cache.items);
  }

  try {
    const url = "https://news.google.com/rss/search?q=forex%20OR%20stocks%20OR%20crypto%20OR%20trading%20when:2d&hl=ru&gl=RU&ceid=RU:ru";
    const response = await fetch(url, { cache: "no-store" });
    const xml = await response.text();
    const items = parseRss(xml).slice(0, 8);

    cache.items = items;
    cache.cachedAt = now;

    return Response.json(items);
  } catch (error) {
    console.error(error);
    return Response.json(cache.items);
  }
}

function parseRss(xml: string): NewsItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  return blocks.map((block) => {
    const title = decodeXml(readTag(block, "title")).replace(/\s+-\s+[^-]+$/, "");
    const link = decodeXml(readTag(block, "link"));
    const publishedAt = readTag(block, "pubDate");
    const source = decodeXml(readTag(block, "source")) || "Market news";

    return {
      title,
      link,
      source,
      publishedAt,
    };
  }).filter((item) => item.title && item.link);
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
