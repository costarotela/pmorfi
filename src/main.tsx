import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { storageService } from './services/storage';

const root = createRoot(document.getElementById('root')!);

// Hidratar desde el backend real ANTES de renderizar (Postgres → bootstrap)
storageService.init()
  .then(() => root.render(<App />))
  .catch((err) => {
    document.getElementById('root')!.innerHTML =
      '<div style="font-family:sans-serif;padding:2rem;max-width:36rem;margin:auto">' +
      '<h2>⚠️ Punto Morfi no pudo conectar con el servidor</h2>' +
      '<p>El backend (Postgres + API) no responde. Detalle técnico: ' + String(err) + '</p>' +
      '<p>Reintentá recargando la página.</p></div>';
  });
