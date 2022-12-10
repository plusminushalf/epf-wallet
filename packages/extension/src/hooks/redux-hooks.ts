import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from 'src/background';

export const useBackgroundSelector: TypedUseSelectorHook<RootState> =
  useSelector;
