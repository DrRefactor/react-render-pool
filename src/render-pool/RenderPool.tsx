import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFunction } from '../hooks/useFunction';

type Props = {
  poolSize?: number;
}

type RenderPoolContextType = {
  requestRender: () => Promise<void>;
  // TODO add 'unmount' message channel
  reportRender: () => void;
}
const RenderPoolContext = React.createContext<RenderPoolContextType>({
  requestRender: () => Promise.resolve(),
  reportRender: () => {}
});

export const RenderPool: React.FC<Props> = ({
  children,
  poolSize = 1
}) => {
  const pendingRenders = useRef(0);
  const renderQueue = useRef<(() => void)[]>([]);

  const requestRender = useFunction(async (): Promise<void> => {
    return new Promise(resolve => {
      if (pendingRenders.current === poolSize) {
        renderQueue.current.push(resolve);
        return;
      }

      pendingRenders.current += 1;

      resolve();
    })
  });
  const reportRender = useFunction(() => {
    pendingRenders.current -= 1;

    if (renderQueue.current.length) {
      pendingRenders.current += 1;
      renderQueue.current.shift()?.();
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

  useEffect(() => {
    async function asyncEffect() {
      // TODO handle unmount
      await requestRender();

      setReady(true);
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
