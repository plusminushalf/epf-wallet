import { useAreKeyringsUnlocked } from '@background/hooks';
import { useEffect } from 'preact/hooks';

export function UnlockKeyring() {
  const areKeyringsUnlocked = useAreKeyringsUnlocked(false);

  useEffect(() => {
    if (areKeyringsUnlocked) {
      history.back();
    }
  }, [history, areKeyringsUnlocked]);
  return <div>unlock keyring</div>;
}
