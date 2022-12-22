import {
  StoreState,
  VaultState,
} from '@sandbox/services/keyring/keyring-controller';

export type ChromeMessages<T> = {
  type:
    | 'keyring/createPassword'
    | 'keyring/createPasswordSuccess'
    | 'keyring/locked'
    | 'keyring/unlock'
    | 'keyring/unlocked'
    | 'keyring/vaultUpdate';
  data?: T;
};

export type CreatePasswordChromeMessage = {
  password: string;
};

export type UnlockedKeyringChromeMessage = {
  storeState: StoreState;
};

export type UnlockKeyringChromeMessage = {
  password: string;
};

export type vaultUpdate = {
  vault: VaultState;
};
