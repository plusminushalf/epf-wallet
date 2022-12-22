import {
  useAreKeyringsUnlocked,
  useBackgroundDispatch,
} from '@background/hooks';
import { unlockKeyring } from '@background/redux-slices/keyrings';
import { useCallback, useEffect } from 'preact/hooks';
import { usePassword } from './use-password';

export function UnlockKeyring() {
  const areKeyringsUnlocked = useAreKeyringsUnlocked(false);
  const [passwordState, dispatchPasswordAction] = usePassword();
  const dispatchBackground = useBackgroundDispatch();

  useEffect(() => {
    if (areKeyringsUnlocked) {
      history.back();
    }
  }, [history, areKeyringsUnlocked]);

  const onSubmit = useCallback(
    async (e: Event) => {
      e.preventDefault();
      if (!passwordState.valid) return;
      await dispatchBackground(unlockKeyring(passwordState.password ?? ''));
      dispatchPasswordAction({
        type: 'setErrorMessage',
        errorMessage: 'Invalid Password',
      });
    },
    [passwordState]
  );

  return (
    <div class="h-screen flex justify-center align-middle flex-col max-w-screen-sm mx-auto">
      <div class="card bg-base-100 drop-shadow">
        <div class="card-body">
          <h2 class="card-title">Unlock account</h2>
          <form onSubmit={onSubmit} class="form-control mt-6">
            <label class="input-group">
              <span>Password</span>
              <input
                autoFocus={true}
                onBlur={(e) => dispatchPasswordAction({ type: 'validate' })}
                value={passwordState.password}
                onInput={(e) =>
                  dispatchPasswordAction({
                    type: 'setPassword',
                    password: (e.target as HTMLInputElement).value,
                  })
                }
                type="password"
                placeholder="keep it strong"
                class="input input-bordered"
              />
            </label>
            {passwordState.errorMessage ? (
              <p class="text-red-600">{passwordState.errorMessage}</p>
            ) : null}
            <div class="card-actions mt-6 space-x-6">
              <button
                disabled={!passwordState.valid}
                type="submit"
                class="btn btn-primary"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
