import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import ErrorBoundary from './components/error-boundary';

// Create root element if it doesn't exist
const rootElement = document.getElementById('root') || 
  (() => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    return root;
  })();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
