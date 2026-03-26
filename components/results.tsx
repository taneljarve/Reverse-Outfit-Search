import Image from "next/image";
import type { ItemResult } from "@/lib/types";

function scoreLabel(score: number) {
  if (score >= 10) return "Sharp match";
  if (score >= 7) return "Strong match";
  if (score >= 5) return "Decent match";
  return "Loose match";
}

export function Results({ results }: { results: ItemResult[] }) {
  return (
    <div className="space-y-8">
      {results.map(({ item, queries, listings }) => (
        <section key={item.id} className="panel rounded-[28px] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink/60">
                Detected Item
              </div>
              <h3 className="headline text-3xl tracking-tight text-ink">
                {[item.color, item.brand, item.style, item.itemType].filter(Boolean).join(" ")}
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-ink/70">
                Search tracks resale intent rather than exact catalog names. Confidence:{" "}
                {item.confidence ? `${Math.round(item.confidence * 100)}%` : "estimated"}
              </p>
            </div>
            <div className="max-w-md text-sm text-ink/65">
              <span className="font-semibold text-ink">Search angles:</span> {queries.join(" • ")}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {listings.map((listing) => (
              <a
                key={`${item.id}-${listing.id}`}
                href={listing.link}
                target="_blank"
                rel="noreferrer"
                className="card-rise overflow-hidden rounded-[24px] border border-ink/8 bg-white/80"
              >
                <div className="relative aspect-[4/5] bg-fog">
                  {listing.image ? (
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-ink/45">
                      Preview unavailable
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                      {scoreLabel(listing.score)}
                    </span>
                    <span className="text-sm font-semibold text-ink">{listing.price ?? "Price unavailable"}</span>
                  </div>
                  <div>
                    <h4 className="line-clamp-2 text-base font-semibold text-ink">{listing.title}</h4>
                    <p className="mt-1 text-sm text-ink/65">
                      {[listing.brand, listing.size].filter(Boolean).join(" • ") || "Brand or size not parsed"}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
