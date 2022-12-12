import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { DomainName, HexString, URI } from '@common-types/common';
import { EVMNetwork } from '@common-types/network';
import { AccountBalance } from '@common-types/account';

type AccountData = {
  address: HexString;
  network: EVMNetwork;
  balances: {
    [assetSymbol: string]: AccountBalance;
  };
  ens: {
    name?: DomainName;
    avatarURL?: URI;
  };
  defaultName: string;
  defaultAvatar: string;
};

export type AddressOnNetwork = {
  address: HexString;
  network: EVMNetwork;
};

type AccountsByChainID = {
  [chainID: string]: {
    [address: string]: AccountData | 'loading';
  };
};

interface AccountState {
  account?: AddressOnNetwork;
  accountLoading?: string;
  hasAccountError?: boolean;
  accountsData: {
    evm: AccountsByChainID;
  };
}

const initialState = {
  accountsData: { evm: {} },
  combinedData: {
    totalMainCurrencyValue: '',
    assets: [],
  },
} as AccountState;

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    incrementByAmount(state, action: PayloadAction<number>) {
      //   state.value += action.payload
    },
  },
});

export const { incrementByAmount } = accountSlice.actions;
export default accountSlice.reducer;
