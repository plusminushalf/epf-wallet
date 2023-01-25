import { useBackgroundSelector } from '@background/hooks';
import { useMemo, useRef, useEffect, useState } from 'preact/hooks';
import RoutesMap, { RenderRoutes } from './routes/routes';
import {
  selectKeyringVault,
  selectLoadedKeyrings,
} from '@background/redux-slices/selectors/keyringsSelectors';

export function App() {
  const routes = useMemo(() => {
    return Object.keys(RoutesMap);
  }, [RoutesMap]);
  const iframeRef = useRef(null);
  const vault = useBackgroundSelector(selectKeyringVault);
  const keyrings = useBackgroundSelector(selectLoadedKeyrings);
  const [iframeLoaded, setIframeLoaded] = useState<
    'uninitialised' | 'loaded' | 'initialised'
  >('uninitialised');

  useEffect(() => {
    if (iframeRef.current && iframeLoaded === 'loaded') {
      const window = (iframeRef.current as HTMLIFrameElement).contentWindow;

      // TODO: change this to context
      const provider =
        'https://goerli.infura.io/v3/bdabe9d2f9244005af0f566398e648da';
      const entryPointAddress = '0x1306b01bC3e4AD202612D3843387e94737673F53';

      window &&
        window.postMessage({
          vault,
          keyrings,
          provider,
          entryPointAddress,
        });
    }
  }, [keyrings, vault, iframeLoaded]);

  useEffect(() => {
    const loadEventListener = () => {
      setIframeLoaded('loaded');
    };

    if (iframeRef.current) {
      (iframeRef.current as HTMLIFrameElement).addEventListener(
        'load',
        loadEventListener
      );
      return () => {
        iframeRef.current &&
          (iframeRef.current as HTMLIFrameElement).removeEventListener(
            'load',
            loadEventListener
          );
      };
    }
  }, [iframeRef.current]);

  useEffect(() => {
    const recieveMessageFromIframe = ({ data }: { data: string }) => {
      if (data === 'success') {
        setIframeLoaded('initialised');
      }
    };

    window.addEventListener('message', recieveMessageFromIframe);
    return () => {
      window.removeEventListener('message', recieveMessageFromIframe);
    };
  }, [window]);

  return (
    <div class="md:container md:mx-auto">
      {iframeLoaded === 'initialised' ? <RenderRoutes routes={routes} /> : null}
      <iframe
        ref={iframeRef}
        width="0px"
        height="0px"
        src="../sandbox/sandbox.html"
      ></iframe>
    </div>
  );
}
