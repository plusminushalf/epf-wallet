/// <reference types="chrome"/>

import { useCallback, useState } from 'preact/hooks';
import preactLogo from '../assets/preact.svg';
import './app.css';

export function App() {
  const [count, setCount] = useState(0);

  const openExpandedView = useCallback(() => {
    const url = chrome.runtime.getURL('src/app/index.html');
    chrome.tabs.create({
      url,
    });
  }, []);

  return (
    <>
      <h1>Vite + Preact popup</h1>
      <div class="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Open settings
        </button>
        <button style={{ marginTop: 10 }} onClick={() => openExpandedView()}>
          Open Expanded View
        </button>
      </div>
    </>
  );
}
