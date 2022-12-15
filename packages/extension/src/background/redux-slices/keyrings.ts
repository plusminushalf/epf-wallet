import { createSlice } from '@reduxjs/toolkit';
import { Keyring, KeyringMetadata } from '@common-types/keyrings';
import { createBackgroundAsyncThunk } from './utils';
import KeyringService from '@background/services/keyring';

type KeyringsState = {
  keyrings: Keyring[];
  keyringMetadata: {
    [keyringId: string]: KeyringMetadata;
  };
  importing: false | 'pending' | 'done';
  status: 'locked' | 'unlocked' | 'uninitialized';
  keyringToVerify: {
    id: string;
    mnemonic: string[];
  } | null;
};

export const initialState: KeyringsState = {
  keyrings: [],
  keyringMetadata: {},
  importing: false,
  status: 'uninitialized',
  keyringToVerify: null,
};

const keyringsSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    incrementByAmount() {},
  },
});

export const { incrementByAmount } = keyringsSlice.actions;
export default keyringsSlice.reducer;

/**
 * -------------------------------
 * Background Actions
 * -------------------------------
 */

export const createPassword = createBackgroundAsyncThunk(
  'keyrings/createPassword',
  async (password: string, { extra: { mainServiceManager } }) => {
    await mainServiceManager
      .getService(KeyringService.name)
      .emitter.emit('createPassword', password);
  }
);
