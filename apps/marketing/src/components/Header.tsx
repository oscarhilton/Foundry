import Link from "next/link";
import { site } from "@/content/site";
import { BagIconButton, FoundryLogo } from "@/components/FoundryLogo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f9f9f7]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-site items-center gap-6 px-5 py-4 md:px-8">
        <FoundryLogo />
        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm text-muted lg:flex">
          {site.nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <BagIconButton />
          <Link
            href="#starter-kit"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </header>
  );
}
