import { useAreKeyringsUnlocked } from '@background/hooks';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { useCallback, useEffect } from 'preact/hooks';
import { OnboardingIntro } from '@app/pages/onboarding';
import RoutesMap from '@app/routes/routes';
import { route } from 'preact-router';
import { usePassword } from './use-password';
import { useKeyringCommunicationService } from '@app/hooks/keyring';

export function SetKeyringPassword() {
  const areKeyringsUnlocked = useAreKeyringsUnlocked(false);

  const [passwordState, dispatchPasswordAction] = usePassword();

  const keyringCommunicationService = useKeyringCommunicationService();

  useEffect(() => {
    if (areKeyringsUnlocked) {
      history.back();
    }
  }, [history, areKeyringsUnlocked]);

  const onBackClick = useCallback(() => {
    route(RoutesMap[OnboardingIntro.name].path, true);
  }, []);

  const onSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      if (!passwordState.valid) return;
      keyringCommunicationService.createPassword(passwordState.password || '');
    },
    [passwordState]
  );

  return (
    <div class="h-screen flex justify-center align-middle flex-col max-w-screen-sm mx-auto">
      <div class="card bg-base-100 drop-shadow">
        <div class="card-body">
          <h2 class="card-title">
            <ChevronLeftIcon
              onClick={onBackClick}
              className="h-5 cursor-pointer"
            />
            Set password
          </h2>
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
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
