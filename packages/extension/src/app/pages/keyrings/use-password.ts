import Joi from 'joi';
import { useReducer } from 'preact/hooks';

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

type SetKeyringPasswordState = {
  password?: string;
  errorMessage?: string;
  valid: boolean;
};

type SetKeyringPasswordStateActions = {
  type: 'setPassword' | 'validate' | 'setErrorMessage';
  password?: string;
  errorMessage?: string;
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
    case 'setErrorMessage':
      return {
        ...state,
        errorMessage: action.errorMessage,
        valid: false,
      };
    default:
      throw new Error('Unexpected action');
  }
};

const initialState: SetKeyringPasswordState = {
  password: '',
  valid: false,
};

export const usePassword = (): [
  SetKeyringPasswordState,
  (action: SetKeyringPasswordStateActions) => void
] => {
  const [stateLocal, dispatchLocal] = useReducer<
    SetKeyringPasswordState,
    SetKeyringPasswordStateActions
  >(reducer, initialState);
  return [stateLocal, dispatchLocal];
};
