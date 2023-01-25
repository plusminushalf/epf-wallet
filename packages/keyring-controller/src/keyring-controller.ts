import * as encryptor from '@metamask/browser-passworder';
import { normalize as normalizeAddress } from '@metamask/eth-sig-util';
import { EventEmitter } from 'events';
import { ObservableStore } from './obs-store';
import { UserOperationStruct } from '@account-abstraction/contracts';
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';

const defaultKeyringBuilders: keyringBuilder[] = [];

const KEYRINGS_TYPE_MAP = {
  HD_KEYRING: 'HD Key Tree',
  SIMPLE_KEYRING: 'Simple Key Pair',
};

/**
 * Strip the hex prefix from an address, if present.
 *
 * @param {string} address - The address that might be hex prefixed.
 * @returns {string} The address without a hex prefix.
 */
function stripHexPrefix(address: string) {
  if (address.startsWith('0x')) {
    return address.slice(2);
  }
  return address;
}

export type KeyringInputError = {
  name: string;
  error: boolean;
  message: string;
};

export type KeyringViewInputFieldValue = {
  name: string;
  value: any;
};

export type KeyringViewInputField = {
  type: 'input' | 'QR' | '...etc';
  name: string; // any unique name for this input
  displayName: string;
  displayDescription: string;
  placeholder: string;
  defaultValue: any;
};

export type KeyringView = {
  title: string;
  description: string;
  inputs: Array<KeyringViewInputField>;
  isValid: (
    inputs: Array<KeyringViewInputFieldValue>
  ) => Promise<Array<KeyringInputError>>;
};

export type KeyringViewUserInput = {
  // name key is KeyringViewInputField.name
  [name: string]: any;
};

export abstract class Keyring {
  abstract type: string;
  constructor(
    readonly entryPointAddress: string,
    readonly ethersJsonProvider: JsonRpcProvider
  ) {}
  abstract serialize: () => Promise<object>;
  abstract deserialize: (data: any) => Promise<void>;
  abstract addAccount: (userInputs: KeyringViewUserInput) => Promise<string[]>;
  abstract getAccounts: () => Promise<string[]>;
  abstract defineNewAccountView: () => Promise<KeyringView | undefined>;
  abstract signUserOperation: (
    address: string,
    userOperation: Partial<UserOperationStruct>,
    options?: object
  ) => Promise<UserOperationStruct>;
  abstract signMessage: (
    address: string,
    data: any,
    options?: object
  ) => Promise<Buffer>;
  abstract signPersonalMessage: (
    address: string,
    data: any,
    options?: object
  ) => Promise<Buffer>;
  abstract getEncryptionPublicKey: (
    address: string,
    options?: object
  ) => Promise<Buffer>;
  abstract decryptMessage: (
    address: string,
    data: any,
    options?: object
  ) => Promise<Buffer>;
  abstract signTypedData: (
    address: string,
    data: any,
    options?: object
  ) => Promise<Buffer>;
  abstract getAppKeyAddress: (
    _address: string,
    origin: string
  ) => Promise<string>;
  abstract exportAccount: (
    address: string,
    options?: object
  ) => Promise<string>;
  abstract init?: () => Promise<void>;
  abstract generateRandomMnemonic?: () => void;
  abstract removeAccount?: (address: string) => void;
  abstract forgetDevice?: () => any;
}

export type keyringBuilder = {
  (entryPointAddress: string, provider: JsonRpcProvider): Keyring;
  type: string;
};

type KeyringSerialisedStateForMemStore = { type: string; accounts: string[] };

export type StoreState = {
  isUnlocked: boolean;
  keyringTypes: string[];
  keyrings: KeyringSerialisedStateForMemStore[];
  encryptionKey?: string;
  encryptionSalt?: string;
};

export type KeyringControllerOptions = {
  entryPointAddress: string;
  initState: VaultState;
  keyringBuilders?: keyringBuilder[];
  encryptor?: typeof encryptor;
  cacheEncryptionKey?: boolean;
  provider: string;
};

