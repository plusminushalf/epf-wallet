import ROUTES, { RenderRoutes } from './routes/routes';

export function App() {
  return (
    <div class="md:container md:mx-auto">
      <RenderRoutes routes={ROUTES} />
    </div>
  );
}
