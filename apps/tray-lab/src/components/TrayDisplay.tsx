import type { TrayTranslation } from "@foundry/runtime";

interface TrayDisplayProps {
  translation: TrayTranslation;
}

export function TrayDisplay({ translation }: TrayDisplayProps) {
  const { slots, localTranslations, finalOutput, finalOutputTone } = translation;
  const showFinal =
    finalOutput !== null &&
    (finalOutputTone === "answer" ||
      finalOutputTone === "timer" ||
      finalOutputTone === "hint");

  return (
    <div className="flex flex-col gap-3 w-full max-w-[720px] mx-auto">
      <div className="rounded-sm bg-tray-lcd min-h-[44px] px-2 py-2">
        <div className="grid grid-cols-5 gap-0">
          {localTranslations.map((local, index) => (
            <div
              key={`local-${index}`}
              className="flex items-center justify-center text-center px-1"
            >
              <LocalZone text={local} slot={slots[index]} />
            </div>
          ))}
        </div>
      </div>

      {showFinal && (
        <>
          <div className="border-t border-tray-ink/10" />
          <p
            className={[
              "text-center leading-snug px-2",
              finalOutputTone === "timer"
                ? "text-lg tabular-nums font-medium"
                : finalOutputTone === "hint"
                  ? "text-sm text-tray-hint font-normal"
                  : "text-base font-medium",
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
  if (!text) {
    return <span className="text-tray-hint/40 text-sm">&nbsp;</span>;
  }

  const isHint = slot?.kind === "hint";

  return (
    <span
      className={[
        "text-sm leading-snug whitespace-pre-line",
        isHint ? "text-tray-hint font-normal" : "text-tray-ink font-medium",
      ].join(" ")}
    >
      {text}
    </span>
  );
}
