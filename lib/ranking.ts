import type { ClothingItem, Listing } from "@/lib/types";

function includesToken(haystack: string, needle?: string) {
  return needle ? haystack.includes(needle.toLowerCase()) : false;
}

function similarity(query: string, title: string) {
  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (queryTokens.length === 0) {
    return 0;
  }

  const titleText = title.toLowerCase();
  const matched = queryTokens.filter((token) => titleText.includes(token)).length;
  return matched / queryTokens.length;
}

export function scoreListing(item: ClothingItem, listing: Omit<Listing, "score">): number {
  const title = `${listing.title} ${listing.brand ?? ""}`.toLowerCase();
  let score = 0;

  if (includesToken(title, item.itemType)) {
    score += 3;
  }

  if (includesToken(title, item.color)) {
    score += 2;
  }

  if (includesToken(title, item.brand)) {
    score += 5;
  }

  if (includesToken(title, item.style)) {
    score += 2;
  }

  score += similarity(listing.query, title) * 4;

  return Number(score.toFixed(2));
}
