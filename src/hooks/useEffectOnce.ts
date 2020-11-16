import {useEffect, EffectCallback} from 'react';

// Make this explicit instead of disabling eslint
export function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []);
}