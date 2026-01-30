import React from 'react';
import { createRoot } from 'react-dom/client';

function App(): React.JSX.Element {
  // Minimal scaffold for issue #52. Routing + real pages come next.
  return (
    <main style={{ padding: 16 }}>
      <h1>Work items</h1>
      <p>React+Vite scaffold is live.</p>
    </main>
  );
}

const el = document.getElementById('root');
if (!el) throw new Error('Missing #root element');

createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
