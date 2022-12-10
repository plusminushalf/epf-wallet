import { PageProps } from '@app/pages/types';
import { Button } from '@components/button';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { route } from 'preact-router';
import { useCallback } from 'preact/hooks';

export type OnboardingSelectImplementationPageProps = {} & PageProps;

export function OnboardingSelectImplementation({}: OnboardingSelectImplementationPageProps) {
  const onBackClick = useCallback(() => {
    route('/onboarding/intro', true);
  }, []);

  return (
    <div class="pt-10 pb-8">
      <div class="flex items-center space-x-4">
        <ChevronLeftIcon onClick={onBackClick} className="h-5 cursor-pointer" />
        <h1 class="text-xl">Type of accounts</h1>
      </div>
      <div class="pt-10">
        <p>
          You can select from various types of accounts like gnosis-safe,
          candide, stackup, etc.
        </p>
        <p class="pt-6">
          The default account type is{' '}
          <a
            href="https://tailwindcss.com/docs"
            class="text-blue-600 hover:text-blue-700"
          >
            4337 account.
          </a>
        </p>
        <p class="pt-6">
          <a
            href="https://tailwindcss.com/docs"
            class="text-blue-600 hover:text-blue-700"
          >
            Read about accounts &rarr;
          </a>
        </p>
        <div class="flex space-x-6">
          <Button type="secondary" class="pt-8">
            Explore accounts
          </Button>
          <Button class="pt-8">Continue</Button>
        </div>
      </div>
    </div>
  );
}
