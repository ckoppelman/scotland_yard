import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ToastVariant = "info" | "error";

type ToastItem = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
    showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return ctx;
}

const TOAST_MS = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const idRef = useRef(0);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, variant: ToastVariant = "info") => {
            const id = ++idRef.current;
            setToasts((prev) => [...prev, { id, message, variant }]);
            window.setTimeout(() => remove(id), TOAST_MS);
        },
        [remove],
    );

    const value = useMemo(() => ({ showToast }), [showToast]);

    const toastLayer = (
        <div className="toast-region" aria-live="polite" aria-relevant="additions text">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.variant}`} role="status">
                    {t.message}
                </div>
            ))}
        </div>
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            {createPortal(toastLayer, document.body)}
        </ToastContext.Provider>
    );
}
