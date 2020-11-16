import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFunction } from '../hooks/useFunction';
import { delay, noop } from '../utils';

type Props = {
  poolSize?: number;
  renderInterval?: number;
}

type QueueElement = (() => void) & {canceled?: boolean}

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
  poolSize = 1,
  renderInterval = 100
}) => {
  const pendingRenders = useRef(0);
  const renderQueue = useRef<QueueElement[]>([]);

  const requestRender = useFunction((): [Promise<void>, () => void] => {
    let resolver = noop;
    let rejecter = noop;
    let element = noop as QueueElement;

    const promise = new Promise<void>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
    if (pendingRenders.current >= poolSize) {
      element = () => {
        if (!element.canceled) {
          resolver();
        }
      };
      renderQueue.current.push(element);
    } else {
      pendingRenders.current += 1;

      resolver();
    }

    const cancel = () => {
      element.canceled = true;
    }

    return [
      promise,
      cancel
    ];
  });

  const reportRender = useFunction(async () => {
    pendingRenders.current -= 1;

    if (renderQueue.current.length && pendingRenders.current < poolSize) {
      let next = renderQueue.current.shift();
      while (next) {
        if (next.canceled) {
          continue;
        }
        await delay(renderInterval);
        next();

        pendingRenders.current += 1;
        
        if (true) {
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
