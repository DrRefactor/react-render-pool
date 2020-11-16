import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFunction } from '../hooks/useFunction';
import { createVoidPromise, noop } from '../utils';
import ReactDOM from "react-dom"
import { useEffectOnce } from '../hooks/useEffectOnce';

type Props = {
  poolSize?: number;
  renderInterval?: number;
}

type QueueElement = (() => void) & {canceled?: boolean}

type RenderPoolContextType = {
  requestRender: (callback?: () => void) => {
    cancel: () => void;
  };
  reportRender: () => void;
}
const RenderPoolContext = React.createContext<RenderPoolContextType>({
  requestRender: () => ({cancel: noop}),
  reportRender: () => {}
});

export const RenderPool: React.FC<Props> = ({
  children,
  poolSize = 1,
  renderInterval = 100
}) => {
  const pendingRenders = useRef(0);
  const renderQueue = useRef<QueueElement[]>([]);

  const renderTimerId = useRef<number>(0);
  const onBatchDone = useRef<() => void>();

  const requestRender = useFunction((callback?: () => void): {cancel: () => void} => {
    const element = (() => {
      if (!element.canceled) {
        callback?.();
      }
    }) as QueueElement;
    renderQueue.current.push(element);

    const cancel = () => {
      element.canceled = true;
    }

    return {cancel};
  });

  const reportRender = useFunction(async () => {
    pendingRenders.current -= 1;

    if (pendingRenders.current === 0) {
      onBatchDone.current?.();
    }
  });

  const renderBatchIfIdle = useFunction(async () => {
    if (renderQueue.current.length === 0) {
      return;
    }

    if (pendingRenders.current === 0) {
      const {
        promise,
        resolve
      } = createVoidPromise();
      onBatchDone.current = resolve;

      ReactDOM.unstable_batchedUpdates(() => {
        while (renderQueue.current.length && pendingRenders.current < poolSize) {
          const next = renderQueue.current.shift();
          if (!next || next.canceled) {
            continue;
          }
          next();
  
          pendingRenders.current += 1;
        }
      })

      await promise;
    }
  });

  useEffectOnce(() => {
    let canceled = false;

    const tick = async () => {
      await renderBatchIfIdle();
      if (canceled) {
        return;
      }
      renderTimerId.current = window.setTimeout(tick, renderInterval);
    }
    renderTimerId.current = window.setTimeout(tick, renderInterval);

    return () => {
      clearTimeout(renderTimerId.current);
      renderTimerId.current = 0
      canceled = true;
    }
  });

  const contextValue = useMemo(() => ({
    requestRender,
    reportRender
  }), [reportRender, requestRender]);

  return (
    <RenderPoolContext.Provider value={contextValue}>
      {children}
    </RenderPoolContext.Provider>
  )
}

export const RenderPoolChild: React.FC = ({
  children
}) => {
  const [ready, setReady] = useState(false);
  const {reportRender, requestRender} = useContext(RenderPoolContext);
  const cancelRef = useRef(noop);

  useEffect(() => () => {
    cancelRef.current();
  }, []);

  useEffect(() => {
    async function asyncEffect() {
      const {cancel} = requestRender(() => setReady(true));
      cancelRef.current = cancel;
    }

    asyncEffect();
  }, [requestRender]);

  useEffect(() => {
    if (ready) {
      reportRender();
    }
  }, [ready, reportRender]);

  if (!ready) {
    return null;
  }
  
  return <>{children}</>;
}
