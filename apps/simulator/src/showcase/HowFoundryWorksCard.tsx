import type { ReactNode } from "react";
import { closeShowcase } from "./showcase-nav";

const CUBE_GROUPS = [
  {
    label: "Output cubes",
    items: ["Light", "Display", "Sound"],
  },
  {
    label: "Input cubes",
    items: ["Motion", "Dial"],
  },
  {
    label: "Identity cubes",
    items: ["Place (e.g. London, Tokyo)"],
  },
] as const;

/** M6 proof chain — visible from across a room */
function M6ProofChainVisual() {
  const blocks = ["London", "Weather", "Light", "Core"];
  return (
    <div
      className="flex items-center justify-center gap-0 py-2 pointer-events-none select-none"
      aria-hidden
    >
      {blocks.map((label, i) => (
        <span key={label} className="flex items-center">
          {i > 0 && (
            <span className="w-3 h-1 shrink-0 rounded-full bg-[#D4D4D8]" />
          )}
          <span
            className={`flex flex-col items-center justify-center rounded-md border bg-white text-[7px] font-medium text-foundry-ink shadow-sm ${
              label === "Core"
                ? "border-[#1D3557] bg-[#1D3557] text-white w-12 h-12"
                : "border-foundry-border w-11 h-11"
            }`}
          >
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}

function ProductQa({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-foundry-muted">
        {title}
      </h3>
      <div className="mt-1 text-sm text-foundry-ink space-y-1">{children}</div>
    </div>
  );
}

export function HowFoundryWorksCard() {
  const openWorkshop = () => {
    closeShowcase();
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <article className="md:col-span-2 flex flex-col rounded-xl border border-[#1D3557]/20 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#1D3557] leading-snug">
        Foundry is not a smart-home platform. Foundry is a physical language for
        behaviours.
      </p>

      <h2 className="text-lg font-medium text-foundry-ink mt-4">
        How Foundry Works
      </h2>

      <div className="mt-4 grid gap-5 md:grid-cols-[1fr,minmax(0,220px)] md:items-start">
        <div className="space-y-4 text-sm text-foundry-ink">
          <div className="space-y-3 border-b border-foundry-border/60 pb-4">
            <ProductQa title="What is Foundry?">
              <p>
                A system of physical cubes that snap together to create
                behaviours. Each chain becomes a sentence.
              </p>
              <p className="font-mono text-xs text-foundry-muted">
                London → Weather → Light
                <br />
                Tokyo → Time → Display
              </p>
            </ProductQa>

            <ProductQa title="What do I need?">
              <p>
                Start with a <strong>Core</strong>, a <strong>Display</strong>{" "}
                or <strong>Light</strong>, and a few cubes.
              </p>
              <p>More cubes add new words to your vocabulary.</p>
            </ProductQa>

            <ProductQa title="Does it work with my existing devices?">
              <p>
                Foundry is being designed as an open system. The first hardware
                focuses on <strong>native Foundry cubes</strong>, with
                integrations planned as the platform evolves.
              </p>
            </ProductQa>

            <p className="text-xs text-foundry-muted pt-1 border-t border-foundry-border/40">
              One Core powers one chain — one sentence on your desk. A second
              behaviour means a second Core (for now).
            </p>
          </div>

          <p>Physical cubes connect magnetically.</p>
          <p>One Core cube provides power and connectivity.</p>

          <ul className="space-y-2.5 text-sm">
            {CUBE_GROUPS.map((group) => (
              <li key={group.label}>
                <span className="font-medium">{group.label}:</span>
                <ul className="mt-0.5 pl-4 list-disc text-foundry-muted marker:text-foundry-border">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <p className="font-medium text-foundry-ink">
            Snap them together to create behaviours.
          </p>
        </div>

        <div className="rounded-lg border border-foundry-border/80 bg-[#f5f5f4]/80 px-3">
          <p className="text-[9px] uppercase tracking-wide text-foundry-muted text-center pt-2">
            First hardware demo
          </p>
          <M6ProofChainVisual />
          <p className="text-[10px] text-center text-foundry-muted pb-2 px-1">
            London → Weather → Light · read left to right
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-foundry-muted border-t border-foundry-border/60 pt-3">
        <span className="font-medium text-foundry-ink">Teaches:</span> the object
        you are building — not just the simulator.
      </p>

      <button
        type="button"
        onClick={openWorkshop}
        className="mt-4 w-full sm:w-auto sm:self-start text-sm px-5 py-2 rounded-lg border border-foundry-border bg-white text-foundry-ink hover:bg-gray-50 transition-colors"
      >
        Open workshop
      </button>
    </article>
  );
}
