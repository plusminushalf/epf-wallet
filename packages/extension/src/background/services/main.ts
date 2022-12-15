import rootReducer, { RootState } from '@background/redux-slices';
import { decodeJSON, encodeJSON } from '@background/utils';
import { configureStore, isPlain } from '@reduxjs/toolkit';
import { devToolsEnhancer } from '@redux-devtools/remote';
import BaseService from './base';
import { wrapStore } from 'webext-redux';
import storage from 'redux-persist/lib/storage';
import { persistReducer, createTransform } from 'redux-persist';

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

const CustomJSONTransform = createTransform(
  // transform state on its way to being serialized and persisted.
  (inboundState: RootState) => {
    // convert mySet to an Array.
    return JSON.parse(encodeJSON(inboundState));
  },
  // transform state being rehydrated
  (outboundState: RootState) => {
    // convert mySet back to a Set.
    return decodeJSON(JSON.stringify(outboundState)) as RootState;
  }
);

const persistConfig = {
  key: 'root',
  storage,
  transforms: [CustomJSONTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const initializeStore = (main: MainServiceRegisterer) =>
  configureStore({
    reducer: persistedReducer,
    devTools: false,
    middleware: (getDefaultMiddleware) => {
      const middleware = getDefaultMiddleware({
        serializableCheck: {
          isSerializable: (value: unknown) =>
            isPlain(value) || typeof value === 'bigint',
        },
        thunk: { extraArgument: { main } },
      });
      return middleware;
    },
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

type ReduxStoreType = ReturnType<typeof initializeStore>;

export default class MainServiceRegisterer extends BaseService<never> {
  store: ReduxStoreType;

  constructor() {
    super();
    this.store = initializeStore(this);
    wrapStore(this.store);
  }

  static async create() {
    return new MainServiceRegisterer();
  }

  _startService = async (): Promise<void> => {};
  _stopService = async (): Promise<void> => {};
}