type KeyringSerialisedState = {
  type: string;
  data: any;
};

export type VaultState = {
  vault: string;
};

export class KeyringController extends EventEmitter {
  //
  // PUBLIC METHODS
  //

  keyringBuilders: keyringBuilder[];
  store: ObservableStore<VaultState>;
  memStore: ObservableStore<StoreState>;
  encryptor: typeof encryptor;
  keyrings: Keyring[];
  _unsupportedKeyrings: KeyringSerialisedState[];
  cacheEncryptionKey: boolean;
  password?: string;
  entryPointAddress: string;
  provider: JsonRpcProvider;

  constructor(opts: KeyringControllerOptions) {
    super();
    const initState = opts.initState || {};
    this.entryPointAddress = opts.entryPointAddress;
    this.keyringBuilders = opts.keyringBuilders
      ? defaultKeyringBuilders.concat(opts.keyringBuilders)
      : defaultKeyringBuilders;
    this.store = new ObservableStore(initState);
    this.memStore = new ObservableStore({
      isUnlocked: false,
      keyringTypes: this.keyringBuilders.map(
        (keyringBuilder) => keyringBuilder.type
      ),
      keyrings: [],
      encryptionKey: undefined,
      encryptionSalt: undefined,
    });
    this.provider = new ethers.providers.JsonRpcBatchProvider(opts.provider);

    this.encryptor = opts.encryptor || encryptor;
    this.keyrings = [];
    this._unsupportedKeyrings = [];

    // This option allows the controller to cache an exported key
    // for use in decrypting and encrypting data without password
    this.cacheEncryptionKey = Boolean(opts.cacheEncryptionKey);
  }

  /**
   * Full Update
   *
   * Emits the `update` event and @returns a Promise that resolves to
   * the current state.
   *
   * Frequently used to end asynchronous chains in this class,
   * indicating consumers can often either listen for updates,
   * or accept a state-resolving promise to consume their results.
   *
   * @returns {object} The controller state.
   */
  fullUpdate(): StoreState {
    this.emit('vaultUpdate', this.memStore.getState());
    return this.memStore.getState();
  }

  /**
   * Create New Vault And Keychain
   *
   * Destroys any old encrypted storage,
   * creates a new encrypted store with the given password,
   * randomly creates a new HD wallet with 1 account,
   * faucets that account on the testnet.
   *
   * @fires KeyringController#unlock
   * @param {string} password - The password to encrypt the vault with.
   * @returns {Promise<object>} A Promise that resolves to the state.
   */
  async createNewVault(password: string): Promise<StoreState> {
    this.password = password;

    await this.persistAllKeyrings();
    this.setUnlocked();
    return this.fullUpdate();
  }

  /**
   * CreateNewVaultAndRestore
   *
   * Destroys any old encrypted storage,
   * creates a new encrypted store with the given password,
   * creates a new HD wallet from the given seed with 1 account.
   *
   * @fires KeyringController#unlock
   * @param {string} password - The password to encrypt the vault with.
   * @param {Uint8Array | string} seedPhrase - The BIP39-compliant seed phrase,
   * either as a string or Uint8Array.
   * @returns {Promise<object>} A Promise that resolves to the state.
   */
  async createNewVaultAndRestore(
    password: string,
    seedPhrase: Uint8Array | string
  ): Promise<StoreState> {
    if (typeof password !== 'string') {
      throw new Error('Password must be text.');
    }
    this.password = password;

    await this.clearKeyrings();
    const keyring = await this.addNewKeyring(KEYRINGS_TYPE_MAP.HD_KEYRING, {
      mnemonic: seedPhrase,
      numberOfAccounts: 1,
    });
    const [firstAccount] = await keyring.getAccounts();

    if (!firstAccount) {
      throw new Error('KeyringController - First Account not found.');
    }
    this.setUnlocked();
    return this.fullUpdate();
  }

