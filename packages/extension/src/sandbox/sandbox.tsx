// import './lockdown';
import KeyringCommunicationService from './services/keyring';
import { render } from 'preact';
import { useEffect } from 'preact/hooks';
import MainServiceManager, {
  MainServiceManagerServicesMap,
} from '@background/services/main';

const serviceInitializer = async (
  mainServiceManager: MainServiceManager
): Promise<MainServiceManagerServicesMap> => {
  const keyringCommunicationService = await KeyringCommunicationService.create({
    mainServiceManager: mainServiceManager,
  });
  return {
    [KeyringCommunicationService.name]: keyringCommunicationService,
  };
};

export async function startMain(): Promise<MainServiceManager> {
  const mainService = await MainServiceManager.create(
    'sandbox',
    serviceInitializer,
    false
  );

  mainService.startService();

  return mainService.started();
}

const App = () => {
  useEffect(() => {
    let mainService: MainServiceManager;
    startMain().then((_mainService) => (mainService = _mainService));

    return () => {
      if (mainService) {
        mainService.stopService();
      }
    };
  }, []);

  return <></>;
};

render(<App />, document.getElementById('sandbox') as HTMLElement);
