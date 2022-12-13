/// <reference types="chrome"/>
import { useCallback, useEffect } from 'preact/hooks';
import { useBackgroundSelector } from '@background/hooks';
import { getAddressCount } from '@background/redux-slices/selectors/accountSelectors';
import './popup.css';

export function Popup() {
  const hasAccounts = useBackgroundSelector(
    (state) => getAddressCount(state) > 0
  );

  useEffect(() => {
    if (!hasAccounts) {
      openExpandedView();
    }
  }, [hasAccounts]);

  const openExpandedView = useCallback(() => {
    const url = chrome.runtime.getURL('src/app/index.html#onboarding/intro');
    chrome.tabs.create({
      url,
    });
  }, []);

  return (
    <button onClick={openExpandedView} className="text-3xl font-bold underline">
      Hello world!
    </button>
  );
}
