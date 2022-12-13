import {
  Onboarding,
  OnboardingIntro,
  OnboardingSelectImplementation,
} from '@app/pages/onboarding';
import {
  Keyrings,
  SetKeyringPassword,
  UnlockKeyring,
} from '@app/pages/keyrings';
import { Home } from '@app/pages/home';
import { PageProps } from '@app/pages/types';
import { VNode } from 'preact';
import { useMemo } from 'preact/hooks';
import Router, { CustomHistory } from 'preact-router';
import { createHashHistory } from 'history';
import { LoadSCWImplementation } from '@app/pages/onboarding/load-scw-implementation';

export type Route = {
  component: ({}: PageProps) => VNode;
  path: string;
  routes?: Routes;
};

export type Routes = {
  [key: string]: Route;
};

const ROUTES: Routes = {
  [Home.name]: {
    component: Home,
    path: '/',
  },
  [Onboarding.name]: {
    component: Onboarding,
    path: '/onboarding/:rest*',
    routes: {
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
    },
  },
  [Keyrings.name]: {
    component: Keyrings,
    path: '/keyring/:rest*',
    routes: {
      [SetKeyringPassword.name]: {
        component: SetKeyringPassword,
        path: '/keyring/set-password',
      },
      [UnlockKeyring.name]: {
        component: UnlockKeyring,
        path: '/keyring/unlock',
      },
    },
  },
};

export function RenderRoutes({ routes }: { routes?: Routes }) {
  const routesToRender = useMemo(() => {
    return Object.values(routes || {});
  }, []);

  if (RenderRoutes.length === 0) return <></>;

  return (
    <Router history={createHashHistory() as unknown as CustomHistory}>
      {routesToRender.map((route) => {
        const { component: Component, path } = route;
        return <Component path={path} />;
      })}
    </Router>
  );
}

export default ROUTES;
