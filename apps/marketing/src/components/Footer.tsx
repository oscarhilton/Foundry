import Link from "next/link";
import { site } from "@/content/site";
import { simulatorHref } from "@/lib/links";

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-site px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
          <div>
            <p className="text-lg font-semibold">{site.name}</p>
            <p className="mt-2 max-w-xs text-sm text-muted">{site.footer.tagline}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Product
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="#starter-kit" className="hover:text-muted">
                  Starter Kit
                </Link>
              </li>
              <li>
                <Link href="#language" className="hover:text-muted">
                  Language
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Examples
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={simulatorHref()} className="hover:text-muted">
                  Live showcase
                </a>
              </li>
              <li>
                <Link href="#examples" className="hover:text-muted">
                  Preset sentences
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Learn
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/oscarhilton/Foundry/blob/main/docs/grammar.md"
                  className="hover:text-muted"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Grammar
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/oscarhilton/Foundry/blob/main/docs/use-model.md"
                  className="hover:text-muted"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How people use Foundry
                </a>
              </li>
            </ul>
          </div>
        </div>
          <div className="mt-12 flex flex-col gap-6 border-t border-black/5 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-sm gap-2">
            <label htmlFor="newsletter" className="sr-only">
              Email
            </label>
            <input
              id="newsletter"
              type="email"
              placeholder={site.footer.newsletter}
              className="min-w-0 flex-1 rounded-full border border-black/10 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-black/20"
            />
            <button
              type="button"
              className="rounded-full bg-ink px-4 py-2 text-sm text-white"
              aria-label="Subscribe"
            >
              →
            </button>
          </div>
          <p className="text-xs text-muted">{site.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
