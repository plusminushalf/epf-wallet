import { render } from 'preact';
import { App } from './app';
import { Store } from 'webext-redux';
import { Provider } from 'react-redux';
import 'normalize.css';
import './main.css';

const store = new Store();

store.ready().then(() => {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app') as HTMLElement
  );
});
