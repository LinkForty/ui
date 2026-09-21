import { useCallback, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Toast } from '../types';

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: AlertCircle,
};

const colors = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

const iconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

export function ToastItem({ toast, onClose }: ToastProps) {
  const Icon = icons[toast.type];

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const handleClose = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onClose(toast.id);
    },
    [onClose, toast.id]
  );

  const stopClickPropagation = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={`max-w-md w-full shadow-lg rounded-lg pointer-events-auto border ${colors[toast.type]} animate-slide-in`}
      onClick={stopClickPropagation}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${iconColors[toast.type]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">{toast.message}</p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
