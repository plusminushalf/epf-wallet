import { createSlice } from '@reduxjs/toolkit';
import { Keyring, KeyringMetadata } from '@common-types/keyrings';
import { createBackgroundAsyncThunk } from './utils';
import KeyringCommunicationService from '@background/services/keyring-communication';
import { string } from 'joi';
import { VaultState } from '@sandbox/services/keyring/keyring-controller';

type KeyringsState = {
  keyrings: Keyring[];
  keyringMetadata: {
    [keyringId: string]: KeyringMetadata;
  };
  importing: false | 'pending' | 'done';
  status: 'locked' | 'unlocked' | 'uninitialized';
  vault: VaultState;
  keyringToVerify: {
    id: string;
    mnemonic: string[];
  } | null;
};

export const initialState: KeyringsState = {
  keyrings: [],
  keyringMetadata: {},
  vault: {
    vault: '',
  },
  importing: false,
  status: 'uninitialized',
  keyringToVerify: null,
};

const keyringsSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    keyringLocked: (state) => ({ ...state, status: 'locked' }),
    keyringUnlocked: (state) => ({ ...state, status: 'unlocked' }),
    vaultUpdate: (
      state,
      { payload: { vault } }: { payload: { vault: VaultState } }
    ) => ({ ...state, vault }),
  },
});

export const { keyringLocked, keyringUnlocked, vaultUpdate } =
  keyringsSlice.actions;
export default keyringsSlice.reducer;

/**
 * -------------------------------
 * Background Actions
 * -------------------------------
 */

export const createPassword = createBackgroundAsyncThunk(
  'keyrings/createPassword',
  async (password: string, { extra: { mainServiceManager } }) => {
    (
      mainServiceManager.getService(
        KeyringCommunicationService.name
      ) as KeyringCommunicationService
    ).createPassword(password);
  }
);

export const unlockKeyring = createBackgroundAsyncThunk(
  'keyring/unlockKeyring',
  async (password: string, { extra: { mainServiceManager } }) => {
    (
      mainServiceManager.getService(
        KeyringCommunicationService.name
      ) as KeyringCommunicationService
    ).unlockKeyring(password);
  }
);
