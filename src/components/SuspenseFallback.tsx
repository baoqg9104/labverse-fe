// No need to import React in React 17+ with JSX transform
import { Hypnosis } from "react-cssfx-loading";

export default function SuspenseFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-lime-400/20 blur-2xl" />
        <Hypnosis color="#a3e635" width="64px" height="64px" duration="1.2s" />
      </div>
    </div>
  );
}
