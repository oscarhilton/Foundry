import type { TrayTranslation } from "@foundry/runtime";

interface TrayDisplayProps {
  translation: TrayTranslation;
}

export function TrayDisplay({ translation }: TrayDisplayProps) {
  const { slots, localTranslations, finalOutput, finalOutputTone } = translation;
  const hintsOnly = finalOutputTone === "invalid" && finalOutput === null;

  return (
    <div className="flex flex-col gap-3 w-full max-w-[720px] mx-auto">
      <div className="grid grid-cols-5 gap-2">
        {localTranslations.map((local, index) => (
          <div
            key={`local-${index}`}
            className="min-h-[44px] rounded-sm bg-tray-lcd/60 px-2 py-1.5 flex items-center justify-center text-center"
          >
            <LocalZone text={local} slot={slots[index]} />
          </div>
        ))}
      </div>

      {!hintsOnly && finalOutput && (
        <>
          <div className="border-t border-tray-ink/10" />
          <p
            className={[
              "text-center font-medium leading-snug px-2",
              finalOutputTone === "timer" ? "text-lg tabular-nums" : "text-base",
            ].join(" ")}
          >
            {finalOutput}
          </p>
        </>
      )}
    </div>
  );
}

function LocalZone({
  text,
  slot,
}: {
  text: string | null;
  slot: TrayTranslation["slots"][number] | undefined;
}) {
  if (text) {
    return (
      <span className="text-tray-ink text-sm leading-snug font-medium whitespace-pre-line">
        {text}
      </span>
    );
  }

  if (slot?.kind === "hint") {
    return (
      <span className="text-tray-hint text-xs leading-snug font-normal">
        {slot.value}
      </span>
    );
  }

  return <span className="text-tray-hint/40 text-sm">&nbsp;</span>;
}
