export type ClothingItem = {
  id: string;
  itemType: string;
  color?: string;
  material?: string;
  style?: string;
  brand?: string;
  keywords: string[];
  confidence?: number;
};

export type SearchFilters = {
  size: string;
  gender: "male" | "female" | "unisex";
  maxPrice?: number;
  sortBy: "relevance" | "price_low_to_high" | "price_high_to_low";
};

export type Listing = {
  id: string;
  title: string;
  price?: string;
  size?: string;
  brand?: string;
  image?: string;
  link: string;
  query: string;
  score: number;
  source: "live" | "mock";
};

export type ItemResult = {
  item: ClothingItem;
  queries: string[];
  listings: Listing[];
};

export type AnalyzeResponse = {
  sourceImageUrl?: string;
  items: ClothingItem[];
  fallbackMode: boolean;
  notes: string[];
};

export type SearchResponse = {
  sourceImageUrl?: string;
  results: ItemResult[];
  fallbackMode: boolean;
  notes: string[];
};
