import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ImportedProduct = {
  title: string;
  brand: string;
  modelNumber: string;
  upc: string;
  image: string;
  summary: string;
  bullets: string[];
  source: string;
  sourceUrl: string;
  importNote: string;
};

const FETCH_HEADERS = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

const NAVIGATION_HEADERS = {
  ...FETCH_HEADERS,
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = parseProductUrl(body.url);

    const result = await fetchProductHtml(url);

    if (!result.response.ok) {
      return NextResponse.json(
        {
          error: `The product page returned ${result.response.status}. Try manual upload for this item.`,
        },
        { status: 502 },
      );
    }

    if (isBlockedProductPage(result.html, result.url)) {
      return NextResponse.json(
        {
          error:
            "Walmart blocked automated extraction for this product page. No product was added. Use manual upload for the image and paste the product details manually.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(extractProduct(result.html, result.url, url));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not import this product page.",
      },
      { status: 400 },
    );
  }
}

async function fetchProductHtml(url: URL) {
  let bestResult: { response: Response; html: string; url: URL } | null = null;

  for (const candidate of getFetchCandidates(url)) {
    for (const headers of [NAVIGATION_HEADERS, FETCH_HEADERS]) {
      const response = await fetch(candidate, {
        headers,
        redirect: "follow",
        cache: "no-store",
      });
      const html = await response.text();
      const result = { response, html, url: new URL(response.url || candidate) };

      if (!bestResult || html.length > bestResult.html.length) {
        bestResult = result;
      }

      if (response.ok && looksLikeProductPage(html)) {
        return result;
      }
    }
  }

  if (!bestResult) {
    throw new Error("Could not reach that product page.");
  }

  return bestResult;
}

