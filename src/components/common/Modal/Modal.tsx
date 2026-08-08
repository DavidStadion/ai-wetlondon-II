import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import styles from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ComponentChildren;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Hide the default title bar so the content can lead (e.g. a full-bleed image). */
  hideHeader?: boolean;
  /** Remove the content padding so children can bleed to the edges. */
  flush?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  hideHeader = false,
  flush = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const modal = (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`${styles.modal} ${styles[`modal--${size}`]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {hideHeader ? (
          <button
            type="button"
            className={styles.closeFloating}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        ) : (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}
        <div className={`${styles.content} ${flush ? styles.contentFlush : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );

  // Portal to #preact-root to inherit CSS variables, fall back to body
  const container = document.getElementById('preact-root') || document.body;
  return createPortal(modal, container);
}
