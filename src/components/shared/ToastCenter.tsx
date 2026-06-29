import { AnimatePresence, motion } from "framer-motion";

export interface ToastMessage {
  id: string;
  tone: "info" | "success" | "warning" | "error";
  message: string;
}

interface ToastCenterProps {
  toasts: ToastMessage[];
}

export function ToastCenter({ toasts }: ToastCenterProps) {
  return (
    <div className="toast-center">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.tone}`}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
