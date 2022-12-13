import { PageProps } from '@app/pages/types';
import ROUTES, { RenderRoutes } from '@app/routes/routes';
import Router from 'preact-router';
import { LoadSCWImplementation } from './load-scw-implementation';
import { OnboardingIntro } from './onboarding-intro';
import { OnboardingSelectImplementation } from './onboarding-select-implementation';

export type OnboardingPageProps = {} & PageProps;

export function Onboarding({}: OnboardingPageProps) {
  const routes = ROUTES[Onboarding.name].routes;

  return (
    <div class="h-screen flex justify-center align-middle flex-col max-w-screen-sm mx-auto">
      <div class="w-full relative bg-white shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:rounded-lg sm:px-10">
        <RenderRoutes routes={routes} />
      </div>
    </div>
  );
}
