import BaseService, { BaseServiceCreateProps } from '@background/services/base';
import MainServiceManager from '@background/services/main';
import { ServiceLifecycleEvents } from '@background/services/types';
import {
  ChromeMessages,
  CreatePasswordChromeMessage,
  UnlockedKeyringChromeMessage,
  UnlockKeyringChromeMessage,
} from '@common-types/chrome-messages';
import { Keyring, KeyringMetadata } from '@common-types/keyrings';
import {
  KeyringController,
  StoreState,
  VaultState,
} from './keyring-controller';

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

export type KeyringServiceCreateProps = {
  initialState?: VaultState;
} & BaseServiceCreateProps;

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
    this.keyringController.on('vaultUpdate', this.updateStore);
    chrome.runtime.onMessage.addListener(this.handleChromeMessage);
  };

  removeEventListeners = () => {
    chrome.runtime.onMessage.removeListener(this.handleChromeMessage);
  };

  sendChromeMessages = (message: ChromeMessages<any>) => {
    chrome.runtime.sendMessage(message);
  };

  updateStore = () => {
    const vault = this.keyringController.store.getState();
    this.sendChromeMessages({
      type: 'keyring/vaultUpdate',
      data: {
        vault,
      },
    });
  };

  createPassword = async (password: string) => {
    const storeState = await this.keyringController.createNewVault(password);
    /**
     * We must send the response via chrome messages too as sendResponse function
     * doesn't work always. It sometimes leads to a problem of port closing.
     * TODO:// Find if there is a workaround for this
     */
    this.sendUnlockKeyringChromeMessage(storeState);
    return storeState;
  };

  sendUnlockKeyringChromeMessage = (storeState: StoreState) => {
    const message: ChromeMessages<UnlockedKeyringChromeMessage> = {
      type: 'keyring/unlocked',
      data: {
        storeState,
      },
    };

    this.sendChromeMessages(message);
  };

  unlockKeyring = async (password: string) => {
    try {
      const storeState = await this.keyringController.submitPassword(password);
      this.sendUnlockKeyringChromeMessage(storeState);
      return storeState;
    } catch (e) {
      // Wrong password
      console.log(e);
    }
  };

  handleChromeMessage: MessageRecievingHandler = async (
    message: ChromeMessages<any>,
    sender: chrome.runtime.MessageSender,
    sendResponse: Function
  ) => {
    if (sender.id !== chrome.runtime.id) return;
    switch (message.type) {
      case 'keyring/createPassword':
        return sendResponse(
          await this.createPassword(
            (message.data as CreatePasswordChromeMessage).password
          )
        );
      case 'keyring/unlock':
        return sendResponse(
          await this.unlockKeyring(
            (message.data as UnlockKeyringChromeMessage).password
          )
        );
      default:
        return null;
    }
  };

  static async create({
    mainServiceManager,
    initialState,
  }: KeyringServiceCreateProps): Promise<KeyringCommunicationService> {
    if (!mainServiceManager)
      throw new Error('mainServiceManager is needed for Keyring Servie');

    const keyringController = new KeyringController({
      initState: initialState || {
        vault: '',
      },
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
    this.removeEventListeners();
  };

  /**
   * Set ups a browser alarm to check if the keyring should be autolocked or now
   */
  autolockIfNeeded = async () => {
    await this.keyringController.setLocked();
    console.log('Keyring Locked hahahah');
    this.sendChromeMessages({
      type: 'keyring/locked',
    });
  };
}
