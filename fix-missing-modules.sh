#!/bin/bash

# This script creates missing UI components that might be referenced in the app

echo "Creating missing UI components..."

# Create components/ui directory if it doesn't exist
mkdir -p ./client/src/components/ui

# Check if any files need to be created
if [ ! -f "./client/src/components/ui/toaster.tsx" ]; then
  echo "Creating toaster component..."
  cat > ./client/src/components/ui/toaster.tsx << 'EOL'
import React from 'react';

export function Toaster() {
  return (
    <div id="toaster-container" className="fixed bottom-4 right-4 z-50">
      {/* Toast notifications will be injected here */}
    </div>
  );
}

export function toast({ title, description, type = 'default' }) {
  // Simple toast notification function
  const toastContainer = document.getElementById('toaster-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 mb-3 
                     border-l-4 ${type === 'error' ? 'border-red-500' : 
                     type === 'success' ? 'border-green-500' : 'border-blue-500'}
                     flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-5`;

  const titleElement = document.createElement('div');
  titleElement.className = 'font-medium';
  titleElement.textContent = title || '';
  
  const descriptionElement = document.createElement('div');
  descriptionElement.className = 'text-sm text-muted-foreground';
  descriptionElement.textContent = description || '';

  toast.appendChild(titleElement);
  if (description) {
    toast.appendChild(descriptionElement);
  }

  toastContainer.appendChild(toast);

  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 5000);
}

export default { Toaster, toast };
EOL
  echo "Created toaster component"
fi

echo "Missing UI components are now ready!"
chmod +x ./fix-missing-modules.sh
