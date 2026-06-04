import { createContext, useContext, type ReactNode } from "react";
import type { ChainLayout } from "./layout";
import { useChainLayout } from "./useChainLayout";

interface CanvasLayoutValue {
  layout: ChainLayout;
  isMobile: boolean;
}

const CanvasLayoutContext = createContext<CanvasLayoutValue | null>(null);

export function CanvasLayoutProvider({ children }: { children: ReactNode }) {
  const value = useChainLayout();
  return (
    <CanvasLayoutContext.Provider value={value}>
      {children}
    </CanvasLayoutContext.Provider>
  );
}

export function useCanvasLayout(): CanvasLayoutValue {
  const ctx = useContext(CanvasLayoutContext);
  if (!ctx) {
    throw new Error("useCanvasLayout must be used within CanvasLayoutProvider");
  }
  return ctx;
}

/** Safe fallback when used outside provider (should not happen). */
export function useCanvasLayoutOptional(): CanvasLayoutValue {
  const ctx = useContext(CanvasLayoutContext);
  return ctx ?? { layout: "horizontal", isMobile: false };
}
