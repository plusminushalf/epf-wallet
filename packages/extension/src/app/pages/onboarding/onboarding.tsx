import { PageProps } from '@app/pages/types';
import { createHashHistory } from 'history';
import Router, { CustomHistory } from 'preact-router';
import { OnboardingIntro } from './onboarding-intro';
import { OnboardingSelectImplementation } from './onboarding-select-implementation';

export type OnboardingPageProps = {} & PageProps;

export function Onboarding({}: OnboardingPageProps) {
  return (
    <div class="h-screen flex justify-center align-middle flex-col max-w-screen-sm mx-auto">
      <div class="transition-all w-full relative bg-white shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
        <Router>
          <OnboardingIntro path="/onboarding/intro" />
          <OnboardingSelectImplementation path="/onboarding/select-implementation" />
        </Router>
      </div>
    </div>
  );
}
