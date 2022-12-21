import { Keyring, KeyringMetadata } from '@common-types/keyrings';
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

  createPassword = async (password: string) => {
    chrome.runtime.sendMessage({
      type: 'keyring/createPassword',
      password: password,
    });
  };

  handleChromeMessage: MessageRecievingHandler = async (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: Function
  ) => {};

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
