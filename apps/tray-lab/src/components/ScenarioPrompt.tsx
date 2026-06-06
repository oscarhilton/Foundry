interface ScenarioPromptProps {
  prompt: string;
  silent: boolean;
}

export function ScenarioPrompt({ prompt, silent }: ScenarioPromptProps) {
  return (
    <header className="text-center max-w-lg mx-auto px-4">
      {!silent && (
        <p className="text-xs uppercase tracking-[0.2em] text-tray-muted mb-2">
          Morning leaving
        </p>
      )}
      <h1 className="text-xl md:text-2xl font-medium text-tray-ink leading-snug">
        {prompt}
      </h1>
    </header>
  );
}
