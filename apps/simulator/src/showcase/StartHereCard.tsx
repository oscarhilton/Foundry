import { START_HERE } from "./showcase-cards";
import { closeShowcase } from "./showcase-nav";
import { useSimulatorStore } from "../store";

export function StartHereCard() {
  const loadPreset = useSimulatorStore((s) => s.loadPreset);

  const tryIt = () => {
    loadPreset(START_HERE.tryPresetId);
    closeShowcase();
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <article className="md:col-span-2 flex flex-col rounded-xl border border-foundry-border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-medium text-foundry-ink">{START_HERE.title}</h2>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 sm:items-start">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-foundry-muted">
            {START_HERE.kitTitle}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-foundry-ink">
            {START_HERE.kitItems.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-green-700" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-sm text-foundry-ink space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foundry-muted">
              Build your first sentence
            </p>
            <p className="mt-1 font-mono text-xs">{START_HERE.firstSentence}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foundry-muted">
              Then add new words
            </p>
            <p className="mt-1 text-foundry-muted">
              {START_HERE.addOns.join(" · ")}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={tryIt}
        className="mt-5 w-full sm:w-auto sm:self-start text-sm px-5 py-2 rounded-lg border border-foundry-ink bg-foundry-ink text-white hover:opacity-90 transition-opacity"
      >
        Try it
      </button>
    </article>
  );
}