function getFetchCandidates(url: URL) {
  const candidates: URL[] = [];
  const asin = getAmazonAsin(url);

  if (asin) {
    candidates.push(new URL(`https://www.amazon.com/dp/${asin}/`));
  }

  candidates.push(url);

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function looksLikeProductPage(html: string) {
  if (isBlockedProductPage(html)) return false;

  return Boolean(
    html.match(/id=["']productTitle["']/i) ||
      html.match(/type=["']application\/ld\+json["']/i) ||
      html.match(/<meta[^>]+property=["']og:title["']/i),
  );
}

function isBlockedProductPage(html: string, url?: URL) {
  const title = getTitle(html).toLowerCase();
  const text = cleanText(html).toLowerCase();
  const pathname = url?.pathname.toLowerCase() ?? "";

  return Boolean(
    pathname.includes("/blocked") ||
      title === "robot or human?" ||
      text.includes("robot or human?") ||
      text.includes("are you a robot") ||
      text.includes("verify you are human") ||
      text.includes("press and hold") ||
      html.match(/px-captcha|g-recaptcha|h-captcha|blocked\?url=/i),
  );
}

function parseProductUrl(value?: string) {
  if (!value?.trim()) {
    throw new Error("Paste a product URL first.");
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("That does not look like a valid product URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS product URLs can be imported.");
  }

  return url;
}

function extractProduct(html: string, url: URL, sourceUrl = url): ImportedProduct {
  const host = sourceUrl.hostname.replace(/^www\./, "");
  const jsonProduct = findJsonLdProduct(html);
  const pageTitle = stripRetailSuffix(
    pickFirst([
      asText(jsonProduct?.name),
      getAmazonTitle(html),
      getMeta(html, ["og:title", "twitter:title"]),
      usefulTitle(getTitle(html), url),
      urlTitleGuess(url),
    ]),
  );
  const brand = pickFirst([
    getBrandName(jsonProduct?.brand),
    getAmazonBrand(html),
    getMeta(html, ["product:brand"]),
    titleBrandGuess(pageTitle),
    hostLabel(host),
  ]);
  const modelNumber = pickFirst([
    asText(jsonProduct?.mpn),
    asText(jsonProduct?.model),
    asText(jsonProduct?.sku),
    getMeta(html, ["product:model"]),
    modelFromTitleGuess(pageTitle),
    getMeta(html, ["product:retailer_item_id"]),
  ]);
  const upc = pickFirst([
    asText(jsonProduct?.gtin12),
    asText(jsonProduct?.gtin13),
    asText(jsonProduct?.gtin14),
    asText(jsonProduct?.gtin),
    getMeta(html, ["product:upc", "product:gtin"]),
  ]);
  const summary = pickFirst([
    asText(jsonProduct?.description),
    getMeta(html, ["og:description", "twitter:description", "description"]),
    `${pageTitle} imported from ${hostLabel(host)}. Review the buyer copy and add wholesale terms.`,
  ]);
  const image = normalizeUrl(
    pickFirst([
      getImageValue(jsonProduct?.image),
      getMeta(html, ["og:image", "twitter:image", "twitter:image:src"]),
      getAmazonImage(html),
    ]),
    url,
  );
  const bullets = uniqueText([
    ...getAmazonBullets(html),
    ...summaryToBullets(summary),
  ]).slice(0, 5);

  return {
    title: pageTitle || "Imported retail product",
    brand,
    modelNumber,
    upc,
    image,
    summary: cleanText(summary),
    bullets:
      bullets.length > 0
        ? bullets
        : ["Review imported product content", "Add buyer-facing selling points"],
    source: `${hostLabel(host)} import`,
    sourceUrl: sourceUrl.toString(),
    importNote: image
      ? "Product content imported. Add wholesale price, units, FOB, pallet qty, and truckload qty."
      : "Imported available text, but no product image was found. Use manual upload if needed.",
  };
}

function getAmazonAsin(url: URL) {
  return (
    url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1] ??
    url.searchParams.get("asin") ??
    ""
  ).toUpperCase();
}

function findJsonLdProduct(html: string): Record<string, unknown> | null {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const script of scripts) {
    const raw = decodeHtml(script[1].trim());
    const candidates = [raw, raw.replace(/,\s*([}\]])/g, "$1")];

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        const product = findProductNode(parsed);
        if (product) return product;
      } catch {
        // Keep looking. Retailer JSON-LD is often malformed.
      }
    }
  }

  return null;
}

function findProductNode(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const product = findProductNode(item);
      if (product) return product;
    }
    return null;
  }

  const node = value as Record<string, unknown>;
  const type = node["@type"];
  if (
    type === "Product" ||
    (Array.isArray(type) && type.some((item) => item === "Product"))
  ) {
    return node;
  }

  for (const key of ["@graph", "itemListElement", "mainEntity", "offers"]) {
    const product = findProductNode(node[key]);
    if (product) return product;
  }

  return null;
}

function getMeta(html: string, names: string[]) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const name of names) {
    for (const tag of tags) {
      const key = getAttr(tag, "property") || getAttr(tag, "name") || getAttr(tag, "itemprop");
      if (key?.toLowerCase() !== name.toLowerCase()) continue;

      const content = getAttr(tag, "content");
      if (content) return cleanText(content);
    }
  }

  return "";
}

function getTitle(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return cleanText(title ?? "");
}

function getAmazonTitle(html: string) {
  const title = html.match(/id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1];
  return cleanText(title ?? "");
}