  /**
   * Set Locked
   * This method deallocates all secrets, and effectively locks MetaMask.
   *
   * @fires KeyringController#lock
   * @returns {Promise<object>} A Promise that resolves to the state.
   */
  async setLocked(): Promise<StoreState> {
    delete this.password;

    // set locked
    this.memStore.updateState({
      isUnlocked: false,
      encryptionKey: undefined,
      encryptionSalt: undefined,
    });

    // remove keyrings
    this.keyrings = [];
    await this._updateMemStoreKeyrings();
    this.emit('lock');
    return this.fullUpdate();
  }

  /**
   * Submit password.
   *
   * Attempts to decrypt the current vault and load its keyrings
   * into memory.
   *
   * Temporarily also migrates any old-style vaults first, as well
   * (Pre MetaMask 3.0.0).
   *
   * @fires KeyringController#unlock
   * @param {string} password - The keyring controller password.
   * @returns {Promise<object>} A Promise that resolves to the state.
   */
  async submitPassword(password: string): Promise<StoreState> {
    this.keyrings = await this.unlockKeyrings(password);

    this.setUnlocked();
    return this.fullUpdate();
  }

  /**
   * Submit Encryption Key.
   *
   * Attempts to decrypt the current vault and load its keyrings
   * into memory based on the vault and CryptoKey information.
   *
   * @fires KeyringController#unlock
   * @param {string} encryptionKey - The encrypted key information used to decrypt the vault.
   * @param {string} encryptionSalt - The salt used to generate the last key.
   * @returns {Promise<object>} A Promise that resolves to the state.
   */
  async submitEncryptionKey(
    encryptionKey: string,
    encryptionSalt: string
  ): Promise<StoreState> {
    this.keyrings = await this.unlockKeyrings(
      undefined,
      encryptionKey,
      encryptionSalt
    );
    this.setUnlocked();
    return this.fullUpdate();
  }

  /**
   * Verify Password
   *
   * Attempts to decrypt the current vault with a given password
   * to verify its validity.
   *
   * @param {string} password - The vault password.
   */
  async verifyPassword(password: string): Promise<void> {
    const encryptedVault = this.store.getState().vault;
    if (!encryptedVault) {
      throw new Error('Cannot unlock without a previous vault.');
    }
    await this.encryptor.decrypt(password, encryptedVault);
  }

  /**
   * Add New Keyring
   *
   * Adds a new Keyring of the given `type` to the vault
   * and the current decrypted Keyrings array.
   *
   * All Keyring classes implement a unique `type` string,
   * and this is used to retrieve them from the keyringBuilders array.
   *
   * @param {string} type - The type of keyring to add.
   * @param {object} opts - The constructor options for the keyring.
   * @returns {Promise<Keyring>} The new keyring.
   */
  async addNewKeyring(type: string, opts?: any): Promise<Keyring> {
    const keyring = await this._newKeyring(type, opts);

    const accounts = await keyring.getAccounts();
    await this.checkForDuplicate(type, accounts);

    this.keyrings.push(keyring);
    await this.persistAllKeyrings();

    this.fullUpdate();

    return keyring;
  }

  /**
   * Remove Empty Keyrings.
   *
   * Loops through the keyrings and removes the ones with empty accounts
   * (usually after removing the last / only account) from a keyring.
   */
  async removeEmptyKeyrings() {
    const validKeyrings: Keyring[] = [];

    // Since getAccounts returns a Promise
    // We need to wait to hear back form each keyring
    // in order to decide which ones are now valid (accounts.length > 0)

    await Promise.all(
      this.keyrings.map(async (keyring) => {
        const accounts = await keyring.getAccounts();
        if (accounts.length > 0) {
          validKeyrings.push(keyring);
        }
      })
    );
    this.keyrings = validKeyrings;
  }

