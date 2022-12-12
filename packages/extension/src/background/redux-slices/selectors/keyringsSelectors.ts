import { RootState } from '@background';
import { createSelector } from '@reduxjs/toolkit';

export const selectKeyringStatus = createSelector(
  (state: RootState) => state.keyrings.status,
  (status) => status
);
