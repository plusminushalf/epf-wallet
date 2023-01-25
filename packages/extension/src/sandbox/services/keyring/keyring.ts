import { Vault } from '@background/redux-slices/keyrings';
import BaseService, { BaseServiceCreateProps } from '@background/services/base';
import MainServiceManager from '@background/services/main';
import { ServiceLifecycleEvents } from '@background/services/types';
import {
  ChromeMessages,
  CreateKeyringForImplementation,
  CreatePasswordChromeMessage,
  NewAccountView,
  UnlockedKeyringChromeMessage,
  UnlockKeyringChromeMessage,
  ValidateKeyringViewInputValue,
  KeyringInputErrorMessage,
} from '@common-types/chrome-messages';
import { Keyring, KeyringMetadata } from '@common-types/keyrings';
import {
  keyringBuilder,
  KeyringController,
  KeyringInputError,
  KeyringViewInputFieldValue,
  KeyringViewUserInput,
  StoreState,
  VaultState,
} from '@epf-wallet/keyring-controller';
import { SimpleAccountKeyringBuilder } from '@epf-wallet/simple-account';

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

const keyringBuilders: keyringBuilder[] = [SimpleAccountKeyringBuilder];

export type KeyringServiceCreateProps = {
  initialState?: Vault;
  keyrings: Array<{ id: string; addresses: Array<string> }>;
  provider: string;
  entryPointAddress: string;
} & BaseServiceCreateProps;

type MessageRecievingHandler = (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: Function
) => boolean;

export default class KeyringCommunicationService extends BaseService<Events> {
  KeyringInputValidationMap: {
    [implementation: string]: (
      inputs: Array<KeyringViewInputFieldValue>
    ) => Promise<Array<KeyringInputError>>;
  } = {};

  constructor(
    readonly mainServiceManager: MainServiceManager,
    readonly keyringController: KeyringController
  ) {
    super();
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
    const { encryptionKey, encryptionSalt } =
      this.keyringController.memStore.getState();
    this.sendChromeMessages({
      type: 'keyring/vaultUpdate',
      data: {
        vault: vault.vault,
        encryptionKey,
        encryptionSalt,
      },
    });
  };

  createPassword = async (password: string) => {
    const storeState = await this.keyringController.createNewVault(password);
    return this.sendUnlockKeyringChromeMessage(storeState);
  };

  sendUnlockKeyringChromeMessage = (storeState: StoreState) => {
    const message: ChromeMessages<UnlockedKeyringChromeMessage> = {
      type: 'keyring/unlocked',
      data: {
        storeState,
      },
    };

    return message;
  };

  unlockKeyring = async (password: string) => {
    try {
      const storeState = await this.keyringController.submitPassword(password);
      return this.sendUnlockKeyringChromeMessage(storeState);
    } catch (e) {
      // Wrong password
      console.log(e);
    }
  };

  createKeyringForImplementation = async (implementation: string) => {
    try {
      const existingKeyrings =
        this.keyringController.getKeyringsByType(implementation);
      let keyring = existingKeyrings[0];
      if (existingKeyrings.length === 0) {
        keyring = await this.keyringController.addNewKeyring(implementation);
      }

      const view = await keyring.defineNewAccountView();
      const message: ChromeMessages<NewAccountView> = {
        type: 'keyring/newAccountView',
        data: {
          implementation: implementation,
          view: view,
        },
      };
      if (view?.isValid) {
        this.KeyringInputValidationMap[implementation] = view?.isValid;
      }

      return message;
    } catch (e) {
      console.log(e, '--');
    }
  };

  _handleChromeMessage = async (message: ChromeMessages<any>): Promise<any> => {
    switch (message.type) {
      case 'keyring/createPassword':
        return this.createPassword(
          (message.data as CreatePasswordChromeMessage).password
        );
      case 'keyring/unlock':
        return this.unlockKeyring(
          (message.data as UnlockKeyringChromeMessage).password
        );
      case 'keyring/locked':
        return this.keyringController.setLocked();
      case 'keyring/createKeyringForImplementation':
        return this.createKeyringForImplementation(
          (message.data as CreateKeyringForImplementation).implementation
        );
      case 'keyring/validateKeyringViewInputValue':
        return this.validateKeyringViewInputValue(
          (message.data as ValidateKeyringViewInputValue).implementation,
          (message.data as ValidateKeyringViewInputValue).inputs
        );
      case 'keyring/addAcount':
        return this.addAccount({ ...message.data });
      default:
        return false;
    }
  };

  addAccount = async ({
    implementation,
    userInputs,
  }: {
    implementation: string;
    userInputs: KeyringViewUserInput;
  }) => {
    const keyring = this.keyringController.getKeyringsByType(implementation)[0];
    console.log(keyring);
    if (!keyring) return;

    this.keyringController.addNewAccount(keyring, userInputs);
  };

  validateKeyringViewInputValue = async (
    implementation: string,
    inputs: Array<KeyringViewInputFieldValue>
  ): Promise<ChromeMessages<KeyringInputErrorMessage>> => {
    const errors = this.KeyringInputValidationMap[implementation]
      ? await this.KeyringInputValidationMap[implementation](inputs)
      : [];

    return {
      type: 'keyring/validateKeyringViewInputValue',
      data: {
        errors,
      },
    };
  };

  handleChromeMessage: MessageRecievingHandler = (
    message: ChromeMessages<any>,
    sender: chrome.runtime.MessageSender,
    sendResponse: Function
  ): boolean => {
    if (sender.id !== chrome.runtime.id) return false;

    this._handleChromeMessage(message).then((response: any) => {
      sendResponse(response);
    });

    return true;
  };

  static async create({
    mainServiceManager,
    initialState,
    keyrings = [],
    provider,
    entryPointAddress,
  }: KeyringServiceCreateProps): Promise<KeyringCommunicationService> {
    if (!mainServiceManager)
      throw new Error('mainServiceManager is needed for Keyring Servie');

    const keyringController = new KeyringController({
      provider: provider,
      entryPointAddress: entryPointAddress,
      initState: initialState?.vault
        ? { vault: initialState.vault }
        : {
            vault: '',
          },
      keyringBuilders: keyringBuilders,
      cacheEncryptionKey: true,
    });

    if (initialState?.encryptionKey) {
      await keyringController.unlockKeyrings(
        undefined,
        initialState.encryptionKey,
        initialState.encryptionSalt
      );
    }

    const keyringCommunicationService = new KeyringCommunicationService(
      mainServiceManager,
      keyringController
    );

    keyrings.map((keyring) => {
      keyringCommunicationService.createKeyringForImplementation(keyring.id);
    });

    return keyringCommunicationService;
  }

  _startService = async (): Promise<void> => {
    this.registerEventListeners();
  };

  _stopService = async (): Promise<void> => {
    this.removeEventListeners();
  };
}
