import { useEffect, useRef } from "react";

const lowFramerateThreshold = 40;

export function useFramerate() {
  const fps = useRef<number>();

  const overthresholdCount = useRef(0);
  const underthresholdCount = useRef(0);

  useEffect(() => {
    let lastTimestamp = performance.now();
    function measure() {
      const now = performance.now()
      const elapsedMs = now - lastTimestamp;
      lastTimestamp = now;

      fps.current = 1000 / elapsedMs;
      if (fps.current < lowFramerateThreshold) {
        underthresholdCount.current++;
        console.log(`Framerate: ${Math.round(fps.current)} fps`);
      } else {
        overthresholdCount.current++;
      }

      const totalMeasurements = overthresholdCount.current + underthresholdCount.current;
      const lowFramerateRatio = underthresholdCount.current / totalMeasurements;
      console.log(`Framerate under threshold of ${lowFramerateThreshold} percentage: ${Math.round(lowFramerateRatio * 100)}%`);

      requestAnimationFrame(measure);
    }

    measure();
  }, []);

  return fps;
}