import { render } from 'preact';
import { App } from './app';
import { Store } from 'webext-redux';
import { Provider } from 'react-redux';
import 'normalize.css';
import './main.css';
import { useEffect, useState } from 'preact/hooks';
import MainServiceManager, {
  MainServiceManagerServicesMap,
} from '@background/services/main';
import { AsyncifyFn, useBackgroundDispatch } from '@background/hooks';
import { BackgroundDispatch } from '@background/services/mainWithStore';
import { MainServiceContext } from './services';
import KeyringCommunicationService from '@app/services/keyring-communication';

const store = new Store();

const serviceInitializer =
  (dispatchBackground: AsyncifyFn<BackgroundDispatch>) =>
  async (
    mainServiceManager: MainServiceManager
  ): Promise<MainServiceManagerServicesMap> => {
    const keyringCommunicationService =
      await KeyringCommunicationService.create({
        mainServiceManager: mainServiceManager,
        dispatchBackground,
      });
    return {
      [KeyringCommunicationService.name]: keyringCommunicationService,
    };
  };

export async function startMain(
  dispatchBackground: AsyncifyFn<BackgroundDispatch>
): Promise<MainServiceManager> {
  const mainService = await MainServiceManager.create(
    'app',
    serviceInitializer(dispatchBackground)
  );

  mainService.startService();

  return mainService.started();
}

const RenderApp = () => {
  const [mainService, setMainService] = useState<MainServiceManager | null>(
    null
  );
  const dispatchBackground = useBackgroundDispatch();

  useEffect(() => {
    startMain(dispatchBackground)
      .then((mainService: MainServiceManager) => {
        setMainService(mainService);
      })
      .then(() => window.parent.postMessage('success'));

    return () => {
      if (mainService) {
        mainService.stopService();
      }
    };
  }, []);

  return (
    <MainServiceContext.Provider value={mainService}>
      {mainService ? <App /> : null}
    </MainServiceContext.Provider>
  );
};

store.ready().then(() => {
  render(
    <Provider store={store}>
      <RenderApp />
    </Provider>,
    document.getElementById('app') as HTMLElement
  );
});
