import type { ClothingItem, SearchFilters } from "@/lib/types";

function compact(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

export function generateQueries(item: ClothingItem, filters?: SearchFilters): string[] {
  const base = compact([item.brand, item.color, item.itemType]);
  const style = compact([item.style, item.itemType]);
  const material = compact([item.material, item.color, item.itemType]);
  const audience =
    filters?.gender === "male" ? "mens" : filters?.gender === "female" ? "womens" : "unisex";

  return Array.from(
    new Set(
      [base, style, material, compact([audience, item.itemType]), ...item.keywords].filter(
        (value) => value && value.length > 2
      )
    )
  ).slice(0, 5);
}
