import {
  useAreKeyringsUnlocked,
  useBackgroundDispatch,
} from '@background/hooks';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { useCallback, useEffect, useReducer, useState } from 'preact/hooks';
import { OnboardingIntro } from '@app/pages/onboarding';
import RoutesMap from '@app/routes/routes';
import { route } from 'preact-router';
import { createPassword } from '@background/redux-slices/keyrings';
import Joi from 'joi';

type SetKeyringPasswordState = {
  password?: string;
  errorMessage?: string;
  valid: boolean;
};

const MIN_PASSWORD_LENGTH = 5;
const MAX_PASSWORD_LENGTH = 30;

const passwordSchema = Joi.string()
  .min(MIN_PASSWORD_LENGTH)
  .max(MAX_PASSWORD_LENGTH)
  .messages({
    'string.empty': 'Password cannot be empty',
    'string.min': 'Password must be minimum of 5 characters',
    'string.max': 'Password cannot be more than 30 characters',
  });

type SetKeyringPasswordStateActions = {
  type: 'setPassword' | 'validate';
  password?: string;
};
const reducer = (
  state: SetKeyringPasswordState,
  action: SetKeyringPasswordStateActions
): SetKeyringPasswordState => {
  const password = action.password || state.password;
  const validation = passwordSchema.validate(password);
  switch (action.type) {
    case 'setPassword':
      return {
        ...state,
        password: action.password,
        errorMessage: validation.error ? state.errorMessage : '',
        valid: !Boolean(validation.error),
      };
    case 'validate':
      return {
        ...state,
        errorMessage: validation.error?.message,
        valid: !Boolean(validation.error),
      };
    default:
      throw new Error('Unexpected action');
  }
};

const initialState: SetKeyringPasswordState = {
  password: '',
  valid: false,
};

export function SetKeyringPassword() {
  const areKeyringsUnlocked = useAreKeyringsUnlocked(false);

  const [stateLocal, dispatchLocal] = useReducer(reducer, initialState);

  const dispatchBackground = useBackgroundDispatch();

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
      if (!stateLocal.valid) return;
      dispatchBackground(createPassword(stateLocal.password ?? ''));
    },
    [stateLocal]
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
                onBlur={(e) => dispatchLocal({ type: 'validate' })}
                value={stateLocal.password}
                onInput={(e) =>
                  dispatchLocal({
                    type: 'setPassword',
                    password: (e.target as HTMLInputElement).value,
                  })
                }
                type="password"
                placeholder="keep it strong"
                class="input input-bordered"
              />
            </label>
            {stateLocal.errorMessage ? (
              <p class="text-red-600">{stateLocal.errorMessage}</p>
            ) : null}
            <div class="card-actions mt-6 space-x-6">
              <button
                disabled={!stateLocal.valid}
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
