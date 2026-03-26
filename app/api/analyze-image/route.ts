import { NextResponse } from "next/server";
import { analyzeOutfitImage } from "@/lib/openai";
import { resolveSourceImage } from "@/lib/pinterest";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      imageUrl?: string;
      imageDataUrl?: string;
    };

    const input = body.imageDataUrl || body.imageUrl;

    if (!input) {
      return NextResponse.json({ error: "Missing image input" }, { status: 400 });
    }

    const sourceImageUrl = await resolveSourceImage(input);
    const analysis = await analyzeOutfitImage(sourceImageUrl);

    return NextResponse.json({
      sourceImageUrl,
      ...analysis
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected analysis error"
      },
      { status: 500 }
    );
  }
}
