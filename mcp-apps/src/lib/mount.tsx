import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';

/** Renders a widget's root component into its document's #root. */
export function mount(App: ComponentType): void {
  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
