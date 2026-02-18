import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Dynamic import for virtual PWA module
const initPWA = async (): Promise<(() => void) | undefined> => {
  try {
    const { registerSW } = await import('virtual:pwa-register');

    // Register Service Worker
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('Новая версия доступна. Обновить?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        // PWA ready for offline use
      },
      onRegistered(_r: ServiceWorkerRegistration | undefined) {
        // Service Worker registered
      },
      onRegisterError(error: Error) {
        process.stderr.write(`SW error: ${error}\n`);
      },
    });

    return updateSW;
  } catch (_error) {
    return undefined;
  }
};

initPWA();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
