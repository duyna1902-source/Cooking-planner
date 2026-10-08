import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Throwaway member-selection preview on the existing app route, in development only.
const App = import.meta.env.DEV && new URLSearchParams(window.location.search).get('prototype') === 'members'
  ? React.lazy(() => import('./components/MemberSelection.prototype'))
  : React.lazy(() => import('./App'));

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);
