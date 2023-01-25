import {
  SimpleAccountForTokens__factory,
  UserOperationStruct,
} from '@account-abstraction/contracts';
import {
  Keyring,
  KeyringView,
  KeyringViewInputFieldValue,
  KeyringViewUserInput,
} from '@epf-wallet/keyring-controller';
import {
  isValidPrivate,
  stripHexPrefix,
  publicToAddress,
  privateToPublic,
  bufferToHex,
} from '@ethereumjs/util';
// @ts-ignore
import randomBytes from 'randombytes';
import { SimpleAccountAPI } from '@account-abstraction/sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers, providers } from 'ethers';
import Joi from 'joi';

const MIN_PASSWORD_LENGTH = 3;
const MAX_PASSWORD_LENGTH = 30;

const nameSchema = Joi.string()
  .min(MIN_PASSWORD_LENGTH)
  .max(MAX_PASSWORD_LENGTH)
  .messages({
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name must be minimum of 3 characters',
    'string.max': 'Name cannot be more than 30 characters',
  });

const type = 'npm:@epf-wallet/simple-account';

const FACTORY_ADDRESS = '0x4e59b44847b379578588920ca78fbf26c0b4956c';

function generateKey() {
  const privateKey = randomBytes(32);
  // I don't think this is possible, but this validation was here previously,
  // so it has been preserved just in case.
  // istanbul ignore next
  if (!isValidPrivate(privateKey)) {
    throw new Error(
      'Private key does not satisfy the curve requirements (ie. it is invalid)'
    );
  }
  return privateKey;
}

export type WalletSerialized = {
  privateKey: string;
  address: string;
};

export type Wallet = {
  privateKey: Buffer;
  address: string;
  walletAPI: SimpleAccountAPI;
};

export const SimpleAccountKeyringBuilder = (
  entryPointAddress: string,
  provider: JsonRpcProvider
) => {
  return new SimpleAccountKeyring(entryPointAddress, provider);
};

SimpleAccountKeyringBuilder.type = type;

export default class SimpleAccountKeyring extends Keyring {
  readonly type: string = type;

  _wallets: Wallet[];

  constructor(entryPointAddress: string, provider: JsonRpcProvider) {
    super(entryPointAddress, provider);
    this._wallets = [];
  }

  init = async (): Promise<void> => {};

  serialize = async (): Promise<WalletSerialized[]> => {
    return await Promise.all(
      this._wallets.map(async ({ privateKey, address }) => ({
        privateKey: privateKey.toString('hex'),
        address: address,
      }))
    );
  };

  deserialize = async (walletSerialized: WalletSerialized[] = []) => {
    this._wallets = walletSerialized.map(({ privateKey, address }) => {
      const strippedHexPrivateKey = stripHexPrefix(privateKey);
      const privateKeyBuffer = Buffer.from(strippedHexPrivateKey, 'hex');
      const owner: ethers.Wallet = new ethers.Wallet(
        privateKey,
        this.ethersJsonProvider
      );
      const walletAPI = new SimpleAccountAPI({
        provider: this.ethersJsonProvider,
        entryPointAddress: this.entryPointAddress,
        owner,
        factoryAddress: FACTORY_ADDRESS,
        index: 0,
      });
      return { privateKey: privateKeyBuffer, address, walletAPI: walletAPI };
    });
  };

  defineNewAccountView = async (): Promise<KeyringView> => {
    return {
      title: 'Simple Account',
      description:
        'This exposes all of the behaviour of EOA in a smart contract',
      inputs: [
        {
          name: 'name',
          displayDescription: 'Name of the owner of account',
          type: 'input',
          displayName: 'Name',
          placeholder: "Enter owner's name",
          defaultValue: '',
        },
      ],
      isValid: async (inputs: Array<KeyringViewInputFieldValue>) => {
        const validation = nameSchema.validate(inputs[0].value);

        return [
          {
            error: Boolean(validation.error),
            message: validation.error?.message || '',
            name: inputs[0].name,
          },
        ];
      },
    };
  };

  addAccount = async (userInputs: KeyringViewUserInput): Promise<string[]> => {
    const privateKey = generateKey();
    const owner = new ethers.Wallet(privateKey, this.ethersJsonProvider);

    const walletAPI = new SimpleAccountAPI({
      provider: this.ethersJsonProvider,
      entryPointAddress: this.entryPointAddress,
      owner,
      factoryAddress: FACTORY_ADDRESS,
      index: 0,
    });

    const publicKey = await walletAPI.getAccountAddress();

    this._wallets.push({
      privateKey: privateKey,
      walletAPI: walletAPI,
      address: publicKey,
    });

    return [publicKey];
  };

  getAccounts = async (): Promise<string[]> => {
    return this._wallets.map(({ address }) => address);
  };

  signUserOperation = async (
    address: string,
    partialUserOperation: Partial<UserOperationStruct>,
    options?: object
  ): Promise<UserOperationStruct> => {
    const userOperation: UserOperationStruct = {
      sender: address,
      nonce: partialUserOperation.nonce || 0,
      initCode: partialUserOperation.initCode || '',
      callData: partialUserOperation.callData || '',
      callGasLimit: partialUserOperation.callGasLimit || 0,
      verificationGasLimit: partialUserOperation.verificationGasLimit || 0,
      preVerificationGas: partialUserOperation.preVerificationGas || 0,
      maxFeePerGas: partialUserOperation.maxFeePerGas || 0,
      maxPriorityFeePerGas: partialUserOperation.maxPriorityFeePerGas || 0,
      paymasterAndData: partialUserOperation.paymasterAndData || '',
      signature: '',
    };
    return userOperation;
  };

  signMessage = async (
    address: string,
    data: any,
    options?: object
  ): Promise<Buffer> => {
    return new Buffer('');
  };

  signPersonalMessage = async (
    address: string,
    data: any,
    options?: object
  ): Promise<Buffer> => {
    return new Buffer('');
  };

  getEncryptionPublicKey = async (
    address: string,
    options?: object
  ): Promise<Buffer> => {
    return new Buffer('');
  };

  decryptMessage = async (
    address: string,
    data: any,
    options?: object
  ): Promise<Buffer> => {
    return new Buffer('');
  };

  signTypedData = async (
    address: string,
    data: any,
    options?: object
  ): Promise<Buffer> => {
    return new Buffer('');
  };

  getAppKeyAddress = async (
    _address: string,
    origin: string
  ): Promise<string> => {
    return '';
  };

  exportAccount = async (
    address: string,
    options?: object
  ): Promise<string> => {
    return '';
  };
}
