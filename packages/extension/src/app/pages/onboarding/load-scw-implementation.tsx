import { PageProps } from '@app/pages/types';
import { SCWImplementation } from '@common-types/scw-implementation';
import { useAreKeyringsUnlocked } from '@background/hooks';

export type LoadSCWImplementationPageProps = {
  implementation?: SCWImplementation;
} & PageProps;

export function LoadSCWImplementation({
  implementation,
}: LoadSCWImplementationPageProps) {
  const areKeyringsUnlocked: boolean = useAreKeyringsUnlocked(true);

  console.log(':yaha p h', implementation, areKeyringsUnlocked);
  return <div>here</div>;
}
