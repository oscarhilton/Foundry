import { useEffect, useState } from "react";
import type { ChainLayout } from "./layout";

const MOBILE_QUERY = "(max-width: 767px)";

export function useChainLayout(): { layout: ChainLayout; isMobile: boolean } {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(MOBILE_QUERY).matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return {
    layout: isMobile ? "vertical" : "horizontal",
    isMobile,
  };
}
