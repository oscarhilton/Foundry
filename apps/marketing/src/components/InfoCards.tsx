import { site } from "@/content/site";
import { CubeIcon, SettingsIcon } from "@/components/FoundryLogo";

function CardIcon({ type }: { type: "cube" | "settings" }) {
  const Icon = type === "settings" ? SettingsIcon : CubeIcon;
  return (
    <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2eee8] text-ink/70">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function InfoCards() {
  return (
    <section className="mx-auto max-w-site px-5 md:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {site.infoCards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-black/[0.05] bg-[#f5f4f2] p-6"
          >
            <CardIcon type={card.icon} />
            <h2 className="text-[15px] font-semibold leading-snug">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