  /**
   * Checks for duplicate keypairs, using the the first account in the given
   * array. Rejects if a duplicate is found.
   *
   * Only supports 'Simple Key Pair'.
   *
   * @param {string} type - The key pair type to check for.
   * @param {Array<string>} newAccountArray - Array of new accounts.
   * @returns {Promise<Array<string>>} The account, if no duplicate is found.
   */
  async checkForDuplicate(
    type: string,
    newAccountArray: string[]
  ): Promise<string[]> {
    const accounts = await this.getAccounts();

    switch (type) {
      case KEYRINGS_TYPE_MAP.SIMPLE_KEYRING: {
        const isIncluded = Boolean(
          accounts.find(
            (key) =>
              key === newAccountArray[0] ||
              key === stripHexPrefix(newAccountArray[0])
          )
        );

        if (isIncluded) {
          throw new Error(
            'The account you are trying to import is a duplicate'
          );
        }
        return newAccountArray;
      }

      default: {
        return newAccountArray;
      }
    }
  }

  /**
   * Add New Account.
   *
   * Calls the `addAccounts` method on the given keyring,
   * and then saves those changes.
   *
   * @param {Keyring} selectedKeyring - The currently selected keyring.
   * @returns {Promise<object>} A Promise that resolves to the state.
   */
  async addNewAccount(
    selectedKeyring: Keyring,
    userInputs: KeyringViewUserInput
  ): Promise<StoreState> {
    const accounts = await selectedKeyring.addAccount(userInputs);
    accounts.forEach((hexAccount) => {
      this.emit('newAccount', hexAccount);
    });

    await this.persistAllKeyrings();
    return this.fullUpdate();
  }

  /**
   * Export Account
   *
   * Requests the private key from the keyring controlling
   * the specified address.
   *
   * Returns a Promise that may resolve with the private key string.
   *
   * @param {string} address - The address of the account to export.
   * @returns {Promise<string>} The private key of the account.
   */
  async exportAccount(address: string): Promise<string> {
    const keyring = await this.getKeyringForAccount(address);
    return await keyring.exportAccount(normalizeAddress(address));
  }

  /**
   * Remove Account.
   *
   * Removes a specific account from a keyring
   * If the account is the last/only one then it also removes the keyring.
   *
   * @param {string} address - The address of the account to remove.
   * @returns {Promise<void>} A Promise that resolves if the operation was successful.
   */
  async removeAccount(address: string): Promise<StoreState> {
    const keyring = await this.getKeyringForAccount(address);

    // Not all the keyrings support this, so we have to check
    if (typeof keyring.removeAccount === 'function') {
      keyring.removeAccount(address);
      this.emit('removedAccount', address);
    } else {
      throw new Error(
        `Keyring ${keyring.type} doesn't support account removal operations`
      );
    }

    const accounts = await keyring.getAccounts();
    // Check if this was the last/only account
    if (accounts.length === 0) {
      await this.removeEmptyKeyrings();
    }

    await this.persistAllKeyrings();
    return this.fullUpdate();
  }

  //
  // SIGNING METHODS
  //

  /**
   * Sign Ethereum Transaction
   *
   * Signs an Ethereum transaction object.
   *
   * @param {object} ethTx - The transaction to sign.
   * @param {string} _fromAddress - The transaction 'from' address.
   * @param {object} opts - Signing options.
   * @returns {Promise<object>} The signed transaction object.
   */
  async signTransaction(
    ethTx: UserOperationStruct,
    _fromAddress: string,
    opts: object = {}
  ): Promise<object> {
    const fromAddress = normalizeAddress(_fromAddress);
    const keyring = await this.getKeyringForAccount(fromAddress);
    return await keyring.signUserOperation(fromAddress, ethTx, opts);
  }

  /**
   * Sign Message
   *
   * Attempts to sign the provided message parameters.
   *
   * @param {object} msgParams - The message parameters to sign.
   * @param {object} opts - Additional signing options.
   * @returns {Promise<Buffer>} The raw signature.
   */
  async signMessage(
    msgParams: { from: string; data: any },
    opts: object = {}
  ): Promise<Buffer> {
    const address = normalizeAddress(msgParams.from);
    const keyring = await this.getKeyringForAccount(address);
    return await keyring.signMessage(address, msgParams.data, opts);
  }

