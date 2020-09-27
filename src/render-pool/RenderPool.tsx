import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFunction } from '../hooks/useFunction';

type Props = {
  poolSize?: number;
}

type QueueElement = () => {
  canceled: boolean;
}

type RenderPoolContextType = {
  requestRender: () => [Promise<void>, () => void];
  reportRender: () => void;
}
const RenderPoolContext = React.createContext<RenderPoolContextType>({
  requestRender: () => [Promise.resolve(), () => {}],
  reportRender: () => {}
});

export const RenderPool: React.FC<Props> = ({
  children,
  poolSize = 1
}) => {
  const pendingRenders = useRef(0);
  const renderQueue = useRef<QueueElement[]>([]);

  const requestRender = useFunction((): [Promise<void>, () => void] => {
    let canceled = false;
    const promise = new Promise<void>(resolve => {
      if (pendingRenders.current >= poolSize) {
        renderQueue.current.push(() => {
          if (!canceled) {
            resolve();
          }
          return {canceled};
        });

        return;
      }
      pendingRenders.current += 1;

      resolve();
    });

    const cancel = () => {
      canceled = true;
    }

    return [
      promise,
      cancel
    ];
  });

  const reportRender = useFunction(() => {
    pendingRenders.current -= 1;

    if (renderQueue.current.length && pendingRenders.current < poolSize) {
      let next = renderQueue.current.shift();
      while (next) {
        const {canceled} = next();
        if (!canceled) {
          pendingRenders.current += 1;
          break;
        }

        next = renderQueue.current.shift();
      }
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
  const unsubscribeRef = useRef(() => {});

  useEffect(() => () => {
    unsubscribeRef.current();
  }, []);

  useEffect(() => {
    async function asyncEffect() {
      const [awaitRenderTurn, unsubscribe] = requestRender();
      unsubscribeRef.current = unsubscribe;
      await awaitRenderTurn;

      setReady(true);
    }

    asyncEffect();
  }, [requestRender]);

  useEffect(() => {
    if (ready) {
      requestAnimationFrame(() => {
        reportRender();
      })
    }
  }, [ready, reportRender]);

  if (!ready) {
    return null;
  }
  
  return <>{children}</>;
}
