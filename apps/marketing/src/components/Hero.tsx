import Image from "next/image";
import Link from "next/link";
import { marketingAssets } from "@/lib/assets";
import { site } from "@/content/site";
import { simulatorHref } from "@/lib/links";
import { PlayIcon, ShieldBadge } from "@/components/FoundryLogo";

export function Hero() {
  return (
    <section className="relative isolate min-h-[720px] overflow-hidden lg:min-h-[560px]">
      <Image
        src={marketingAssets.heroChain}
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden
        className="z-0 object-contain object-bottom lg:object-right lg:object-center"
      />

      <div className="relative z-10 max-w-xl px-5 pb-16 pt-10 md:px-8 md:pb-20 md:pt-14 lg:pl-[max(1.25rem,calc((100vw-72rem)/2+2rem))]">
        <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.35rem]">
          {site.hero.headline}
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted md:text-base">
          {site.hero.subhead}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="#examples"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Explore Examples
          </Link>
          <a
            href={simulatorHref()}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium transition-colors hover:border-black/20"
          >
            <PlayIcon className="h-5 w-5 text-muted" />
            Watch Overview
          </a>
        </div>
        <ShieldBadge text={site.hero.badge} />
      </div>
    </section>
  );
}
