import { useSyncExternalStore } from "react";
import { getAnimTime, subscribeAnimTime } from "./anim-time";

export function useAnimTime(): number {
  return useSyncExternalStore(subscribeAnimTime, getAnimTime, () => 0);
}
