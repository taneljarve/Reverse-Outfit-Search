import { mockListings } from "@/lib/mock-data";
import { scoreListing } from "@/lib/ranking";
import type { ClothingItem, Listing, SearchFilters } from "@/lib/types";

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractField(details: string, labels: string[]) {
  for (const label of labels) {
    const match = details.match(new RegExp(`${label}:\\s*([^,]+)`, "i"));
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

function extractPrice(details: string) {
  const match = details.match(/(\d+[.,]\d+\s*€)/);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function parsePriceValue(price?: string) {
  if (!price) return undefined;
  const normalized = price.replace(/[^\d.,]/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

function matchesGender(listing: Listing, gender: SearchFilters["gender"]) {
  if (gender === "unisex") return true;

  const text = `${listing.title} ${listing.brand ?? ""}`.toLowerCase();
  const maleTokens = ["men", "mens", "male", "meeste", "herren", "homme"];
  const femaleTokens = ["women", "womens", "female", "naiste", "damen", "femme"];

  if (gender === "male") {
    return !femaleTokens.some((token) => text.includes(token));
  }

  return !maleTokens.some((token) => text.includes(token));
}

function matchesSize(listing: Listing, size: string) {
  if (!listing.size) return true;
  return listing.size.toLowerCase() === size.toLowerCase();
}

function applyFilters(listings: Listing[], filters: SearchFilters) {
  const filtered = listings.filter((listing) => {
    const priceValue = parsePriceValue(listing.price);

    if (filters.maxPrice !== undefined && priceValue !== undefined && priceValue > filters.maxPrice) {
      return false;
    }

    if (!matchesGender(listing, filters.gender)) {
      return false;
    }

    if (!matchesSize(listing, filters.size)) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sortBy === "price_low_to_high") {
      return (parsePriceValue(a.price) ?? Number.MAX_SAFE_INTEGER) - (parsePriceValue(b.price) ?? Number.MAX_SAFE_INTEGER);
    }

    if (filters.sortBy === "price_high_to_low") {
      return (parsePriceValue(b.price) ?? -1) - (parsePriceValue(a.price) ?? -1);
    }

    return b.score - a.score;
  });
}

function extractListingsFromHtml(html: string, query: string, itemContext: ClothingItem): Listing[] {
  const baseUrl = process.env.VINTED_BASE_URL || "https://www.vinted.ee";
  const cardPattern =
    /data-testid="product-item-id-(\d+)"[\s\S]*?<img[^>]+src="([^"]+)"[^>]+alt="([^"]*)"[\s\S]*?<a href="([^"]+)"[^>]*title="([^"]*)"/g;
  const listings: Listing[] = [];

  for (const match of html.matchAll(cardPattern)) {
    const [, id, image, alt, href, titleAttr] = match;
    const details = decodeHtml(titleAttr || alt);
    const title = details.split(",")[0]?.trim();

    if (!title) {
      continue;
    }

    const draft = {
      id,
      title,
      price: extractPrice(details),
      size: extractField(details, ["suurus", "size"]),
      brand: extractField(details, ["kaubamärk", "brand"]),
      image: decodeHtml(image),
      link: href.startsWith("http") ? href : `${baseUrl}${href}`,
      query,
      source: "live" as const
    };

    listings.push({
      ...draft,
      score: scoreListing(itemContext, draft)
    });
  }

  return listings;
}

export async function searchVinted(query: string, itemContext: ClothingItem, filters: SearchFilters): Promise<{
  listings: Listing[];
  fallbackMode: boolean;
  notes: string[];
}> {
  const baseUrl = process.env.VINTED_BASE_URL || "https://www.vinted.ee";

  try {
    const params = new URLSearchParams({
      search_text: query
    });

    if (filters.maxPrice !== undefined) {
      params.set("price_to", String(filters.maxPrice));
    }

    if (filters.sortBy === "price_low_to_high") {
      params.set("order", "price_low_to_high");
    } else if (filters.sortBy === "price_high_to_low") {
      params.set("order", "price_high_to_low");
    } else {
      params.set("order", "relevance");
    }

    const url = `${baseUrl}/catalog?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Vinted returned ${response.status}`);
    }

    const html = await response.text();
    const listings = applyFilters(extractListingsFromHtml(html, query, itemContext), filters)
      .filter((listing, index, array) => array.findIndex((candidate) => candidate.id === listing.id) === index)
      .slice(0, 8);

    if (listings.length > 0) {
      return { listings, fallbackMode: false, notes: [] };
    }

    throw new Error("No listings parsed from Vinted response");
  } catch (error) {
    const listings = applyFilters(
      mockListings(query)
      .map((listing) => ({
        ...listing,
        score: scoreListing(itemContext, listing)
      })),
      filters
    );

    return {
      listings,
      fallbackMode: true,
      notes: [error instanceof Error ? error.message : "Vinted lookup failed. Returning sample listings."]
    };
  }
}
