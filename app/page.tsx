import { UploadWorkbench } from "@/components/upload-workbench";

export default function HomePage() {
  return (
    <main className="grain min-h-[100dvh] bg-canvas text-ink flex flex-col pt-16 pb-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8 w-full">
        <header className="mb-12 text-center">
          <h1 className="headline text-[4rem] md:text-[6rem] font-bold tracking-tight text-ink">dripback</h1>
          <p className="mt-6 text-lg text-ink/70 font-body max-w-xl mx-auto">
            Paste a Pinterest link or upload an outfit. Dripback will identify the clothing signals and automatically search Vinted to find the closest matches.
          </p>
        </header>

        <UploadWorkbench />
      </div>
    </main>
  );
}
