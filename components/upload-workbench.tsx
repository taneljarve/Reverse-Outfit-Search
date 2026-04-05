"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Results } from "@/components/results";
import type { AnalyzeResponse, SearchFilters, SearchResponse } from "@/lib/types";

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function UploadWorkbench() {
  const [pinterestUrl, setPinterestUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [pendingPreviewLabel, setPendingPreviewLabel] = useState<string>();
  const [analysis, setAnalysis] = useState<AnalyzeResponse>();
  const [results, setResults] = useState<SearchResponse>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    size: "L",
    gender: "male",
    sortBy: "relevance"
  });

  const submit = async (payload: { imageUrl?: string; imageDataUrl?: string }) => {
    setError(undefined);
    setAnalysis(undefined);
    setResults(undefined);
    setIsLoading(true);

    try {
      const analysisResponse = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const analysisJson = (await analysisResponse.json()) as AnalyzeResponse & { error?: string };

      if (!analysisResponse.ok) {
        throw new Error(analysisJson.error || "Image analysis failed");
      }

      const searchResponse = await fetch("/api/search-vinted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          items: analysisJson.items,
          filters
        })
      });

      const searchJson = (await searchResponse.json()) as SearchResponse & { error?: string };

      if (!searchResponse.ok) {
        throw new Error(searchJson.error || "Search failed");
      }

      setPreviewUrl(searchJson.sourceImageUrl || analysisJson.sourceImageUrl || previewUrl);
      setPendingPreviewLabel(undefined);
      setAnalysis(analysisJson);
      setResults(searchJson);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  const onUrlSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = pinterestUrl.trim();

    if (!trimmed) {
      setError("Paste a Pinterest link or upload an image.");
      return;
    }

    setPreviewUrl(undefined);
    setPendingPreviewLabel(trimmed);
    await submit({ imageUrl: trimmed });
  };

  const handleFile = async (file?: File) => {
    if (!file) return;

    const imageDataUrl = await fileToDataUrl(file);
    setPendingPreviewLabel(undefined);
    setPreviewUrl(imageDataUrl);
    await submit({ imageDataUrl });
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-10">
      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[32px] p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="headline mt-2 text-2xl text-ink font-semibold">Source Image</h2>
            </div>
            <div className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/60">
              Pinterest or Upload
            </div>
          </div>

          <form onSubmit={onUrlSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Pinterest URL</span>
              <input
                value={pinterestUrl}
                onChange={(event) => setPinterestUrl(event.target.value)}
                placeholder="https://www.pinterest.com/pin/... or https://pin.it/..."
                className="w-full rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-3 text-base outline-none transition focus:border-accent"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Size</span>
                <select
                  value={filters.size}
                  onChange={(event) => setFilters((current) => ({ ...current, size: event.target.value }))}
                  className="w-full rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-3 text-base outline-none transition focus:border-accent"
                >
                  {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Gender</span>
                <select
                  value={filters.gender}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      gender: event.target.value as SearchFilters["gender"]
                    }))
                  }
                  className="w-full rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-3 text-base outline-none transition focus:border-accent"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unisex">Unisex</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Max Price (€)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={filters.maxPrice ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      maxPrice: event.target.value ? Number(event.target.value) : undefined
                    }))
                  }
                  placeholder="No limit"
                  className="w-full rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-3 text-base outline-none transition focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Sort</span>
                <select
                  value={filters.sortBy}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      sortBy: event.target.value as SearchFilters["sortBy"]
                    }))
                  }
                  className="w-full rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-3 text-base outline-none transition focus:border-accent"
                >
                  <option value="relevance">Best match</option>
                  <option value="price_low_to_high">Price: low to high</option>
                  <option value="price_high_to_low">Price: high to low</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-paper transition-transform duration-300 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Searching..." : "Search Outfit"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-sm text-ink/45">
            <div className="h-px flex-1 bg-ink/10" />
            or
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed px-6 py-10 text-center transition ${
              isDragging
                ? "border-accent bg-canvas"
                : "border-ink/20 bg-ink/5 hover:border-accent/50 hover:bg-canvas"
            }`}
          >
            <span className="headline text-2xl text-ink">Drop an outfit screenshot</span>
            <span className="mt-2 max-w-sm text-sm text-ink/60">
              Good inputs: clean full-body looks, product flat lays, or a focused crop around the item you want.
            </span>
            <span className="mt-5 rounded-full border border-ink/10 bg-paper px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/60">
              Drag here or choose image
            </span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          </label>

          {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
        </div>

        <div className="panel rounded-[32px] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Preview</p>
          <div className="mt-4 overflow-hidden rounded-[28px] border border-ink/10 bg-ink/5">
            <div className="relative aspect-[4/5]">
              {previewUrl ? (
                <Image src={previewUrl} alt="Outfit preview" fill className="object-cover" sizes="(max-width: 1280px) 100vw, 40vw" />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink/55">
                  {pendingPreviewLabel ? (
                    <div className="max-w-sm space-y-3">
                      <p>Resolving the Pinterest link into a real image preview.</p>
                      <p className="break-all text-xs text-ink/45">{pendingPreviewLabel}</p>
                    </div>
                  ) : (
                    "Your source image lands here, then the app turns it into ranked secondhand matches."
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Vision</p>
              <p className="mt-2 text-sm text-ink/70">
                Detects item type, color, style, material, and visible brand signals.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Filters</p>
              <p className="mt-2 text-sm text-ink/70">
                Size, gender, max price, and price sorting shape the final matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {analysis ? (
        <section className="panel rounded-[32px] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Detected wardrobe map</p>
              <h2 className="headline mt-2 text-3xl text-ink">Structured output ready for marketplace search</h2>
            </div>
            <div className="text-sm text-ink/60">
              {analysis.fallbackMode ? "Fallback mode active" : "Live model response"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {analysis.items.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-ink/10 bg-canvas/60 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-ink/45">{item.itemType}</div>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {[item.color, item.brand].filter(Boolean).join(" • ") || "Unbranded signal"}
                </p>
                <p className="mt-2 text-sm text-ink/65">
                  {[item.style, item.material].filter(Boolean).join(" • ") || "Style details inferred from image"}
                </p>
                <p className="mt-4 text-sm text-ink/60">{item.keywords.join(", ")}</p>
              </div>
            ))}
          </div>

          {analysis.notes.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-900/10 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {analysis.notes.join(" ")}
            </div>
          ) : null}

          {analysis.notes.some((note) => note.includes("OPENAI_API_KEY")) ? (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white/75 px-4 py-4 text-sm text-ink/75">
              <p className="font-semibold text-ink">How to add your OpenAI key</p>
              <p className="mt-2">1. Create a file named <code>.env.local</code> in the project root.</p>
              <p>2. Add one line: <code>OPENAI_API_KEY=your_key_here</code></p>
              <p>3. Save the file, then restart the dev server.</p>
              <p className="mt-2 text-ink/55">
                The root is the same folder as <code>package.json</code>.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {results ? (
        <>
          {results.notes.length > 0 ? (
            <div className="rounded-2xl border border-amber-900/10 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {results.notes.join(" ")}
            </div>
          ) : null}
          <Results results={results.results} />
        </>
      ) : null}
    </div>
  );
}
