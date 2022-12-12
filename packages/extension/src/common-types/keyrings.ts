export type Keyring = {
  type: KeyringTypes;
  id: string | null;
  addresses: string[];
};

export interface KeyringMetadata {
  source: 'import' | 'internal';
}

export enum KeyringTypes {
  mnemonicBIP39S128 = 'mnemonic#bip39:128',
  mnemonicBIP39S256 = 'mnemonic#bip39:256',
  metamaskMnemonic = 'mnemonic#metamask',
  singleSECP = 'single#secp256k1',
}
