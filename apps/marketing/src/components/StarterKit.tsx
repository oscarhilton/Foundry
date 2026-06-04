import Image from "next/image";
import { marketingAssets } from "@/lib/assets";
import { site } from "@/content/site";
import { simulatorHref } from "@/lib/links";

const cubeImages = [
  marketingAssets.cubeCore,
  marketingAssets.cubePlace,
  marketingAssets.cubeWeather,
  marketingAssets.cubeLight,
];

export function StarterKit() {
  return (
    <section
      id="starter-kit"
      className="mx-auto max-w-site scroll-mt-24 px-5 py-16 md:px-8 md:py-20"
    >
      <div className="rounded-3xl border border-black/[0.06] bg-stone-100 p-6 md:p-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,220px)_1fr] lg:items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              {site.starterKit.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{site.starterKit.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {site.starterKit.body}
            </p>
            <a
              href={simulatorHref()}
              className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {site.starterKit.cta}
            </a>
            <div className="mt-8 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Build your first sentence
                </p>
                <p className="mt-1 font-mono text-xs">{site.starterKit.firstSentence}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Then add new words
                </p>
                <p className="mt-1 text-muted">
                  {site.starterKit.addOns.join(" · ")}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {site.starterKit.cubes.map((cube, i) => (
              <article
                key={cube.name}
                className="flex flex-col items-center rounded-2xl border border-black/[0.06] bg-white p-4 text-center"
              >
                <Image
                  src={cubeImages[i]!}
                  alt={`${cube.name} cube`}
                  width={115}
                  height={135}
                  className="h-28 w-auto object-contain"
                />
                <h3 className="mt-3 text-sm font-semibold">{cube.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{cube.role}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
