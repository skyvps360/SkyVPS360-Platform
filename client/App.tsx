import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './src/components/error-boundary';

// Use lazy loading for routes to improve performance and error handling
const Dashboard = lazy(() => import('./src/pages/Dashboard'));
const Servers = lazy(() => import('./src/pages/Servers'));
const ServerDetails = lazy(() => import('./src/pages/ServerDetails'));
const NotFound = lazy(() => import('./src/pages/NotFound'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error }: { error?: Error }) => (
  <div className="error-container">
    <h2>Failed to load module</h2>
    <p>There was an error loading this component:</p>
    {error && <pre>{error.message}</pre>}
    <button onClick={() => window.location.reload()}>Reload Page</button>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Dashboard />
            </ErrorBoundary>
          } />
          
          <Route path="/servers" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Servers />
            </ErrorBoundary>
          } />
          
          <Route path="/servers/:id" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <ServerDetails />
            </ErrorBoundary>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
