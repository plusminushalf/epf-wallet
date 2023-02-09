import { RootState } from '../redux-slices';
import { TypedUseSelectorHook, useSelector } from 'react-redux';

export const useBackgroundSelector: TypedUseSelectorHook<RootState> =
  useSelector;
