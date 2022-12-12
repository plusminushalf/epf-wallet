import { combineReducers } from '@reduxjs/toolkit';
import account from './account';
import keyrings from './keyrings';

const rootReducer = combineReducers({
  account,
  keyrings,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
