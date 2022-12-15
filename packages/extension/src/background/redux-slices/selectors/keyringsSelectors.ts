import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';

export const selectKeyringStatus = createSelector(
  (state: RootState) => state.keyrings.status,
  (status) => status
);
