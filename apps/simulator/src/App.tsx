import { FoundryStage } from "./components/canvas/FoundryStage";
import { FoundryHeader } from "./components/FoundryHeader";
import { OverlayHUD } from "./components/OverlayHUD";
import { SimulationAudioBridge } from "./components/SimulationAudioBridge";

export default function App() {
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
