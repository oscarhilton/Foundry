import { useEffect, useState } from "react";
import { FoundryStage } from "./components/canvas/FoundryStage";
import { FoundryHeader } from "./components/FoundryHeader";
import { OverlayHUD } from "./components/OverlayHUD";
import { SimulationAudioBridge } from "./components/SimulationAudioBridge";
import { ShowcasePage } from "./showcase/ShowcasePage";
import { isShowcaseView } from "./showcase/showcase-nav";

export default function App() {
  const [showcase, setShowcase] = useState(() => isShowcaseView());

  useEffect(() => {
    const sync = () => setShowcase(isShowcaseView());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  if (showcase) {
    return <ShowcasePage />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f4]">
      <SimulationAudioBridge />
      <FoundryHeader />
      <main className="flex min-h-0 flex-1 flex-col">
        <FoundryStage />
      </main>
      <OverlayHUD />
    </div>
  );
}
