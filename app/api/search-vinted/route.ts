import { NextResponse } from "next/server";
import { analyzeOutfitImage } from "@/lib/openai";
import { resolveSourceImage } from "@/lib/pinterest";
import { generateQueries } from "@/lib/query-generator";
import { searchVinted } from "@/lib/vinted";
import type { ClothingItem, SearchFilters } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      imageUrl?: string;
      imageDataUrl?: string;
      items?: ClothingItem[];
      filters?: SearchFilters;
    };

    const input = body.imageDataUrl || body.imageUrl;

    if (!input) {
      return NextResponse.json({ error: "Missing image input" }, { status: 400 });
    }

    const filters: SearchFilters = {
      size: body.filters?.size || "L",
      gender: body.filters?.gender || "male",
      maxPrice: body.filters?.maxPrice,
      sortBy: body.filters?.sortBy || "relevance"
    };

    const sourceImageUrl = await resolveSourceImage(input);
    const analysis = body.items?.length
      ? { items: body.items, fallbackMode: false, notes: [] as string[] }
      : await analyzeOutfitImage(sourceImageUrl);

    const resultSets = await Promise.all(
      analysis.items.map(async (item) => {
        const queries = generateQueries(item, filters);
        const listingResponses = await Promise.all(queries.slice(0, 3).map((query) => searchVinted(query, item, filters)));

        const listings = listingResponses
          .flatMap((response) => response.listings)
          .sort((a, b) => b.score - a.score)
          .filter((listing, index, array) => array.findIndex((candidate) => candidate.id === listing.id) === index)
          .slice(0, 8);

        return {
          item,
          queries,
          listings
        };
      })
    );

    return NextResponse.json({
      sourceImageUrl,
      results: resultSets,
      fallbackMode:
        analysis.fallbackMode ||
        resultSets.some((set) => set.listings.length > 0 && set.listings.every((listing) => listing.source === "mock")),
      notes: [...analysis.notes]
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected search error"
      },
      { status: 500 }
    );
  }
}
