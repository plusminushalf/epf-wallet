import { useMemo } from 'preact/hooks';
import RoutesMap, { RenderRoutes } from './routes/routes';

export function App() {
  const routes = useMemo(() => {
    return Object.keys(RoutesMap);
  }, [RoutesMap]);

  return (
    <div class="md:container md:mx-auto">
      <RenderRoutes routes={routes} />
    </div>
  );
}
