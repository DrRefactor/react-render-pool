export function noop() {}

export function range(length: number) {
  return (new Array(length)).fill(null).map((_, i) => i);
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function awaitAnimationFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

