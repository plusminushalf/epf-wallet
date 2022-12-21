import BaseService, { BaseServiceCreateProps } from '@background/services/base';
import MainServiceManager from '@background/services/main';
import { ServiceLifecycleEvents } from '@background/services/types';
import { Keyring, KeyringMetadata } from '@common-types/keyrings';
import { KeyringController } from './keyring-controller';

interface Events extends ServiceLifecycleEvents {
  createPassword: string;
  locked: boolean;
  keyrings: {
    keyrings: Keyring[];
    keyringMetadata: {
      [keyringId: string]: KeyringMetadata;
    };
  };
  address: string;
}

export type KeyringServiceCreateProps = {} & BaseServiceCreateProps;

type MessageRecievingHandler = (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: Function
) => Promise<void>;

export default class KeyringCommunicationService extends BaseService<Events> {
  constructor(
    readonly mainServiceManager: MainServiceManager,
    readonly keyringController: KeyringController
  ) {
    super({
      autolock: {
        schedule: {
          periodInMinutes: 1,
        },
        handler: () => {
          this.autolockIfNeeded();
        },
      },
    });
  }

  registerEventListeners = () => {
    chrome.runtime.onMessage.addListener(this.handleChromeMessage);
  };

  removeEventListeners = () => {
    chrome.runtime.onMessage.removeListener(this.handleChromeMessage);
  };

  createPassword = async (message: { type: string; password: string }) => {
    console.log('we are here?', message.password);
    await this.keyringController.createNewVaultAndKeychain(message.password);
    console.log(await this.keyringController.getAccounts());
  };

  handleChromeMessage: MessageRecievingHandler = async (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: Function
  ) => {
    if (message.type === 'keyring/createPassword') {
      sendResponse(await this.createPassword(message));
    }
  };

  static async create({
    mainServiceManager,
  }: KeyringServiceCreateProps): Promise<KeyringCommunicationService> {
    if (!mainServiceManager)
      throw new Error('mainServiceManager is needed for Keyring Servie');

    const keyringController = new KeyringController({
      initState: {},
    });

    return new KeyringCommunicationService(
      mainServiceManager,
      keyringController
    );
  }

  _startService = async (): Promise<void> => {
    this.registerEventListeners();
  };

  _stopService = async (): Promise<void> => {
    console.log('here');
    this.removeEventListeners();
  };

  /**
   * Set ups a browser alarm to check if the keyring should be autolocked or now
   */
  autolockIfNeeded = () => {};
}
