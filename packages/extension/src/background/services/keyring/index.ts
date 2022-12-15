import { Keyring, KeyringMetadata } from '@common-types/keyrings';
import BaseService from '../base';
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

export default class KeyringService extends BaseService<Events> {
  constructor() {
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

    this.regiserEventListeners();
  }

  regiserEventListeners = () => {
    this.emitter.on('createPassword', this.createPassword);
  };

  createPassword = () => {};

  static async create() {
    return new KeyringService();
  }

  _startService = async (): Promise<void> => {};
  _stopService = async (): Promise<void> => {};

  /**
   * Setup a browser alarm to check if the keyring should be autolocked or now
   */
  autolockIfNeeded = () => {};
}
