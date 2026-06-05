import type { ReactNode } from "react";
import { closeShowcase } from "./showcase-nav";

const CUBE_GROUPS = [
  {
    label: "Output cubes",
    items: ["Glow", "Display", "Sound"],
  },
  {
    label: "Input cubes",
    items: ["Motion", "Wheel"],
  },
  {
    label: "Identity cubes",
    items: ["Place"],
    note: "Demo faces are examples; you can change the place later without replacing the cube.",
  },
] as const;

function PlaceAssignVisual() {
  return (
    <div
      className="flex flex-col items-center gap-1 py-2 pointer-events-none select-none"
      aria-hidden
    >
      <span className="flex flex-col items-center justify-center rounded-md border border-foundry-border bg-white text-[7px] font-medium text-foundry-ink shadow-sm w-14 h-11">
        Place
      </span>
      <span className="text-[9px] text-foundry-muted">↓ assigned to London</span>
    </div>
  );
}

/** M6 proof chain — visible from across a room */
function M6ProofChainVisual() {
  const blocks = ["Place", "Weather", "Glow", "Core"];
  return (
    <div
      className="flex items-center justify-center gap-0 py-1 pointer-events-none select-none"
      aria-hidden
    >
      {blocks.map((label, i) => (
        <span key={label} className="flex items-center">
          {i > 0 && (
            <span className="w-3 h-1 shrink-0 rounded-full bg-[#D4D4D8]" />
          )}
          <span
            className={`flex flex-col items-center justify-center rounded-md border text-[7px] font-medium shadow-sm ${
              label === "Core"
                ? "border-[#1D3557] bg-[#1D3557] text-white w-12 h-12"
                : "border-foundry-border bg-white text-foundry-ink w-11 h-11"
            }`}
          >
            {label}
            {label === "Core" && (
              <span className="text-[6px] font-normal opacity-80 mt-0.5 leading-none">
                power + Wi-Fi
              </span>
            )}
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
                London → Weather → Glow
                <br />
                Tokyo → Time → Display
              </p>
            </ProductQa>

            <ProductQa title="What do I need?">
              <p>
                Start with a <strong>Core</strong>, <strong>Place</strong>,{" "}
                <strong>Weather</strong>, <strong>Motion</strong>,{" "}
                <strong>Glow</strong>, and <strong>Display</strong>.
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

          <div className="space-y-3 border-b border-foundry-border/60 pb-4">
            <ProductQa title="How does a Place become London?">
              <p>
                <strong>Place cubes are programmable.</strong> Demo kits may show
                London or Tokyo on the face. You choose the place when setting
                up your Core — and{" "}
                <strong>you can change it later without replacing the cube.</strong>
              </p>
            </ProductQa>

            <ProductQa title="What if the arrangement does not work?">
              <p>
                Cubes only affect outputs to their <strong>right</strong>.
                Wrong order or an incomplete sentence gets a{" "}
                <strong>clear physical signal</strong> on the Core or output —
                not error codes. The workshop simulator shows hints while you
                experiment.
              </p>
            </ProductQa>

            <ProductQa title="Does it need Wi-Fi?">
              <p>
                Weather and time update automatically while the Core is on
                Wi-Fi.
              </p>
              <p>
                Wi-Fi is built into the <strong>Core</strong>. It is not a cube
                in your sentence.
              </p>
            </ProductQa>
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
                {"note" in group && group.note && (
                  <p className="mt-1 pl-4 text-xs text-foundry-muted">
                    {group.note}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="font-medium text-foundry-ink">
            Snap them together to create behaviours.
          </p>

          <ProductQa title="How does a reminder enter your life?">
            <ul className="mt-1 space-y-1 text-foundry-muted">
              <li>
                <strong className="text-foundry-ink">Button</strong> — ask me
              </li>
              <li>
                <strong className="text-foundry-ink">Motion</strong> — notice me
              </li>
              <li>
                <strong className="text-foundry-ink">Timer</strong> — remind me
                later
              </li>
              <li>
                <strong className="text-foundry-ink">Display</strong> — tell me
              </li>
              <li>
                <strong className="text-foundry-ink">Glow</strong> — hint to me
              </li>
              <li>
                <strong className="text-foundry-ink">Chime</strong> — interrupt
                me
              </li>
            </ul>
          </ProductQa>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-foundry-border/80 bg-[#f5f5f4]/80 px-3">
            <p className="text-[9px] uppercase tracking-wide text-foundry-muted text-center pt-2">
              Place cube
            </p>
            <PlaceAssignVisual />
          </div>
          <div className="rounded-lg border border-foundry-border/80 bg-[#f5f5f4]/80 px-3">
            <p className="text-[9px] uppercase tracking-wide text-foundry-muted text-center pt-2">
              First hardware demo
            </p>
            <M6ProofChainVisual />
            <p className="text-[10px] text-center text-foundry-muted pb-2 px-1">
              Core provides power and Wi-Fi · semantic chain is Place → Weather
              → Glow
            </p>
          </div>
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
