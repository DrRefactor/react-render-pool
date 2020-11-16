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

export function createVoidPromise(): {
  promise: Promise<void>;
  resolve: () => void;
  reject: () => void;
} {
  let resolveInternal = noop;
  let rejectInternal = noop;

  const promise = new Promise<void>((resolve, reject) => {
    resolveInternal = resolve;
    rejectInternal = reject;
  })

  const resolve = () => resolveInternal();
  const reject = () => rejectInternal();

  return {
    promise,
    resolve,
    reject
  };
}
