import { toasts, dismissToast } from '@/signals/uiSignals';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export function ToastContainer() {
  const toastList = toasts.value;

  if (toastList.length === 0) return null;

  return (
    <div className={styles.container} aria-label="Notifications">
      {toastList.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}
