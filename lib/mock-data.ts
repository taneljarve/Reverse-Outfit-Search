import type { ClothingItem, Listing } from "@/lib/types";

export const mockItems: ClothingItem[] = [
  {
    id: "hoodie-1",
    itemType: "hoodie",
    color: "burgundy",
    style: "vintage",
    brand: "Harley-Davidson",
    material: "cotton",
    confidence: 0.88,
    keywords: ["harley davidson hoodie", "vintage burgundy hoodie", "washed hoodie"]
  },
  {
    id: "pants-1",
    itemType: "pants",
    color: "white",
    style: "carpenter",
    material: "denim",
    confidence: 0.79,
    keywords: ["white carpenter pants", "workwear pants", "white utility trousers"]
  }
];

export function mockListings(query: string): Listing[] {
  return [
    {
      id: `${query}-1`,
      title: `Vintage ${query}`,
      price: "€24.00",
      size: "M",
      brand: query.toLowerCase().includes("harley") ? "Harley-Davidson" : "Unbranded",
      link: `https://www.vinted.ee/catalog?search_text=${encodeURIComponent(query)}`,
      query,
      score: 8.7,
      source: "mock"
    },
    {
      id: `${query}-2`,
      title: `${query} workwear fit`,
      price: "€18.00",
      size: "L",
      brand: "Carhartt-inspired",
      link: `https://www.vinted.ee/catalog?search_text=${encodeURIComponent(query)}`,
      query,
      score: 7.9,
      source: "mock"
    }
  ];
}
