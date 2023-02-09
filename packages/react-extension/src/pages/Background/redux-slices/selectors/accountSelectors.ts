import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';

const getAccountState = (state: RootState) => state.account;

export const getAllAddresses = createSelector(getAccountState, (account) => {
  const ret = [
    ...new Set(
      Object.values(account.accountsData.evm).flatMap((chainAddresses) =>
        Object.keys(chainAddresses)
      )
    ),
  ];
  return ret;
});

export const getAddressCount = createSelector(
  getAllAddresses,
  (allAddresses) => allAddresses.length
);