function getAmazonBrand(html: string) {
  const byline = html.match(/id=["']bylineInfo["'][^>]*>([\s\S]*?)<\/a>/i)?.[1];
  return cleanText(byline ?? "")
    .replace(/^Visit the\s+/i, "")
    .replace(/\s+Store$/i, "")
    .replace(/^Brand:\s*/i, "");
}

function getAmazonBullets(html: string) {
  const block = html.match(/id=["']feature-bullets["'][\s\S]*?(?:<\/ul>|<\/div>\s*<\/div>)/i)?.[0] ?? "";
  const spans = [...block.matchAll(/<span[^>]+class=["'][^"']*a-list-item[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)];

  return spans
    .map((span) => cleanText(span[1]))
    .filter((text) => text && !/^make sure this fits/i.test(text));
}

function getAmazonImage(html: string) {
  const landingTag = html.match(/<img[^>]+id=["']landingImage["'][^>]*>/i)?.[0] ?? "";
  const src = getAttr(landingTag, "src");
  if (src) return src;

  const dynamicImage = getAttr(landingTag, "data-a-dynamic-image");
  if (dynamicImage) {
    const decoded = decodeHtml(dynamicImage);
    try {
      const images = JSON.parse(decoded) as Record<string, [number, number]>;
      const [best] = Object.entries(images).sort((a, b) => {
        const aScore = (a[1]?.[0] ?? 0) * (a[1]?.[1] ?? 0);
        const bScore = (b[1]?.[0] ?? 0) * (b[1]?.[1] ?? 0);
        return bScore - aScore;
      });
      if (best?.[0]) return best[0];
    } catch {
      // Fall through to URL search.
    }
  }

  return (
    html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[^"'\\\s<]+/i)?.[0] ?? ""
  );
}

function getAttr(tag: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i");
  return decodeHtml(tag.match(pattern)?.[2] ?? "");
}

function getBrandName(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return cleanText(value);
  if (typeof value === "object" && !Array.isArray(value)) {
    return asText((value as Record<string, unknown>).name);
  }
  return "";
}

function getImageValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return getImageValue(value[0]);
  if (typeof value === "object") {
    const node = value as Record<string, unknown>;
    return asText(node.url) || asText(node.contentUrl);
  }
  return "";
}

function asText(value: unknown) {
  return typeof value === "string" ? cleanText(value) : "";
}

function cleanText(value: string) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeUrl(value: string, base: URL) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

function pickFirst(values: string[]) {
  return values.map(cleanText).find(Boolean) ?? "";
}

function uniqueText(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values.map(cleanText).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function summaryToBullets(summary: string) {
  return cleanText(summary)
    .split(/(?:\.|;)\s+/)
    .map((value) => value.replace(/\.$/, ""))
    .filter((value) => value.length >= 18)
    .slice(0, 3);
}

function stripRetailSuffix(value: string) {
  return cleanText(value)
    .replace(/^Amazon\.com\s*:\s*/i, "")
    .replace(/\s*:\s*Amazon\.com.*$/i, "")
    .replace(/\s*\|\s*Walmart\.com.*$/i, "")
    .replace(/\s*-\s*Walmart\.com.*$/i, "");
}

function usefulTitle(value: string, url: URL) {
  const title = cleanText(value);
  const host = url.hostname.replace(/^www\./, "");

  if (!title) return "";
  if (/^amazon\.com$/i.test(title)) return "";
  if (/^walmart\.com$/i.test(title)) return "";
  if (title.toLowerCase() === host.toLowerCase()) return "";

  return title;
}

function urlTitleGuess(url: URL) {
  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .filter((part) => !["dp", "gp", "product"].includes(part.toLowerCase()))
    .filter((part) => !/^[A-Z0-9]{10}$/i.test(part));
  const slug = parts[0] ?? "";

  return decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function modelFromTitleGuess(title: string) {
  const modelTokens = cleanText(title).match(
    /\b[A-Z0-9]{2,}(?:-[A-Z0-9]{2,})*\b/g,
  );

  return (
    modelTokens
      ?.filter((token) => /[A-Z]/.test(token) && /\d/.test(token))
      .filter((token) => token.replace(/-/g, "").length >= 5)
      .at(-1) ?? ""
  );
}

function hostLabel(host: string) {
  if (host.includes("amazon")) return "Amazon";
  if (host.includes("walmart")) return "Walmart";
  if (host.includes("target")) return "Target";
  return host
    .split(".")
    .filter((part) => !["com", "net", "org"].includes(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function titleBrandGuess(title: string) {
  const firstWord = cleanText(title).split(/\s+/)[0] ?? "";
  if (!firstWord || /^\d/.test(firstWord)) return "";

  return firstWord.replace(/[^a-z0-9&+-]/gi, "");
}