  /**
   * Sign Personal Message
   *
   * Attempts to sign the provided message parameters.
   * Prefixes the hash before signing per the personal sign expectation.
   *
   * @param {object} msgParams - The message parameters to sign.
   * @param {object} opts - Additional signing options.
   * @returns {Promise<Buffer>} The raw signature.
   */
  async signPersonalMessage(
    msgParams: { from: string; data: any },
    opts = {}
  ): Promise<Buffer> {
    const address = normalizeAddress(msgParams.from);
    const keyring = await this.getKeyringForAccount(address);
    return await keyring.signPersonalMessage(address, msgParams.data, opts);
  }

  /**
   * Get encryption public key
   *
   * Get encryption public key for using in encrypt/decrypt process.
   *
   * @param {object} address - The address to get the encryption public key for.
   * @param {object} opts - Additional encryption options.
   * @returns {Promise<Buffer>} The public key.
   */
  async getEncryptionPublicKey(address: string, opts = {}): Promise<Buffer> {
    const normalizedAddress = normalizeAddress(address);
    const keyring = await this.getKeyringForAccount(address);
    return await keyring.getEncryptionPublicKey(normalizedAddress, opts);
  }

  /**
   * Decrypt Message
   *
   * Attempts to decrypt the provided message parameters.
   *
   * @param {object} msgParams - The decryption message parameters.
   * @param {object} opts - Additional decryption options.
   * @returns {Promise<Buffer>} The raw decryption result.
   */
  async decryptMessage(
    msgParams: { from: string; data: any },
    opts = {}
  ): Promise<Buffer> {
    const address = normalizeAddress(msgParams.from);
    const keyring = await this.getKeyringForAccount(address);
    return keyring.decryptMessage(address, msgParams.data, opts);
  }

  /**
   * Sign Typed Data.
   *
   * @see {@link https://github.com/ethereum/EIPs/pull/712#issuecomment-329988454|EIP712}.
   * @param {object} msgParams - The message parameters to sign.
   * @param {object} opts - Additional signing options.
   * @returns {Promise<Buffer>} The raw signature.
   */
  async signTypedMessage(
    msgParams: { from: string; data: any },
    opts: object = { version: 'V1' }
  ): Promise<Buffer> {
    const address = normalizeAddress(msgParams.from);
    const keyring = await this.getKeyringForAccount(address);
    return keyring.signTypedData(address, msgParams.data, opts);
  }

  /**
   * Gets the app key address for the given Ethereum address and origin.
   *
   * @param {string} _address - The Ethereum address for the app key.
   * @param {string} origin - The origin for the app key.
   * @returns {string} The app key address.
   */
  async getAppKeyAddress(_address: string, origin: string): Promise<string> {
    const address = normalizeAddress(_address);
    const keyring = await this.getKeyringForAccount(address);
    return keyring.getAppKeyAddress(address, origin);
  }

  /**
   * Exports an app key private key for the given Ethereum address and origin.
   *
   * @param {string} _address - The Ethereum address for the app key.
   * @param {string} origin - The origin for the app key.
   * @returns {string} The app key private key.
   */
  async exportAppKeyForAddress(
    _address: string,
    origin: string
  ): Promise<string> {
    const address = normalizeAddress(_address);
    const keyring = await this.getKeyringForAccount(address);
    // The "in" operator is typically restricted because it also checks inherited properties,
    // which can be unexpected for plain objects. We're allowing it here because `keyring` is not
    // a plain object, and we explicitly want to include inherited methods in this check.
    // eslint-disable-next-line no-restricted-syntax
    if (!('exportAccount' in keyring)) {
      throw new Error(
        `The keyring for address ${_address} does not support exporting.`
      );
    }
    return keyring.exportAccount(address, { withAppKeyOrigin: origin });
  }

  //
  // PRIVATE METHODS
  //

