import Link from "next/link";
import type { SVGProps } from "react";

export function FoundryLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 shrink-0">
        <span className="absolute left-0 top-0 h-5 w-5 rounded-md border border-black/15 bg-white shadow-sm" />
        <span className="absolute bottom-0 right-0 h-5 w-5 rounded-md border border-black/15 bg-white shadow-sm" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-ink">Foundry</span>
    </Link>
  );
}

function IconBag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}

export function BagIconButton() {
  return (
    <button
      type="button"
      className="hidden rounded-full p-2 text-ink transition-colors hover:bg-black/5 sm:block"
      aria-label="Shop (coming soon)"
    >
      <IconBag className="h-5 w-5" />
    </button>
  );
}

export function ShieldBadge({ text }: { text: string }) {
  return (
    <p className="mt-10 flex items-center gap-2 text-sm text-muted">
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
        <path
          d="M10 2.5 4 5v4.5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5l-6-2.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      {text}
    </p>
  );
}

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden {...props}>
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 7v6l5-3-5-3Z" />
    </svg>
  );
}

export function CubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <path
        d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"
        strokeLinejoin="round"
      />
      <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
    </svg>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
