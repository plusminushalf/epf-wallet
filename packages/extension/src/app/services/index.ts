import MainServiceManager from '@background/services/main';
import { createContext } from 'preact';

export const MainServiceContext = createContext<MainServiceManager | null>(
  null
);
