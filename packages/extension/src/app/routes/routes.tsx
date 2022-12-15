import {
  OnboardingIntro,
  OnboardingSelectImplementation,
} from '@app/pages/onboarding';
import { SetKeyringPassword, UnlockKeyring } from '@app/pages/keyrings';
import { Home } from '@app/pages/home';
import { PageProps } from '@app/pages/types';
import { VNode } from 'preact';
import Router, { CustomHistory } from 'preact-router';
import { createHashHistory } from 'history';
import { LoadSCWImplementation } from '@app/pages/onboarding/load-scw-implementation';

export type Route = {
  component: ({}: PageProps) => VNode;
  path: string;
  routes?: string[];
};

export type Routes = {
  [key: string]: Route;
};

const RoutesMap: Routes = {
  [Home.name]: {
    component: Home,
    path: '/',
  },
  [OnboardingIntro.name]: {
    component: OnboardingIntro,
    path: '/onboarding/intro',
  },
  [OnboardingSelectImplementation.name]: {
    component: OnboardingSelectImplementation,
    path: '/onboarding/select-implementation',
  },
  [LoadSCWImplementation.name]: {
    component: LoadSCWImplementation,
    path: '/onboarding/load-scw-implementation/:implementation*',
  },
  [SetKeyringPassword.name]: {
    component: SetKeyringPassword,
    path: '/keyring/set-password',
  },
  [UnlockKeyring.name]: {
    component: UnlockKeyring,
    path: '/keyring/unlock',
  },
};

export function RenderRoutes({ routes }: { routes?: string[] }) {
  if (!routes || routes.length === 0) return <></>;

  return (
    <Router history={createHashHistory() as unknown as CustomHistory}>
      {routes.map((route) => {
        const Component = RoutesMap[route].component;
        return <Component path={RoutesMap[route].path} />;
      })}
    </Router>
  );
}

export default RoutesMap;
