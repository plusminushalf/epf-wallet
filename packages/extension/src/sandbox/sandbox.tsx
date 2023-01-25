// import './lockdown';
import KeyringCommunicationService from './services/keyring';
import { render } from 'preact';
import { useEffect } from 'preact/hooks';
import MainServiceManager, {
  MainServiceManagerServicesMap,
} from '@background/services/main';
import { Vault } from '@background/redux-slices/keyrings';

console.log(Buffer);

const serviceInitializer =
  (
    vault: Vault,
    keyrings: Array<{ id: string; addresses: Array<string> }>,
    provider: string,
    entryPointAddress: string
  ) =>
  async (
    mainServiceManager: MainServiceManager
  ): Promise<MainServiceManagerServicesMap> => {
    const keyringCommunicationService =
      await KeyringCommunicationService.create({
        mainServiceManager: mainServiceManager,
        initialState: vault,
        keyrings: keyrings,
        provider: provider,
        entryPointAddress: entryPointAddress,
      });
    return {
      [KeyringCommunicationService.name]: keyringCommunicationService,
    };
  };

export async function startMain(
  vault: Vault,
  keyrings: Array<{ id: string; addresses: Array<string> }>,
  provider: string,
  entryPointAddress: string
): Promise<MainServiceManager> {
  const mainService = await MainServiceManager.create(
    'sandbox',
    serviceInitializer(vault, keyrings, provider, entryPointAddress)
  );

  mainService.startService();

  return mainService.started();
}

const App = ({
  vault,
  keyrings,
  provider,
  entryPointAddress,
}: {
  vault: Vault;
  keyrings: Array<{ id: string; addresses: Array<string> }>;
  provider: string;
  entryPointAddress: string;
}) => {
  useEffect(() => {
    let mainService: MainServiceManager;
    startMain(vault, keyrings, provider, entryPointAddress)
      .then((_mainService) => (mainService = _mainService))
      .then(() => window.parent.postMessage('success'));

    return () => {
      if (mainService) {
        mainService.stopService();
      }
    };
  }, [vault, keyrings, provider, entryPointAddress]);

  return <></>;
};

const setupSandbox = (
  vault: Vault,
  keyrings: Array<{ id: string; addresses: Array<string> }>,
  provider: string,
  entryPointAddress: string
) => {
  render(
    <App
      vault={vault}
      keyrings={keyrings}
      provider={provider}
      entryPointAddress={entryPointAddress}
    />,
    document.getElementById('sandbox') as HTMLElement
  );
};

window.addEventListener(
  'message',
  ({
    data,
  }: {
    data: {
      vault: Vault;
      keyrings: Array<{ id: string; addresses: Array<string> }>;
      provider: string;
      entryPointAddress: string;
    };
  }) => {
    setupSandbox(
      data.vault,
      data.keyrings,
      data.provider,
      data.entryPointAddress
    );
  }
);
