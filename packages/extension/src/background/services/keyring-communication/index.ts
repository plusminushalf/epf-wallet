import {
  keyringLocked,
  keyringUnlocked,
  vaultUpdate,
} from '@background/redux-slices/keyrings';
import {
  ChromeMessages,
  CreatePasswordChromeMessage,
  UnlockedKeyringChromeMessage,
  UnlockKeyringChromeMessage,
} from '@common-types/chrome-messages';
import { Keyring, KeyringMetadata } from '@common-types/keyrings';
import { VaultState } from '@sandbox/services/keyring/keyring-controller';
import BaseService, { BaseServiceCreateProps } from '../base';
import MainServiceManager from '../main';
import { ServiceLifecycleEvents } from '../types';

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
  constructor(readonly mainServiceManager: MainServiceManager) {
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

  sendChromeMessages = (message: ChromeMessages<any>) => {
    chrome.runtime.sendMessage(message);
  };

  createPassword = async (password: string) => {
    const message: ChromeMessages<CreatePasswordChromeMessage> = {
      type: 'keyring/createPassword',
      data: {
        password,
      },
    };
    this.sendChromeMessages(message);
  };

  unlockKeyring = async (password: string) => {
    const message: ChromeMessages<UnlockKeyringChromeMessage> = {
      type: 'keyring/unlock',
      data: {
        password,
      },
    };
    this.sendChromeMessages(message);
  };

  keyringUnlocked = async ({ storeState }: UnlockedKeyringChromeMessage) => {
    if (storeState.isUnlocked) {
      this.mainServiceManager.store?.dispatch(keyringUnlocked());
    }
  };

  keyringLocked = async () => {
    this.mainServiceManager.store?.dispatch(keyringLocked());
  };

  vaultUpdate = async ({ vault }: { vault: VaultState }) => {
    this.mainServiceManager.store?.dispatch(vaultUpdate({ vault }));
  };

  handleChromeMessage: MessageRecievingHandler = async (
    message: ChromeMessages<any>,
    sender: chrome.runtime.MessageSender,
    sendResponse: Function
  ) => {
    if (sender.id !== chrome.runtime.id) return;

    switch (message.type) {
      case 'keyring/unlocked':
        return sendResponse(this.keyringUnlocked(message.data));
      case 'keyring/locked':
        return sendResponse(this.keyringLocked());
      case 'keyring/vaultUpdate':
        return sendResponse(this.vaultUpdate(message.data));
    }
  };

  static async create({
    mainServiceManager,
  }: KeyringServiceCreateProps): Promise<KeyringCommunicationService> {
    if (!mainServiceManager)
      throw new Error('mainServiceManager is needed for Keyring Servie');

    return new KeyringCommunicationService(mainServiceManager);
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
  autolockIfNeeded = () => {};
}