  /**
   * Create First Key Tree.
   *
   * - Clears the existing vault.
   * - Creates a new vault.
   * - Creates a random new HD Keyring with 1 account.
   * - Makes that account the selected account.
   * - Faucets that account on testnet.
   * - Puts the current seed words into the state tree.
   *
   * @returns {Promise<void>} A promise that resolves if the operation was successful.
   */
  async createFirstKeyTree(): Promise<void> {
    this.clearKeyrings();

    const keyring: Keyring = await this.addNewKeyring(
      KEYRINGS_TYPE_MAP.HD_KEYRING
    );
    const [firstAccount]: string[] = await keyring.getAccounts();
    if (!firstAccount) {
      throw new Error('KeyringController - No account found on keychain.');
    }

    const hexAccount: string = normalizeAddress(firstAccount);
    this.emit('newVault', hexAccount);
  }

  /**
   * Persist All Keyrings
   *
   * Iterates the current `keyrings` array,
   * serializes each one into a serialized array,
   * encrypts that array with the provided `password`,
   * and persists that encrypted string to storage.
   *
   * @returns {Promise<boolean>} Resolves to true once keyrings are persisted.
   */
  async persistAllKeyrings(): Promise<void> {
    const { encryptionKey, encryptionSalt } = this.memStore.getState();

    if (!this.password && !encryptionKey) {
      throw new Error(
        'Cannot persist vault without password and encryption key'
      );
    }

    const serializedKeyrings = await Promise.all(
      this.keyrings.map(async (keyring) => {
        const [type, data] = await Promise.all([
          keyring.type,
          keyring.serialize(),
        ]);
        return { type, data };
      })
    );

    serializedKeyrings.push(...this._unsupportedKeyrings);

    let vault;
    let newEncryptionKey;
    let newEncryptionSalt;

    if (this.cacheEncryptionKey) {
      if (this.password) {
        const { vault: newVault, exportedKeyString } =
          await this.encryptor.encryptWithDetail(
            this.password,
            serializedKeyrings
          );

        vault = newVault;
        newEncryptionKey = exportedKeyString;
        newEncryptionSalt = JSON.parse(newVault).salt;
      } else if (encryptionKey) {
        const key = await this.encryptor.importKey(encryptionKey);
        const vaultJSON = await this.encryptor.encryptWithKey(
          key,
          serializedKeyrings
        );
        vaultJSON.salt = encryptionSalt;
        vault = JSON.stringify(vaultJSON);
      }
    } else {
      vault = await this.encryptor.encrypt(
        this.password || '',
        serializedKeyrings
      );
    }

    if (!vault) {
      throw new Error('Cannot persist vault without vault information');
    }

    this.store.updateState({ vault });

    // The keyring updates need to be announced before updating the encryptionKey
    // so that the updated keyring gets propagated to the extension first.
    // Not calling _updateMemStoreKeyrings results in the wrong account being selected
    // in the extension.
    await this._updateMemStoreKeyrings();
    if (newEncryptionKey) {
      this.memStore.updateState({
        encryptionKey: newEncryptionKey,
        encryptionSalt: newEncryptionSalt,
      });
    }
    this.emit('vaultUpdate', { vault });
  }

