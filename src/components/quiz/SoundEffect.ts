import { useEffect, useMemo, useRef } from "react";

type Options = {
  volume?: number; // 0..1
};

export function useSound(url?: string, opts: Options = {}) {
  const { volume = 0.6 } = opts;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.volume = volume;
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [url, volume]);

  const play = useMemo(
    () => (overrideUrl?: string) => {
      try {
        if (overrideUrl) {
          const a = new Audio(overrideUrl);
          a.volume = volume;
          a.play();
          return;
        }
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
        audioRef.current?.play();
      } catch {
        // noop
      }
    },
    [volume]
  );

  return play;
}
