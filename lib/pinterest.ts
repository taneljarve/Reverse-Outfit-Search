function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function cleanCandidate(value: string) {
  return value.replace(/&amp;/g, "&").replace(/\\u002F/g, "/").replace(/\\/g, "");
}

function isUsablePinterestImage(url: string) {
  return !url.includes("facebook_share_image.png");
}

export async function resolveSourceImage(input: string): Promise<string> {
  if (!input) {
    throw new Error("Missing image source");
  }

  if (input.startsWith("data:")) {
    return input;
  }

  try {
    const url = new URL(input);
    const response = await fetch(input, {
      headers: {
        "user-agent": "Mozilla/5.0"
      },
      redirect: "follow",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Pinterest fetch failed with ${response.status}`);
    }

    const finalUrl = new URL(response.url || input);
    const contentType = response.headers.get("content-type") || "";

    if (contentType.startsWith("image/")) {
      return response.url || input;
    }

    if (!/pinterest\.|pin\.it/i.test(url.hostname) && !/pinterest\./i.test(finalUrl.hostname)) {
      return input;
    }

    const html = await response.text();
    const candidates = [
      extractMetaContent(html, "og:image"),
      extractMetaContent(html, "twitter:image:src"),
      extractMetaContent(html, "twitter:image"),
      html.match(/"image_url"\s*:\s*"([^"]+)"/i)?.[1],
      html.match(/"orig_image"\s*:\s*"([^"]+)"/i)?.[1],
      html.match(/<link[^>]+id=["']pin-image-preload["'][^>]+href=["']([^"']+)["']/i)?.[1],
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+id=["']pin-image-preload["']/i)?.[1]
    ].filter(Boolean) as string[];

    if (candidates[0]) {
      const resolved = cleanCandidate(candidates[0]);

      if (/pinterest\.|pin\.it/i.test(url.hostname) && !isUsablePinterestImage(resolved)) {
        throw new Error("Pinterest short links are not reliably resolvable. Paste the full pinterest.com/pin/... URL or upload the image.");
      }

      return resolved;
    }

    if (/pinterest\.|pin\.it/i.test(url.hostname)) {
      throw new Error("Could not extract the Pinterest image. Paste the full pinterest.com/pin/... URL or upload the image.");
    }

    return input;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    return input;
  }
}
