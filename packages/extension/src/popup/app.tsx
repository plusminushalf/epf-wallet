/// <reference types="chrome"/>

import { useCallback } from 'preact/hooks';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/background';
import { increment } from '../background/counterSlice';
import './app.css';

export function App() {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  console.log(count);
  const openExpandedView = useCallback(() => {
    const url = chrome.runtime.getURL('src/app/index.html');
    chrome.tabs.create({
      url,
    });
  }, []);

  const incrementCount = () => {
    console.log('here');
    dispatch(increment());
  };

  return (
    <>
      <h1>Vite + Preact popup</h1>
      <div class="card">
        <button onClick={() => incrementCount()}>count is {count}</button>
        <button style={{ marginTop: 10 }} onClick={() => openExpandedView()}>
          Open Expanded View
        </button>
      </div>
    </>
  );
}
