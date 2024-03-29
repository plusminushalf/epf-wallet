import { useBackgroundSelector } from './redux-hooks';
import { route, useRouter } from 'preact-router';
import { selectKeyringStatus } from '../redux-slices/selectors/keyringsSelectors';
import { useEffect } from 'preact/hooks';
import RoutesMap from '@app/routes/routes';
import { SetKeyringPassword, UnlockKeyring } from '@app/pages/keyrings';
import { BackgroundDispatch } from '../services/main';
import { useDispatch } from 'react-redux';
import { KeyringView } from '@epf-wallet/keyring-controller';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AsyncifyFn<K> = K extends (...args: any[]) => any
  ? (...args: Parameters<K>) => Promise<ReturnType<K>>
  : never;

export const useBackgroundDispatch = (): AsyncifyFn<BackgroundDispatch> =>
  useDispatch<BackgroundDispatch>() as AsyncifyFn<BackgroundDispatch>;

export const useAreKeyringsUnlocked = (redirectIfNot: boolean): boolean => {
  const keyringStatus = useBackgroundSelector(selectKeyringStatus);
  const [{ url: currentUrl }] = useRouter();

  let redirectTarget: string | undefined;
  if (keyringStatus === 'uninitialized') {
    redirectTarget = RoutesMap[SetKeyringPassword.name].path;
  } else if (keyringStatus === 'locked') {
    redirectTarget = RoutesMap[UnlockKeyring.name].path;
  }

  useEffect(() => {
    if (
      redirectIfNot &&
      typeof redirectTarget !== 'undefined' &&
      currentUrl !== redirectTarget
    ) {
      route(redirectTarget);
    }
  });

  return keyringStatus === 'unlocked';
};
