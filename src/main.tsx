import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/theme-light.css';
import './styles/theme-dark.css';
import './styles/typography.css';
import { restoreThemeFromStorage } from './styles/theme';

restoreThemeFromStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
