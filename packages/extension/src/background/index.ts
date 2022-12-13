import { wrapStore } from 'webext-redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './redux-slices';
import { devToolsEnhancer } from '@redux-devtools/remote';
import { encodeJSON } from './utils';

// This sanitizer runs on store and action data before serializing for remote
// redux devtools. The goal is to end up with an object that is directly
// JSON-serializable and deserializable; the remote end will display the
// resulting objects without additional processing or decoding logic.
const devToolsSanitizer = (input: unknown) => {
  switch (typeof input) {
    // We can make use of encodeJSON instead of recursively looping through
    // the input
    case 'bigint':
    case 'object':
      return JSON.parse(encodeJSON(input));
    // We only need to sanitize bigints and objects that may or may not contain
    // them.
    default:
      return input;
  }
};

console.log(process.env.NODE_ENV);

const store = configureStore({
  reducer: rootReducer,
  devTools: false,
  enhancers:
    process.env.NODE_ENV === 'development'
      ? [
          devToolsEnhancer({
            hostname: 'localhost',
            port: 8000,
            realtime: true,
            actionSanitizer: devToolsSanitizer,
            stateSanitizer: devToolsSanitizer,
          }),
        ]
      : [],
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
