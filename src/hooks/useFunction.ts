import { useCallback, useRef } from "react";
 
export function useFunction<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef(callback);
  ref.current = callback;
 
  const callCurrent: T = useCallback((...args: Parameters<T>): ReturnType<T> => ref.current(...args), []) as T;
 
  return callCurrent;
}
