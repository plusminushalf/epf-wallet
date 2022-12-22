import { PageProps } from '@app/pages/types';
import { SCWImplementation } from '@common-types/scw-implementation';
import { useAreKeyringsUnlocked } from '@background/hooks';
import { useEffect } from 'preact/hooks';

export type LoadSCWImplementationPageProps = {
  implementation?: SCWImplementation;
} & PageProps;

export function LoadSCWImplementation({
  implementation,
}: LoadSCWImplementationPageProps) {
  const areKeyringsUnlocked: boolean = useAreKeyringsUnlocked(true);

  useEffect(() => {
    if (areKeyringsUnlocked) {
    }
  }, [areKeyringsUnlocked]);

  console.log(implementation);
  return <div>here</div>;
}
