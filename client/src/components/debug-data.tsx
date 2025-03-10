import React from 'react';

interface DebugDataProps {
  data: unknown;
  name: string;
}

export const DebugData: React.FC<DebugDataProps> = ({ data, name }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <details className="mb-4 p-4 border rounded bg-gray-50">
      <summary className="font-bold cursor-pointer">Debug: {name}</summary>
      <div className="mt-2">
        <p>Type: {Array.isArray(data) ? 'Array' : typeof data}</p>
        {Array.isArray(data) && <p>Length: {data.length}</p>}
        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </details>
  );
};
