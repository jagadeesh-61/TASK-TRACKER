import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';

const ToastContext = createContext(null);
const TOAST_DURATION_MS = 4000;
const TOAST_ICONS = { success: 'checkCircle', danger: 'alert', warning: 'alert', info: 'check' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, variant = 'success') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container position-fixed top-0 end-0 p-3" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast show app-toast toast-${toast.variant} mb-2`} role="status">
            <div className="d-flex align-items-center p-3 gap-2">
              <span className="toast-icon">
                <Icon name={TOAST_ICONS[toast.variant] ?? 'check'} size={20} />
              </span>
              <div className="flex-grow-1 small fw-medium">{toast.message}</div>
              <button type="button" className="btn-close btn-sm" aria-label="Close" onClick={() => dismiss(toast.id)} />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns showToast(message, variant = 'success' | 'danger' | 'warning' | 'info'). */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
