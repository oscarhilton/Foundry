import Image from "next/image";
import { marketingAssets } from "@/lib/assets";
import { site } from "@/content/site";

export function LanguageSection() {
  const columns = [site.language.nouns, site.language.verbs, site.language.outputs];

  return (
    <section
      id="language"
      className="mx-auto max-w-site scroll-mt-24 px-5 py-16 md:px-8 md:py-20"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,240px)_1fr] lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            {site.language.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{site.language.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {site.language.body}
          </p>
        </div>
        <div className="rounded-3xl border border-black/[0.06] bg-stone-100 p-6 md:p-8">
          <Image
            src={marketingAssets.languageDiagram}
            alt="Nouns plus verbs flow into outputs"
            width={575}
            height={150}
            className="mx-auto h-auto w-full max-w-2xl object-contain"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.label} className="rounded-xl bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {col.label}
                </p>
                <p className="mt-1 text-sm font-semibold">{col.examples}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {col.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
