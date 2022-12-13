import { useBackgroundSelector } from './redux-hooks';
import { route, useRouter } from 'preact-router';
import { selectKeyringStatus } from '@background/redux-slices/selectors/keyringsSelectors';
import { useEffect } from 'preact/hooks';
import ROUTES from '@app/routes/routes';
import {
  Keyrings,
  SetKeyringPassword,
  UnlockKeyring,
} from '@app/pages/keyrings';

export const useAreKeyringsUnlocked = (redirectIfNot: boolean): boolean => {
  const keyringStatus = useBackgroundSelector(selectKeyringStatus);
  const [{ url: currentUrl }] = useRouter();

  let redirectTarget: string | undefined;
  if (keyringStatus === 'uninitialized') {
    redirectTarget =
      ROUTES[Keyrings.name].routes?.[SetKeyringPassword.name].path;
  } else if (keyringStatus === 'locked') {
    redirectTarget = ROUTES[Keyrings.name].routes?.[UnlockKeyring.name].path;
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
