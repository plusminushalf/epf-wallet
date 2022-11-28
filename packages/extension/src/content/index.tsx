import { render } from 'preact';
import { App } from './app';

const root = document.createElement('div');
root.id = 'app';
document.body.append(root);

render(<App />, root as HTMLElement);
