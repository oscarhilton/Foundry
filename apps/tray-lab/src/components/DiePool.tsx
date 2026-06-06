import type { WordDie } from "@foundry/cube-defs";
import { roleDisplayLabel } from "../store";
import { PoolDie } from "./WordDie";

interface DiePoolProps {
  dice: WordDie[];
  silent: boolean;
}

export function DiePool({ dice, silent }: DiePoolProps) {
  if (silent) {
    return (
      <div className="flex flex-wrap gap-4 justify-center max-w-[720px] mx-auto">
        {dice.map((die) => (
          <PoolDie key={die.id} die={die} />
        ))}
      </div>
    );
  }

  return (
    <section className="w-full max-w-[720px] mx-auto">
      <h2 className="text-xs uppercase tracking-widest text-tray-muted mb-3 text-center">
        Word cubes
      </h2>
      <div className="flex flex-wrap gap-4 justify-center">
        {dice.map((die) => (
          <div key={die.id} className="flex flex-col items-center gap-1">
            <PoolDie die={die} />
            <span className="text-[10px] text-tray-muted">
              {roleDisplayLabel(die.role)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-tray-muted mt-4">
        Drag into a slot · click a placed die to rotate
      </p>
    </section>
  );
}
