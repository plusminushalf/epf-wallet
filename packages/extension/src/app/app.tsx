import { useState } from 'preact/hooks';
import Router, { CustomHistory } from 'preact-router';
import { createHashHistory } from 'history';

import { Onboarding } from './pages/onboarding';
import { Home } from './pages/home';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div class="md:container md:mx-auto">
      <Router history={createHashHistory() as unknown as CustomHistory}>
        <Home path="/" />
        <Onboarding path="/onboarding/:rest*" />
      </Router>
    </div>
  );
}
