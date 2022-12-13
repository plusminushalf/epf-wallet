import { useEffect } from 'preact/hooks';
import { getAddressCount } from '@background/redux-slices/selectors/accountSelectors';
import { useBackgroundSelector } from '@background/hooks';
import { PageProps } from '../types';

export type OnboardingPageProps = {} & PageProps;

export function Home({}: OnboardingPageProps) {
  const hasAccounts = useBackgroundSelector(
    (state) => getAddressCount(state) > 0
  );

  useEffect(() => {
    if (!hasAccounts) {
    }
  }, [hasAccounts]);

  return <h1 className="text-3xl font-bold underline">Home!</h1>;
}
