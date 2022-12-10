import { combineReducers } from '@reduxjs/toolkit';
import account from './account';

const rootReducer = combineReducers({
  account,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
