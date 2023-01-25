import { AsyncifyFn } from '@background/hooks';
import {
  keyringLocked,
  keyringUnlocked,
  Vault,
  vaultUpdate,
  setNewAccountView,
} from '@background/redux-slices/keyrings';
import { selectKeyringView } from '@background/redux-slices/selectors/keyringsSelectors';
import { BackgroundDispatch } from '@background/services/mainWithStore';
import {
  AddAcount,
  ChromeMessages,
  CreateKeyringForImplementation,
  CreatePasswordChromeMessage,
  KeyringInputErrorMessage,
  NewAccountView,
  UnlockedKeyringChromeMessage,
  UnlockKeyringChromeMessage,
  ValidateKeyringViewInputValue,
} from '@common-types/chrome-messages';
import { Keyring, KeyringMetadata } from '@common-types/keyrings';
import {
  KeyringInputError,
  KeyringView,
  KeyringViewUserInput,
} from '@epf-wallet/keyring-controller';
import BaseService, {
  BaseServiceCreateProps,
} from '../../../background/services/base';
import MainServiceManager from '../../../background/services/main';
import { ServiceLifecycleEvents } from '../../../background/services/types';

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
  dispatchBackground: AsyncifyFn<BackgroundDispatch>;
} & BaseServiceCreateProps;

type MessageRecievingHandler = (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: Function
) => Promise<void>;

export default class KeyringCommunicationService extends BaseService<Events> {
  constructor(
    readonly mainServiceManager: MainServiceManager,
    readonly dispatchBackground: AsyncifyFn<BackgroundDispatch>
  ) {
    super({
      autolock: {
        schedule: {
          periodInMinutes: 5,
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

  sendChromeMessages = async (message: ChromeMessages<any>) => {
    return chrome.runtime.sendMessage<ChromeMessages<any>, ChromeMessages<any>>(
      message
    );
  };

  addAccount = async (
    implementation: string,
    userInputs: KeyringViewUserInput
  ) => {
    const message: ChromeMessages<AddAcount> = {
      type: 'keyring/addAcount',
      data: {
        implementation,
        userInputs,
      },
    };
    this.sendChromeMessages(message);
  };

  createPassword = async (password: string) => {
    const message: ChromeMessages<CreatePasswordChromeMessage> = {
      type: 'keyring/createPassword',
      data: {
        password,
      },
    };
    const response: ChromeMessages<UnlockedKeyringChromeMessage> =
      await this.sendChromeMessages(message);

    this.keyringUnlocked(response.data as UnlockedKeyringChromeMessage);
  };

  isValidKeyringViewInput =
    (implementation: string) =>
    async (value: any): Promise<Array<KeyringInputError>> => {
      const message: ChromeMessages<ValidateKeyringViewInputValue> = {
        type: 'keyring/validateKeyringViewInputValue',
        data: {
          implementation,
          inputs: value,
        },
      };

      const response: ChromeMessages<KeyringInputErrorMessage> =
        await this.sendChromeMessages(message);

      return response.data?.errors || [];
    };

  getKeyringViewConnection = (
    implementation: string,
    keyringViewState: KeyringView
  ): KeyringView => {
    return {
      ...keyringViewState,
      isValid: this.isValidKeyringViewInput(implementation),
    };
  };

  createKeyringForImplementation = async (implementation: string) => {
    const message: ChromeMessages<CreateKeyringForImplementation> = {
      type: 'keyring/createKeyringForImplementation',
      data: {
        implementation,
      },
    };
    const response: ChromeMessages<NewAccountView> =
      await this.sendChromeMessages(message);
    this.setNewAccountView(response.data as NewAccountView);
  };

  unlockKeyring = async (password: string) => {
    const message: ChromeMessages<UnlockKeyringChromeMessage> = {
      type: 'keyring/unlock',
      data: {
        password,
      },
    };
    const response: ChromeMessages<UnlockedKeyringChromeMessage> =
      await this.sendChromeMessages(message);

    this.keyringUnlocked(response.data as UnlockedKeyringChromeMessage);
  };

  keyringUnlocked = async ({ storeState }: UnlockedKeyringChromeMessage) => {
    if (storeState.isUnlocked) {
      this.dispatchBackground(keyringUnlocked(storeState.isUnlocked));
    }
  };

  keyringLocked = async () => {
    this.dispatchBackground(keyringLocked());
  };

  vaultUpdate = async ({ vault, encryptionKey, encryptionSalt }: Vault) => {
    this.dispatchBackground(
      vaultUpdate({ vault, encryptionKey, encryptionSalt })
    );
  };

  setNewAccountView = async (view: NewAccountView) => {
    this.dispatchBackground(setNewAccountView(view));
  };

  handleChromeMessage: MessageRecievingHandler = async (
    message: ChromeMessages<any>,
    sender: chrome.runtime.MessageSender,
    sendResponse: Function
  ) => {
    if (sender.id !== chrome.runtime.id) return;

    switch (message.type) {
      case 'keyring/unlocked':
        this.keyringUnlocked(message.data);
      case 'keyring/locked':
        this.keyringLocked();
      case 'keyring/vaultUpdate':
        this.vaultUpdate(message.data);
    }
  };

  static async create({
    mainServiceManager,
    dispatchBackground,
  }: KeyringServiceCreateProps): Promise<KeyringCommunicationService> {
    if (!mainServiceManager)
      throw new Error('mainServiceManager is needed for Keyring Servie');

    return new KeyringCommunicationService(
      mainServiceManager,
      dispatchBackground
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
  autolockIfNeeded = () => {
    this.keyringLocked();
    this.sendChromeMessages({
      type: 'keyring/locked',
    });
  };
}
