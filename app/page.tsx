import { UploadWorkbench } from "@/components/upload-workbench";

export default function HomePage() {
  return (
    <main className="grain px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 overflow-hidden rounded-[36px] border border-ink/10 bg-ink px-6 py-10 text-paper shadow-card md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.35em] text-paper/55">Reverse Outfit Search</p>
            <h1 className="headline mt-4 text-5xl leading-[0.95] md:text-7xl">
              Turn a saved outfit into secondhand listings you can actually buy
            </h1>
            <p className="mt-5 max-w-2xl text-base text-paper/72 md:text-lg">
              Dripback breaks outfit inspiration into searchable fashion signals, then ranks live Vinted-style
              matches by resale relevance instead of generic keyword spam.
            </p>
          </div>
        </section>

        <UploadWorkbench />
      </div>
    </main>
  );
}
