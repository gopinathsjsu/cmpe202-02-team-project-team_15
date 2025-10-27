import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Toast, ToastProps } from "../components/Toast";

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, "id" | "onClose">) => string;
  hideToast: (id: string) => void;
  showLoading: (title: string, message?: string) => string;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, "id" | "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (toastId: string) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      },
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showLoading = useCallback((title: string, message?: string) => {
    return showToast({
      type: "loading",
      title,
      message,
    });
  }, [showToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    return showToast({
      type: "success",
      title,
      message,
      duration: 4000,
    });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    return showToast({
      type: "error",
      title,
      message,
      duration: 6000,
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    return showToast({
      type: "info",
      title,
      message,
      duration: 4000,
    });
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    hideToast,
    showLoading,
    showSuccess,
    showError,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Render all toasts */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
