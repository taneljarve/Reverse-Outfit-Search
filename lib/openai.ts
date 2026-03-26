import { z } from "zod";
import { mockItems } from "@/lib/mock-data";
import type { ClothingItem } from "@/lib/types";

const itemSchema = z.object({
  item_type: z.string(),
  color: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  style: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  keywords: z.array(z.string()).default([])
});

const responseSchema = z.array(itemSchema);

function normalizeItems(items: z.infer<typeof responseSchema>): ClothingItem[] {
  return items.map((item, index) => ({
    id: `${item.item_type}-${index + 1}`,
    itemType: item.item_type,
    color: item.color ?? undefined,
    material: item.material ?? undefined,
    style: item.style ?? undefined,
    brand: item.brand ?? undefined,
    confidence: item.confidence ?? undefined,
    keywords: item.keywords
  }));
}

async function imageToGeminiPart(sourceImageUrl: string) {
  if (sourceImageUrl.startsWith("data:")) {
    const match = sourceImageUrl.match(/^data:(.+?);base64,(.+)$/);

    if (!match) {
      throw new Error("Unsupported data URL image format");
    }

    return {
      inline_data: {
        mime_type: match[1],
        data: match[2]
      }
    };
  }

  const response = await fetch(sourceImageUrl, {
    headers: {
      "user-agent": "Mozilla/5.0"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed with ${response.status}`);
  }

  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();

  return {
    inline_data: {
      mime_type: mimeType,
      data: Buffer.from(arrayBuffer).toString("base64")
    }
  };
}

async function analyzeWithOpenAI(sourceImageUrl: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this outfit image. Return JSON only as an array. Each item must include item_type, color, material, style, brand, confidence, and keywords optimized for secondhand marketplace search."
            },
            {
              type: "input_image",
              image_url: sourceImageUrl
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };
  const rawText = payload.output_text?.trim();

  if (!rawText) {
    throw new Error("OpenAI returned an empty response");
  }

  return normalizeItems(responseSchema.parse(JSON.parse(rawText)));
}

async function analyzeWithGemini(sourceImageUrl: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const imagePart = await imageToGeminiPart(sourceImageUrl);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${
      process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash"
    }:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "Analyze this outfit image for secondhand marketplace search. Return only JSON as an array. Each item must include item_type, color, material, style, brand, confidence, and keywords."
              },
              imagePart
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                item_type: { type: "STRING" },
                color: { type: "STRING", nullable: true },
                material: { type: "STRING", nullable: true },
                style: { type: "STRING", nullable: true },
                brand: { type: "STRING", nullable: true },
                confidence: { type: "NUMBER", nullable: true },
                keywords: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                }
              },
              required: ["item_type", "keywords"],
              propertyOrdering: ["item_type", "color", "material", "style", "brand", "confidence", "keywords"]
            }
          }
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();

  if (!rawText) {
    throw new Error("Gemini returned an empty response");
  }

  return normalizeItems(responseSchema.parse(JSON.parse(rawText)));
}

export async function analyzeOutfitImage(sourceImageUrl: string): Promise<{
  items: ClothingItem[];
  fallbackMode: boolean;
  notes: string[];
}> {
  try {
    return {
      items: await analyzeWithGemini(sourceImageUrl),
      fallbackMode: false,
      notes: ["Using Gemini vision."]
    };
  } catch (geminiError) {
    try {
      return {
        items: await analyzeWithOpenAI(sourceImageUrl),
        fallbackMode: false,
        notes: ["Gemini was unavailable, so OpenAI vision was used instead."]
      };
    } catch (openAiError) {
      return {
        items: mockItems,
        fallbackMode: true,
        notes: [
          "Live vision providers failed. Returning sample detections.",
          geminiError instanceof Error ? geminiError.message.slice(0, 240) : "Gemini request failed.",
          openAiError instanceof Error ? openAiError.message.slice(0, 240) : "OpenAI request failed."
        ]
      };
    }
  }
}