  /**
   * Unlock Keyrings.
   *
   * Attempts to unlock the persisted encrypted storage,
   * initializing the persisted keyrings to RAM.
   *
   * @param {string} password - The keyring controller password.
   * @param {string} encryptionKey - An exported key string to unlock keyrings with.
   * @param {string} encryptionSalt - The salt used to encrypt the vault.
   * @returns {Promise<Array<Keyring>>} The keyrings.
   */
  async unlockKeyrings(
    password?: string,
    encryptionKey?: string,
    encryptionSalt?: string
  ): Promise<Keyring[]> {
    const encryptedVault = this.store.getState().vault;
    if (!encryptedVault) {
      throw new Error('Cannot unlock without a previous vault.');
    }

    await this.clearKeyrings();

    let vault: any;

    if (this.cacheEncryptionKey) {
      if (password) {
        const result = await this.encryptor.decryptWithDetail(
          password,
          encryptedVault
        );
        vault = result.vault;
        this.password = password;

        this.memStore.updateState({
          encryptionKey: result.exportedKeyString,
          encryptionSalt: result.salt,
        });
      } else {
        const parsedEncryptedVault = JSON.parse(encryptedVault);

        if (encryptionSalt !== parsedEncryptedVault.salt) {
          throw new Error('Encryption key and salt provided are expired');
        }

        const key = await this.encryptor.importKey(encryptionKey || '');
        vault = await this.encryptor.decryptWithKey(key, parsedEncryptedVault);

        // This call is required on the first call because encryptionKey
        // is not yet inside the memStore
        this.memStore.updateState({
          encryptionKey,
          encryptionSalt,
        });
      }
    } else {
      vault = await this.encryptor.decrypt(password || '', encryptedVault);
      this.password = password;
    }

    await Promise.all(vault.map(this._restoreKeyring.bind(this)));
    await this._updateMemStoreKeyrings();
    return this.keyrings;
  }

  /**
   * Restore Keyring
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, updates the memStore keyrings and returns the resulting
   * keyring instance.
   *
   * @param {object} serialized - The serialized keyring.
   * @returns {Promise<Keyring>} The deserialized keyring.
   */
  async restoreKeyring(
    serialized: KeyringSerialisedState
  ): Promise<Keyring | undefined> {
    const keyring: Keyring | undefined = await this._restoreKeyring(serialized);
    if (keyring) {
      await this._updateMemStoreKeyrings();
    }
    return keyring;
  }

  /**
   * Restore Keyring Helper
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, returns the resulting keyring instance.
   *
   * @param {object} serialized - The serialized keyring.
   * @returns {Promise<Keyring|undefined>} The deserialized keyring or undefined if the keyring type is unsupported.
   */
  async _restoreKeyring(
    serialized: KeyringSerialisedState
  ): Promise<Keyring | undefined> {
    const { type, data } = serialized;

    const keyring = await this._newKeyring(type, data);
    if (!keyring) {
      this._unsupportedKeyrings.push(serialized);
      return undefined;
    }

    // getAccounts also validates the accounts for some keyrings
    await keyring.getAccounts();
    this.keyrings.push(keyring);

    return keyring;
  }

  /**
   * Get Keyring Class For Type
   *
   * Searches the current `keyringBuilders` array
   * for a Keyring builder whose unique `type` property
   * matches the provided `type`,
   * returning it if it exists.
   *
   * @param {string} type - The type whose class to get.
   * @returns {Keyring|undefined} The class, if it exists.
   */
  getKeyringBuilderForType(type: string): keyringBuilder | undefined {
    return this.keyringBuilders.find(
      (keyringBuilder) => keyringBuilder.type === type
    );
  }

  /**
   * Get Keyrings by Type
   *
   * Gets all keyrings of the given type.
   *
   * @param {string} type - The keyring types to retrieve.
   * @returns {Array<Keyring>} The keyrings.
   */
  getKeyringsByType(type: string): Keyring[] {
    return this.keyrings.filter((keyring) => keyring.type === type);
  }

  /**
   * Get Accounts
   *
   * Returns the public addresses of all current accounts
   * managed by all currently unlocked keyrings.
   *
   * @returns {Promise<Array<string>>} The array of accounts.
   */
  async getAccounts(): Promise<string[]> {
    const keyrings = this.keyrings || [];

    const keyringArrays = await Promise.all(
      keyrings.map((keyring) => keyring.getAccounts())
    );
    const addresses = keyringArrays.reduce((res, arr) => {
      return res.concat(arr);
    }, []);

    return addresses.map(normalizeAddress);
  }

