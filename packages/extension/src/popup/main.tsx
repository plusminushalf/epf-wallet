import { render } from 'preact';
import { App } from './app';
import './index.css';
import { Store } from 'webext-redux';
import { Provider } from 'react-redux';

const store = new Store();

store.ready().then(() => {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app') as HTMLElement
  );
});
