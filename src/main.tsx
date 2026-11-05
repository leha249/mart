import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Шрифты лежат локально (npm-пакет @fontsource), а не грузятся с Google Fonts.
// Это убирает обращение к зарубежному серверу до согласия посетителя.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/900.css';
import '@fontsource/playfair-display/600-italic.css';

import './styles/globals.css';

const isDev = import.meta.env.DEV;

ReactDOM.createRoot(document.getElementById('root')!).render(
  isDev ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
);