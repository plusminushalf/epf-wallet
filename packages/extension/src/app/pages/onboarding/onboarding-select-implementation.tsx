import { PageProps } from '@app/pages/types';
import RoutesMap from '@app/routes/routes';
import { SCWImplementation } from '@common-types/scw-implementation';
import { DEFAULT_SCW_IMPLEMENTATION } from '@constants';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { route } from 'preact-router';
import { useCallback } from 'preact/hooks';
import { LoadSCWImplementation } from './load-scw-implementation';
import { OnboardingIntro } from './onboarding-intro';

export type OnboardingSelectImplementationPageProps = {} & PageProps;

export function OnboardingSelectImplementation({}: OnboardingSelectImplementationPageProps) {
  const onBackClick = useCallback(() => {
    route(RoutesMap[OnboardingIntro.name].path, true);
  }, []);

  const selectImplementation = useCallback(
    (implementation: SCWImplementation) => {
      route(
        RoutesMap[LoadSCWImplementation.name].path.replace(
          ':implementation*',
          implementation
        )
      );
    },
    []
  );

  return (
    <div class="h-screen flex justify-center align-middle flex-col max-w-screen-sm mx-auto">
      <div class="card bg-base-100 drop-shadow">
        <div class="card-body">
          <h2 class="card-title">
            <ChevronLeftIcon
              onClick={onBackClick}
              className="h-5 cursor-pointer"
            />
            Type of accounts
          </h2>
          <p class="mt-4">
            You can select from various types of accounts like gnosis-safe,
            candide, stackup, etc.
          </p>
          <p class="mt-2">
            The default account type is{' '}
            <a
              href="https://tailwindcss.com/docs"
              class="text-blue-600 hover:text-blue-700"
            >
              4337 account.
            </a>
          </p>
          <p class="mt-4">
            <a
              href="https://tailwindcss.com/docs"
              class="text-blue-600 hover:text-blue-700"
            >
              Read about accounts &rarr;
            </a>
          </p>
          <div class="card-actions w-full mt-6 space-x-6 justify-end">
            <button class="btn btn-outline btn-secondary">
              Explore accounts
            </button>
            <button
              onClick={() => selectImplementation(DEFAULT_SCW_IMPLEMENTATION)}
              class="btn btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
