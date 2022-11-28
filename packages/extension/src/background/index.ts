import { wrapStore } from 'webext-redux';
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

wrapStore(store);

export type RootState = ReturnType<typeof store.getState>;
console.log('background here.');
