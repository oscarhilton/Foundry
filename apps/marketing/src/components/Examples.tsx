import Image from "next/image";
import { marketingAssets } from "@/lib/assets";
import { site } from "@/content/site";
import { simulatorHref } from "@/lib/links";

export function Examples() {
  return (
    <section
      id="examples"
      className="mx-auto max-w-site scroll-mt-24 px-5 py-16 md:px-8 md:py-20"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            {site.examples.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{site.examples.title}</h2>
        </div>
        <a
          href={simulatorHref()}
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          {site.examples.browseLabel} →
        </a>
      </div>
      <div className="mt-8 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {site.examplePresets.map((preset) => {
          const assets = marketingAssets.examples[preset.id];
          return (
            <a
              key={preset.id}
              href={simulatorHref()}
              className="group w-[min(100%,260px)] shrink-0 snap-start rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="overflow-hidden rounded-xl bg-stone-100 p-3">
                <Image
                  src={assets.miniChain}
                  alt={`${preset.title} cube chain`}
                  width={230}
                  height={88}
                  className="h-14 w-full object-contain"
                />
              </div>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{preset.title}</h3>
                  <p className="mt-1 font-mono text-[10px] text-muted">
                    {preset.chain}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  Live
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {preset.description}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
