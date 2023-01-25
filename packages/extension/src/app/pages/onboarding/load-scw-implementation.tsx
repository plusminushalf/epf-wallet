import { PageProps } from '@app/pages/types';
import { SCWImplementation } from '@common-types/scw-implementation';
import {
  useAreKeyringsUnlocked,
  useBackgroundSelector,
} from '@background/hooks';
import { useCallback, useEffect, useMemo, useReducer } from 'preact/hooks';
import { route } from 'preact-router';
import { OnboardingSelectImplementation } from './onboarding-select-implementation';
import RoutesMap from '@app/routes/routes';
import {
  KeyringView,
  KeyringViewInputField,
  KeyringInputError,
} from '@epf-wallet/keyring-controller';
import { selectKeyringView } from '@background/redux-slices/selectors/keyringsSelectors';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { useKeyringCommunicationService } from '@app/hooks/keyring';
import { useDebouncedCallback } from 'use-debounce';

export type LoadSCWImplementationPageProps = {
  implementation?: SCWImplementation;
} & PageProps;

export type KeyringFormInputs = {
  [key: string]: {
    errorMessage?: string;
    value: any;
    keyringViewInput: KeyringViewInputField;
  };
};

export type KeyringFormInputState = {
  valid: boolean;
  inputs: KeyringFormInputs;
};
export type SetKeyringFormInputStateActions = {
  type: 'setErrors' | 'keyringView' | 'setValue';
  data?: any;
};

const reducer = (
  state: KeyringFormInputState,
  action: SetKeyringFormInputStateActions
): KeyringFormInputState => {
  switch (action.type) {
    case 'setValue':
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.data.name]: {
            ...(state.inputs[action.data.name] || {}),
            value: action.data.value,
          },
        },
      };

    case 'setErrors':
      return {
        ...state,
        valid: (action.data.errors as Array<KeyringInputError>).reduce(
          (result, error) => result && !error.error,
          true
        ),
        inputs: (action.data.errors as Array<KeyringInputError>).reduce(
          (result, error) => {
            result[error.name] = {
              ...result[error.name],
              errorMessage: error.error ? error.message : undefined,
            };
            return result;
          },
          { ...state.inputs }
        ),
      };
    case 'keyringView':
      return {
        ...state,
        inputs: action.data.keyringView
          ? (action.data.keyringView as KeyringView).inputs.reduce(
              (result: KeyringFormInputs, view) => {
                result[view.name] = {
                  value: view.defaultValue,
                  keyringViewInput: view,
                };
                return result;
              },
              {}
            )
          : {},
      };
    default:
      throw new Error('Invalid action fired');
  }
};

const initialState: KeyringFormInputState = {
  valid: false,
  inputs: {},
};

export const useKeyringFormInput = (
  keyringView?: KeyringView | null
): [
  KeyringFormInputState,
  (action: SetKeyringFormInputStateActions) => void,
  Function
] => {
  const [stateLocal, dispatchLocal] = useReducer<
    KeyringFormInputState,
    SetKeyringFormInputStateActions
  >(reducer, initialState);

  useEffect(() => {
    dispatchLocal({
      type: 'keyringView',
      data: {
        keyringView,
      },
    });
  }, [keyringView]);

  const validateInput = useDebouncedCallback(
    useCallback(async () => {
      if (keyringView) {
        const errors: Array<KeyringInputError> = await keyringView?.isValid(
          Object.values(stateLocal.inputs).map((input) => ({
            name: input.keyringViewInput.name,
            value: input.value,
          }))
        );
        dispatchLocal({
          type: 'setErrors',
          data: {
            errors,
          },
        });
      }
    }, [keyringView, stateLocal]),
    300
  );

  return [stateLocal, dispatchLocal, validateInput];
};

export function LoadSCWImplementation({
  implementation,
}: LoadSCWImplementationPageProps) {
  const keyringCommunicationService = useKeyringCommunicationService();
  const areKeyringsUnlocked: boolean = useAreKeyringsUnlocked(true);

  const keyringViewState: KeyringView | null | undefined =
    useBackgroundSelector((state) =>
      selectKeyringView(state, implementation || '')
    );

  const keyringView: KeyringView | null | undefined = useMemo(() => {
    if (!keyringViewState) return keyringViewState;
    return keyringCommunicationService.getKeyringViewConnection(
      implementation || '',
      keyringViewState
    );
  }, [keyringCommunicationService, keyringViewState, implementation]);

  useBackgroundSelector((state) =>
    selectKeyringView(state, implementation || '')
  );

  const [formState, dispatchFormAction, validateInput] =
    useKeyringFormInput(keyringView);

  useEffect(() => {
    if (!implementation) {
      route(RoutesMap[OnboardingSelectImplementation.name].path);
    }
  }, [implementation]);

  useEffect(() => {
    if (areKeyringsUnlocked && implementation && !keyringView) {
      keyringCommunicationService?.createKeyringForImplementation(
        implementation
      );
    }
  }, [areKeyringsUnlocked, implementation, keyringView]);

  const onSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      if (formState.valid && implementation) {
        keyringCommunicationService?.addAccount(
          implementation,
          Object.keys(formState.inputs).reduce(
            (result, key) => ({
              ...result,
              [key]: formState.inputs[key].value,
            }),
            {}
          )
        );
      }
    },
    [formState.valid, implementation]
  );

  return (
    <div class="h-screen flex justify-center align-middle flex-col max-w-screen-sm mx-auto">
      <div class="card bg-base-100 drop-shadow">
        <div class="card-body">
          {keyringView === undefined ? (
            <div class="flex justify-center">
              <progress class="progress w-56"></progress>
            </div>
          ) : null}
          {keyringView ? (
            <>
              <h2 class="card-title">
                <ChevronLeftIcon
                  onClick={() => history.back()}
                  className="h-5 cursor-pointer"
                />
                {keyringView.title}
              </h2>
              <p>{keyringView.description}</p>
              <form onSubmit={onSubmit} class="form-control mt-6">
                {keyringView.inputs.map((input, index) => (
                  <>
                    <label class="input-group mb-4">
                      <span>{input.displayName}</span>
                      {input.type === 'input' ? (
                        <input
                          value={
                            formState.inputs[input.name] &&
                            formState.inputs[input.name].value
                          }
                          name={input.name}
                          onBlur={(e) => validateInput()}
                          onInput={(e) => {
                            dispatchFormAction({
                              type: 'setValue',
                              data: {
                                name: input.name,
                                value: (e.target as HTMLInputElement).value,
                              },
                            });
                            validateInput();
                          }}
                          autofocus={index === 0}
                          //   type={input.inputType}
                          placeholder={input.placeholder}
                          class="input input-bordered"
                        />
                      ) : null}
                    </label>
                    {formState.inputs[input.name] &&
                    formState.inputs[input.name].errorMessage ? (
                      <p class="text-red-600">
                        {formState.inputs[input.name].errorMessage}
                      </p>
                    ) : null}
                  </>
                ))}
                <div class="card-actions mt-6 space-x-6">
                  <button
                    disabled={!formState.valid}
                    type="submit"
                    class="btn btn-primary"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
