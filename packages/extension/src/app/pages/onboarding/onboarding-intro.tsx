import { PageProps } from '@app/pages/types';
import RoutesMap from '@app/routes/routes';
import viteLogo from '@assets/vite.svg';
import { route } from 'preact-router';
import { OnboardingSelectImplementation } from './onboarding-select-implementation';

export type OnboardingIntroPageProps = {} & PageProps;

export function OnboardingIntro({}: OnboardingIntroPageProps) {
  const onClickGetStarted = () => {
    route(RoutesMap[OnboardingSelectImplementation.name].path);
  };

  return (
    <div class="h-screen flex justify-center align-middle flex-col max-w-screen-sm mx-auto">
      <div class="card bg-base-100 drop-shadow">
        <div class="card-body items-center text-center">
          <img src={viteLogo} class="h-10" alt="Preact logo" />
          <h2 class="card-title">Welcome to 4337 extension!</h2>
          <p class="mt-4">
            Start your account abstraction journey today, no seed phrases, no
            private keys.
          </p>
          <p>The future is bright</p>
          <div class="card-actions mt-6 space-x-6">
            <button class="btn btn-outline btn-secondary">
              Recover account
            </button>
            <button onClick={onClickGetStarted} class="btn btn-primary">
              Create new account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
