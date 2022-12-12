import { useBackgroundSelector } from './redux-hooks';
import { route, useRouter } from 'preact-router';
import { selectKeyringStatus } from '@background/redux-slices/selectors/keyringsSelectors';
import { useEffect } from 'preact/hooks';

export const useAreKeyringsUnlocked = (redirectIfNot: boolean): boolean => {
  const keyringStatus = useBackgroundSelector(selectKeyringStatus);
  const [{ url: currentUrl }] = useRouter();

  let redirectTarget: string | undefined;
  if (keyringStatus === 'uninitialized') {
    redirectTarget = '/keyring/set-password';
  } else if (keyringStatus === 'locked') {
    redirectTarget = '/keyring/unlock';
  }

  useEffect(() => {
    if (
      redirectIfNot &&
      typeof redirectTarget !== 'undefined' &&
      currentUrl !== redirectTarget
    ) {
      console.log(redirectTarget);
      route(redirectTarget);
    }
  });

  return keyringStatus === 'unlocked';
};
