import React, { useCallback, useEffect } from 'react';
// import { useBackgroundSelector } from '../Background/hooks';
// import { getAddressCount } from '../Background/redux-slices/selectors/accountSelectors';

import './Popup.css';

const Popup = () => {
  const hasAccounts = true;

  const openExpandedView = useCallback(() => {
    const url = chrome.runtime.getURL('src/app/index.html#onboarding/intro');
    chrome.tabs.create({
      url,
    });
  }, []);

  useEffect(() => {
    if (!hasAccounts) {
      openExpandedView();
    }
  }, [hasAccounts, openExpandedView]);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/pages/Popup/Popup.jsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React!
        </a>
      </header>
    </div>
  );
};

export default Popup;