  /**
   * Get Keyring For Account
   *
   * Returns the currently initialized keyring that manages
   * the specified `address` if one exists.
   *
   * @param {string} address - An account address.
   * @returns {Promise<Keyring>} The keyring of the account, if it exists.
   */
  async getKeyringForAccount(address: string): Promise<Keyring> {
    const hexed = normalizeAddress(address);

    const candidates = await Promise.all(
      this.keyrings.map((keyring) => {
        return Promise.all([keyring, keyring.getAccounts()]);
      })
    );

    const winners = candidates.filter((candidate) => {
      const accounts = candidate[1].map(normalizeAddress);
      return accounts.includes(hexed);
    });
    if (winners && winners.length > 0) {
      return winners[0][0];
    }

    // Adding more info to the error
    let errorInfo = '';
    if (!address) {
      errorInfo = 'The address passed in is invalid/empty';
    } else if (!candidates || !candidates.length) {
      errorInfo = 'There are no keyrings';
    } else if (!winners || !winners.length) {
      errorInfo = 'There are keyrings, but none match the address';
    }
    throw new Error(
      `No keyring found for the requested account. Error info: ${errorInfo}`
    );
  }

  /**
   * Display For Keyring
   *
   * Is used for adding the current keyrings to the state object.
   *
   * @param {Keyring} keyring - The keyring to display.
   * @returns {Promise<object>} A keyring display object, with type and accounts properties.
   */
  async displayForKeyring(
    keyring: Keyring
  ): Promise<KeyringSerialisedStateForMemStore> {
    const accounts = await keyring.getAccounts();

    return {
      type: keyring.type,
      accounts: accounts.map(normalizeAddress),
    };
  }

  /**
   * Clear Keyrings
   *
   * Deallocates all currently managed keyrings and accounts.
   * Used before initializing a new vault.
   */

  /* eslint-disable require-await */
  async clearKeyrings(): Promise<void> {
    // clear keyrings from memory
    this.keyrings = [];
    this.memStore.updateState({
      keyrings: [],
    });
  }

  /**
   * Update memStore Keyrings
   *
   * Updates the in-memory keyrings, without persisting.
   */
  async _updateMemStoreKeyrings() {
    const keyrings = await Promise.all(
      this.keyrings.map(this.displayForKeyring)
    );
    return this.memStore.updateState({ keyrings });
  }

  /**
   * Unlock Keyrings
   *
   * Unlocks the keyrings.
   *
   * @fires KeyringController#unlock
   */
  setUnlocked(): void {
    this.memStore.updateState({ isUnlocked: true });
    this.emit('unlock');
  }

  /**
   * Forget hardware keyring.
   *
   * Forget hardware and update memorized state.
   *
   * @param {Keyring} keyring - The keyring to forget.
   */
  forgetKeyring(keyring: Keyring): void {
    if (keyring.forgetDevice) {
      keyring.forgetDevice();
      this.persistAllKeyrings();
    } else {
      throw new Error(
        `KeyringController - keyring does not have method "forgetDevice", keyring type: ${keyring.type}`
      );
    }
  }

  /**
   * Instantiate, initialize and return a new keyring
   *
   * The keyring instantiated is of the given `type`.
   *
   * @param {string} type - The type of keyring to add.
   * @param {object} data - The data to restore a previously serialized keyring.
   * @returns {Promise<Keyring>} The new keyring.
   */
  async _newKeyring(type: string, data: any): Promise<Keyring> {
    const keyringBuilder = this.getKeyringBuilderForType(type);

    if (!keyringBuilder) {
      throw new Error('Keyring Builder not found');
    }

    const keyring = keyringBuilder(this.entryPointAddress, this.provider);

    await keyring.deserialize(data);

    if (keyring.init) {
      await keyring.init();
    }

    return keyring;
  }
}

/**
 * Get builder function for `Keyring`
 *
 * Returns a builder function for `Keyring` with a `type` property.
 *
 * @param {Keyring} Keyring - The Keyring class for the builder.
 * @returns {Function} A builder function for the given Keyring.
 */
export function keyringBuilderFactory(Keyring: any): keyringBuilder {
  const builder = (entryPointAddress: string) => new Keyring(entryPointAddress);

  builder.type = Keyring.type;

  return builder;
}
