import { FoundryStage } from "./components/canvas/FoundryStage";
import { OverlayHUD } from "./components/OverlayHUD";
import { SimulationAudioBridge } from "./components/SimulationAudioBridge";

export default function App() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <SimulationAudioBridge />
      <FoundryStage />
      <OverlayHUD />
    </div>
  );
}
