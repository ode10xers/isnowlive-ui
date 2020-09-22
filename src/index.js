import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { GlobalDataProvider } from './services/globalContext';

ReactDOM.render(
  <React.StrictMode>
    <GlobalDataProvider>
      <App />
    </GlobalDataProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
