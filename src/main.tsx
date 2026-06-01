import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'sans-serif' }}>
          <h2>Algo salió mal al cargar la aplicación.</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflowX: 'auto', color: 'black' }}>
            {this.state.error?.toString()}
          </pre>
          <p>Por favor revisa la consola para más detalles, o verifica tus variables de entorno en Vercel.</p>
        </div>
      );
    }
    // @ts-expect-error React types issue
    return this.props.children;
  }
}

// Guardar el evento de instalación tan pronto como ocurra para no perderlo si ocurre antes de que monte React
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Main.tsx captured early beforeinstallprompt');
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
