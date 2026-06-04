import { SHOWCASE_CARDS, type ShowcaseCardContent } from "./showcase-cards";
import { ShowcaseMiniChain } from "./ShowcaseMiniChain";
import { closeShowcase } from "./showcase-nav";
import { useSimulatorStore } from "../store";

function ShowcaseCard({ card }: { card: ShowcaseCardContent }) {
  const loadPreset = useSimulatorStore((s) => s.loadPreset);

  const tryIt = () => {
    loadPreset(card.presetId);
    closeShowcase();
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <article
      className={`flex flex-col rounded-xl border border-foundry-border bg-white p-4 shadow-sm ${
        card.hero ? "md:col-span-2" : ""
      }`}
    >
      <h2 className="text-base font-medium text-foundry-ink">{card.title}</h2>
      <p className="mt-1 text-xs font-mono text-foundry-muted">{card.chainLabel}</p>

      <div
        className={`mt-3 rounded-lg border border-foundry-border/80 bg-[#f5f5f4]/80 ${
          card.hero ? "overflow-x-auto" : ""
        }`}
      >
        <ShowcaseMiniChain presetId={card.presetId} wide={card.hero} />
      </div>

      <p className="mt-3 text-sm text-foundry-ink">{card.whatItDoes}</p>
      <p className="mt-2 text-xs text-foundry-muted">
        <span className="font-medium text-foundry-ink">Teaches:</span>{" "}
        {card.sentenceTeaches}
      </p>

      <button
        type="button"
        onClick={tryIt}
        className="mt-4 w-full text-sm py-2 rounded-lg border border-foundry-ink bg-foundry-ink text-white hover:opacity-90 transition-opacity"
      >
        Try it
      </button>
    </article>
  );
}

export function ShowcasePage() {
  const openWorkshop = () => {
    closeShowcase();
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f4]">
      <header className="shrink-0 border-b border-[#E8E8E8] bg-[#f5f5f4] px-4 py-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-foundry-ink">
              Foundry
            </h1>
            <p className="text-sm text-foundry-muted mt-0.5">
              Snap cubes into a sentence.
            </p>
          </div>
          <button
            type="button"
            onClick={openWorkshop}
            className="text-xs px-3 py-1.5 rounded-full border border-foundry-border bg-white hover:bg-gray-50 text-foundry-ink"
          >
            Open workshop
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-foundry-muted mb-6 max-w-xl">
            Five chains. Thirty seconds. See what each sentence teaches.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SHOWCASE_CARDS.map((card) => (
              <ShowcaseCard key={card.presetId} card={card} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
