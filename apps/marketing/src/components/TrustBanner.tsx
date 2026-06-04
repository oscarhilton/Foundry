import Image from "next/image";
import { marketingAssets } from "@/lib/assets";
import { site } from "@/content/site";

export function TrustBanner() {
  return (
    <section className="mx-auto max-w-site px-5 pb-16 md:px-8 md:pb-20">
      <div className="flex flex-col items-center gap-8 overflow-hidden rounded-3xl border border-black/[0.06] bg-stone-100 p-8 md:flex-row md:justify-between md:p-10">
        <div className="max-w-xl">
          <h2 className="text-xl font-semibold md:text-2xl">
            {site.trust.headline}
          </h2>
          <p className="mt-2 text-muted">{site.trust.subhead}</p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            {site.trust.bullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Image
          src={marketingAssets.trustCube}
          alt=""
          width={152}
          height={116}
          className="h-24 w-auto shrink-0 object-contain md:h-28"
          aria-hidden
        />
      </div>
    </section>
  );
}
