import { createSlice } from '@reduxjs/toolkit';
import { Keyring, KeyringMetadata } from '../types/keyrings';
import { createBackgroundAsyncThunk } from './utils';
import { NewAccountView } from '../types/chrome-messages';
import { RootState } from '.';

export type Vault = {
  vault: string;
  encryptionKey?: string;
  encryptionSalt?: string;
};

export type KeyringsState = {
  keyrings: Keyring[];
  keyringMetadata: {
    [keyringId: string]: KeyringMetadata;
  };
  importing: false | 'pending' | 'done';
  status: 'locked' | 'unlocked' | 'uninitialized';
  vault: Vault;
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
    keyringLocked: (state) => ({
      ...state,
      status: state.status !== 'uninitialized' ? 'locked' : 'uninitialized',
      vault: {
        vault: state.vault.vault,
      },
    }),
    keyringUnlocked: (state) => ({ ...state, status: 'unlocked' }),
    vaultUpdate: (
      state,
      {
        payload: vault,
      }: {
        payload: Vault;
      }
    ) => ({
      ...state,
      vault,
      status:
        !vault.encryptionKey && state.status !== 'uninitialized'
          ? 'locked'
          : state.status,
    }),
    setNewAccountView: (
      state,
      { payload: view }: { payload: NewAccountView }
    ) => ({
      ...state,
      importing: false,
      keyrings: [...state.keyrings, { id: view.implementation, addresses: [] }],
      keyringMetadata: {
        ...state.keyringMetadata,
        [view.implementation]: {
          view: view.view,
          source: 'internal',
        },
      },
    }),
  },
});

export const { keyringLocked } = keyringsSlice.actions;
export default keyringsSlice.reducer;

/**
 * -------------------------------
 * Background Actions
 * -------------------------------
 */

export const vaultUpdate = createBackgroundAsyncThunk(
  'keyring/vaultUpdate',
  async (vault: Vault, { dispatch }) => {
    dispatch(keyringsSlice.actions.vaultUpdate(vault));
  }
);

export const keyringUnlocked = createBackgroundAsyncThunk(
  'keyring/keyringUnlocked',
  async (keyringUnlocked: boolean, { dispatch }) => {
    keyringUnlocked && dispatch(keyringsSlice.actions.keyringUnlocked());
  }
);

export const setNewAccountView = createBackgroundAsyncThunk(
  'keyring/setNewAccountView',
  async (view: NewAccountView, { dispatch }) => {
    dispatch(keyringsSlice.actions.setNewAccountView(view));
  }
);
