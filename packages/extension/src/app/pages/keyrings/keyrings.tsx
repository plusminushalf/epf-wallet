import ROUTES, { RenderRoutes } from '@app/routes/routes';
import { useAreKeyringsUnlocked } from '@hooks';
import { useEffect } from 'preact/hooks';
import { PageProps } from '../types';

export type KeyringsProps = {} & PageProps;

export function Keyrings({}: KeyringsProps) {
  const routes = ROUTES[Keyrings.name].routes;

  const areKeyringsUnlocked = useAreKeyringsUnlocked(false);

  useEffect(() => {
    if (areKeyringsUnlocked) {
      history.back();
    }
  }, [history, areKeyringsUnlocked]);

  return (
    <div class="h-screen flex justify-center align-middle flex-col max-w-screen-sm mx-auto">
      <div class="w-full relative bg-white shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:rounded-lg sm:px-10">
        <RenderRoutes routes={routes} />
      </div>
    </div>
  );
}
