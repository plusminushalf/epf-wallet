import { useBackgroundSelector } from '@background/hooks';
import { useMemo, useRef, useEffect } from 'preact/hooks';
import RoutesMap, { RenderRoutes } from './routes/routes';
import { selectKeyringVault } from '@background/redux-slices/selectors/keyringsSelectors';

export function App() {
  const routes = useMemo(() => {
    return Object.keys(RoutesMap);
  }, [RoutesMap]);
  const iframeRef = useRef(null);
  const vault = useBackgroundSelector(selectKeyringVault);

  useEffect(() => {
    const loadEventListener = () => {
      iframeRef.current.contentWindow.postMessage(vault.vault);
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', loadEventListener);
      return () => {
        iframeRef.current.removeEventListener('load', loadEventListener);
      };
    }
  }, [iframeRef.current]);

  return (
    <div class="md:container md:mx-auto">
      <RenderRoutes routes={routes} />
      <iframe
        ref={iframeRef}
        width="0px"
        height="0px"
        src="../sandbox/sandbox.html"
      ></iframe>
    </div>
  );
}
