import { MainServiceContext } from '@app/services';
import KeyringCommunicationService from '@app/services/keyring-communication';
import { useContext } from 'preact/hooks';

export const useKeyringCommunicationService =
  (): KeyringCommunicationService => {
    const mainServiceManager = useContext(MainServiceContext);

    return mainServiceManager?.getService(
      KeyringCommunicationService.name
    ) as KeyringCommunicationService;
  };
