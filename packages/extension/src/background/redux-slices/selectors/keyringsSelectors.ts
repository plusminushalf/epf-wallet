import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';

export const selectKeyring = createSelector(
  (state: RootState) => state.keyrings,
  (keyrings) => keyrings
);

export const selectKeyringStatus = createSelector(
  selectKeyring,
  (keyrings) => keyrings.status
);

export const selectKeyringVault = createSelector(
  selectKeyring,
  (keyrings) => keyrings.vault
);
