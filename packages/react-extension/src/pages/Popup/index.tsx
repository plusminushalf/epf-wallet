import React from 'react';
import Popup from './Popup';
import './index.css';
import { Store } from 'webext-redux';
import { Provider } from 'react-redux';
import { render } from 'react-dom';

const store = new Store();

store.ready().then(() => {
  render(
    <Provider store={store}>
      <Popup />
    </Provider>,
    document.getElementById('popup') as HTMLElement
  );
});
