import ROUTES, { RenderRoutes } from '@app/routes/routes';
import { PageProps } from '../types';

export type KeyringsProps = {} & PageProps;

export function Keyrings({}: KeyringsProps) {
  const routes = ROUTES[Keyrings.name].routes;

  return (
    <div>
      keyrings
      <RenderRoutes routes={routes} />
    </div>
  );
}
