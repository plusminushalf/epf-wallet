import './lockdown';
import KeyringCommunicationService from './services/keyring';
import { render } from 'preact';
import { useEffect } from 'preact/hooks';
import MainServiceManager, {
  MainServiceManagerServicesMap,
} from '@background/services/main';
import { VaultState } from './services/keyring/keyring-controller';

const serviceInitializer =
  (vault: VaultState) =>
  async (
    mainServiceManager: MainServiceManager
  ): Promise<MainServiceManagerServicesMap> => {
    const keyringCommunicationService =
      await KeyringCommunicationService.create({
        mainServiceManager: mainServiceManager,
        initialState: vault,
      });
    return {
      [KeyringCommunicationService.name]: keyringCommunicationService,
    };
  };

export async function startMain(
  vault: VaultState
): Promise<MainServiceManager> {
  const mainService = await MainServiceManager.create(
    'sandbox',
    serviceInitializer(vault)
  );

  mainService.startService();

  return mainService.started();
}

const App = (vault: VaultState) => {
  useEffect(() => {
    let mainService: MainServiceManager;
    startMain(vault).then((_mainService) => (mainService = _mainService));

    return () => {
      if (mainService) {
        mainService.stopService();
      }
    };
  }, []);

  return <></>;
};

const setupSandbox = ({ vault }: VaultState) => {
  render(
    <App vault={vault} />,
    document.getElementById('sandbox') as HTMLElement
  );
};

window.addEventListener('message', ({ data }: { data: string }) => {
  setupSandbox({ vault: data });
});
