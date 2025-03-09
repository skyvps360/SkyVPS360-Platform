import React from 'react';
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
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
