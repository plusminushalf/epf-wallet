import { wrapStore } from 'webext-redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './redux-slices';

const store = configureStore({
  reducer: rootReducer,
});

wrapStore(store);

export type RootState = ReturnType<typeof store.getState>;

chrome.runtime.onInstalled.addListener((e) => {
  if (e.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    const url = chrome.runtime.getURL('src/app/index.html#onboarding');
    chrome.tabs.create({
      url,
    });
  }
});
