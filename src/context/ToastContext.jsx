import { createContext, useCallback, useContext, useState, useRef } from 'react';
import { BsCheckCircleFill, BsXCircleFill, BsInfoCircleFill, BsExclamationTriangleFill, BsX } from 'react-icons/bs';

const ToastContext = createContext(null);

let toastIdCounter = 0;

const ICONS = {
  success: <BsCheckCircleFill size={16} className="shrink-0" />,
  error: <BsXCircleFill size={16} className="shrink-0" />,
  info: <BsInfoCircleFill size={16} className="shrink-0" />,
  warning: <BsExclamationTriangleFill size={16} className="shrink-0" />,
};

const COLORS = {
  success: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
  error: 'bg-red-500/15 border-red-500/25 text-red-300',
  info: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300',
  warning: 'bg-amber-500/15 border-amber-500/25 text-amber-300',
};

function Toast({ toast, onDismiss }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl shadow-black/40 max-w-sm w-full animate-toast-in ${COLORS[toast.type]}`}
      role="alert"
    >
      {ICONS[toast.type]}
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
      >
        <BsX size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    return addToast(message, type, duration);
  }, [addToast]);

  toast.success = (message, duration) => addToast(message, 'success', duration);
  toast.error = (message, duration) => addToast(message, 'error', duration);
  toast.info = (message, duration) => addToast(message, 'info', duration);
  toast.warning = (message, duration) => addToast(message, 'warning', duration);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** @returns {(message: string, type?: 'success'|'error'|'info'|'warning', duration?: number) => number} */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}
