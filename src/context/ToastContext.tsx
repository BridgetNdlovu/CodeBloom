/* eslint-disable react-refresh/only-export-components -- Provider and hook share one context. */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = nextToastId++;
      setToasts((current) => [...current, { id, message, type }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 3600);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="cb-toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="cb-toast" data-toast-type={t.type}>
            {t.type === "success" ? (
              <CheckCircle2 size={20} aria-hidden />
            ) : t.type === "error" ? (
              <XCircle size={20} aria-hidden />
            ) : (
              <Info size={20} aria-hidden />
            )}
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
