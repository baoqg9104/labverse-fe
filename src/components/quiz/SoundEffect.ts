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
        const src = overrideUrl ?? url;
        if (!src) return;
        // Use a fresh Audio instance for each playback. Reusing the same
        // element can cause playback to silently fail on some browsers or
        // with certain formats (mp3/wav). Creating a new Audio is more
        // reliable for short UI sounds.
        const a = new Audio(src);
        a.volume = volume;
        // fire-and-forget; allow browser to handle autoplay policies
        void a.play().catch((err) => {
          // log for debugging if playback is blocked
          console.debug("sound play failed", src, err);
        });
      } catch (e) {
        console.debug("sound play error", e);
      }
    },
    [volume, url]
  );

  return play;
}
