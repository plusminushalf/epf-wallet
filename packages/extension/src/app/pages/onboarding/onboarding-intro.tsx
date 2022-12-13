import { PageProps } from '@app/pages/types';
import viteLogo from '@assets/vite.svg';
import { route } from 'preact-router';

export type OnboardingIntroPageProps = {} & PageProps;

export function OnboardingIntro({}: OnboardingIntroPageProps) {
  const onClickGetStarted = () => {
    route('/onboarding/select-implementation');
  };

  return (
    <div class="pt-10 pb-8">
      <div class="justify-center items-center flex flex-col space-y-4">
        <img src={viteLogo} class="h-10" alt="Preact logo" />
        <h1>Welcome to 4337 extension</h1>
      </div>
      <div class="pt-10">
        <p>
          Start your account abstraction journey today, no seed phrases, no
          private keys.
        </p>
        <p class="pt-6">The future is bright</p>
      </div>
      <div class="flex space-x-10 justify-center pt-10">
        <button class="btn btn-outline btn-primary">Recover account</button>
        <button onClick={onClickGetStarted} class="btn btn-primary">
          Create new account
        </button>
      </div>
    </div>
  );
}
