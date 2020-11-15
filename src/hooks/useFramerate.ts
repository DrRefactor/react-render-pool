import { useEffect, useRef } from "react";

export function useFramerate() {
  const fps = useRef<number>();

  useEffect(() => {
    let lastTimestamp = performance.now();
    function measure() {
      const now = performance.now()
      const elapsedMs = now - lastTimestamp;
      lastTimestamp = now;

      fps.current = 1000 / elapsedMs;
      console.log(`Framerate: ${Math.round(fps.current)} fps`);

      requestAnimationFrame(measure);
    }

    measure();
  }, []);

  return fps;
}