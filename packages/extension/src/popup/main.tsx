import { render } from 'preact';
import { Popup } from './popup';
import './index.css';
import { Store } from 'webext-redux';
import { Provider } from 'react-redux';

const store = new Store();

store.ready().then(() => {
  render(
    <Provider store={store}>
      <Popup />
    </Provider>,
    document.getElementById('popup') as HTMLElement
  );
});
